import assert from 'node:assert/strict';
import test from 'node:test';
import { registerHooks } from 'node:module';

import {
    buildDeepSeekSearchBody,
    buildDeepSeekSearchUrl,
    classifyDeepSeekSearchStatus,
    isSearchRoundBlocked,
    mapDeepSeekSearchResults,
    retryDelayFromHeader,
    runDeepSeekSearch,
    SearchProviderError,
    searchErrorHttpStatus,
    searchFailureToolText,
    searchNoticeFromError,
} from '../app/lib/web-search.js';
import {
    DEEPSEEK_SEARCH_DEFAULT_BASE_URL,
    deepSeekSearchPrefill,
    findConfiguredDeepSeekApi,
    getSearchTool,
    resolveFunctionSearchConfig,
} from '../app/lib/search-config.js';
import { splitApiSecrets } from '../app/lib/api-secret-storage.js';
import { localizeApiError } from '../app/lib/api-error-i18n.js';
import { readAiEvents } from '../app/lib/ai-stream.js';

// 所有请求都走模拟 fetch，不连接真实搜索接口。
function mockFetch(responses) {
    const calls = [];
    let cancelled = 0;
    const fetchImpl = async (url, options) => {
        calls.push({ url, options, body: options?.body ? JSON.parse(options.body) : undefined });
        const next = responses[Math.min(calls.length - 1, responses.length - 1)];
        const response = typeof next === 'function' ? next() : next;
        if (response.body) {
            const original = response.body.cancel.bind(response.body);
            response.body.cancel = (...args) => { cancelled++; return original(...args); };
        }
        return response;
    };
    return { fetchImpl, calls, cancelledCount: () => cancelled };
}

const status = (code, headers = {}) => () => new Response(JSON.stringify({ error: { message: 'synthetic', type: 'invalid_request_error', param: null, code: 'invalid_request_error' } }), { status: code, headers });
const ok = data => () => Response.json(data);
const noWait = async () => {};
const sample = {
    results: [
        { rerank_score: 2.1, title: 'Example title', url: 'https://example.test/a', snippet: 'Short display summary.', summary: 'Longer summary for the model.', content: '', site_name: 'Example', date: '2026-06-01T00:00:00+00:00', authority: 3 },
        { title: 'Snippet only', url: 'https://example.test/b', snippet: 'Only a snippet.', summary: '' },
    ],
};

test('search URL accepts a bare host, a /v1 base, trailing slashes or the full endpoint', () => {
    for (const base of ['https://search.example.test', 'https://search.example.test/', 'https://search.example.test/v1', 'https://search.example.test/v1/', 'https://search.example.test/v1/tools/search']) {
        assert.equal(buildDeepSeekSearchUrl(base), 'https://search.example.test/v1/tools/search');
    }
    assert.throws(() => buildDeepSeekSearchUrl('  '), { code: 'SEARCH_NO_BASE_URL' });
});

test('request body keeps the query within 1–128 Unicode characters and clamps count', () => {
    assert.deepEqual(buildDeepSeekSearchBody('  hello  '), { query: 'hello', count: 5 });
    const long = '搜'.repeat(100) + '😀'.repeat(40);
    const body = buildDeepSeekSearchBody(long, { count: 99 });
    assert.equal(Array.from(body.query).length, 128);
    assert.equal(body.query.endsWith('😀'), true, 'surrogate pairs must not be split');
    assert.equal(body.count, 50);
    assert.equal(buildDeepSeekSearchBody('x', { count: 0 }).count, 1);
    assert.equal(buildDeepSeekSearchBody('x', { count: 'many' }).count, 5);
    assert.throws(() => buildDeepSeekSearchBody(' \n\t '), { code: 'SEARCH_INVALID_QUERY' });
    assert.throws(() => buildDeepSeekSearchBody(undefined), { code: 'SEARCH_INVALID_QUERY' });
});

test('results map to {title, url, snippet} with summary preferred for the model', () => {
    assert.deepEqual(mapDeepSeekSearchResults(sample), [
        { title: 'Example title', url: 'https://example.test/a', snippet: 'Longer summary for the model.' },
        { title: 'Snippet only', url: 'https://example.test/b', snippet: 'Only a snippet.' },
    ]);
    assert.deepEqual(mapDeepSeekSearchResults({ results: [] }), []);
    assert.deepEqual(mapDeepSeekSearchResults({ results: [null, 'x', { title: 'no url or text' }] }), []);
    const huge = mapDeepSeekSearchResults({ results: [{ url: 'https://example.test', summary: 'a'.repeat(5000) }] });
    assert.ok(huge[0].snippet.length <= 2001);
    for (const bad of [null, {}, { results: 'nope' }]) {
        assert.throws(() => mapDeepSeekSearchResults(bad), { code: 'SEARCH_INVALID_RESPONSE' });
    }
});

test('successful search sends bearer auth and only documented fields', async () => {
    const { fetchImpl, calls } = mockFetch([ok(sample)]);
    const results = await runDeepSeekSearch({ query: 'weather today', apiKey: ' test-key ', baseUrl: 'https://search.example.test/v1', fetchImpl, wait: noWait });
    assert.equal(results.length, 2);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://search.example.test/v1/tools/search');
    assert.equal(calls[0].options.method, 'POST');
    assert.equal(calls[0].options.headers.Authorization, 'Bearer test-key');
    assert.equal(calls[0].options.headers['Content-Type'], 'application/json');
    assert.deepEqual(calls[0].body, { query: 'weather today', count: 5 });
});

test('missing key or address fails before any request is sent', async () => {
    const { fetchImpl, calls } = mockFetch([ok(sample)]);
    await assert.rejects(runDeepSeekSearch({ query: 'q', apiKey: '', baseUrl: 'https://search.example.test', fetchImpl }), { code: 'SEARCH_NO_API_KEY' });
    await assert.rejects(runDeepSeekSearch({ query: 'q', apiKey: 'k', baseUrl: '', fetchImpl }), { code: 'SEARCH_NO_BASE_URL' });
    assert.equal(calls.length, 0);
});

test('429 is retried once after Retry-After, then succeeds', async () => {
    const waits = [];
    const { fetchImpl, calls, cancelledCount } = mockFetch([status(429, { 'retry-after': '2' }), ok(sample)]);
    const results = await runDeepSeekSearch({ query: 'q', apiKey: 'k', baseUrl: 'https://search.example.test', fetchImpl, wait: async ms => { waits.push(ms); } });
    assert.equal(results.length, 2);
    assert.equal(calls.length, 2);
    assert.deepEqual(waits, [2000]);
    assert.equal(cancelledCount(), 1, 'error body must be released before retrying');
});

test('repeated 429 ends as SEARCH_RATE_LIMITED that blocks the rest of the round', async () => {
    const { fetchImpl, calls } = mockFetch([status(429)]);
    const error = await runDeepSeekSearch({ query: 'q', apiKey: 'k', baseUrl: 'https://search.example.test', fetchImpl, wait: noWait }).catch(e => e);
    assert.ok(error instanceof SearchProviderError);
    assert.equal(error.code, 'SEARCH_RATE_LIMITED');
    assert.equal(error.status, 429);
    assert.equal(calls.length, 2);
    assert.equal(isSearchRoundBlocked(error), true);
    assert.match(searchFailureToolText(error), /限速/);
    assert.deepEqual(searchNoticeFromError(error), { code: 'SEARCH_RATE_LIMITED', provider: 'deepseek', status: 429 });
    assert.equal(searchErrorHttpStatus(error), 429);
});

test('402 and other 4xx are not retried; 408 and 5xx are retried once', async () => {
    const cases = [
        [402, 'SEARCH_INSUFFICIENT_BALANCE', 1, true],
        [401, 'SEARCH_INVALID_KEY', 1, true],
        [400, 'SEARCH_REQUEST_REJECTED', 1, false],
        [413, 'SEARCH_REQUEST_REJECTED', 1, false],
        [408, 'SEARCH_UNAVAILABLE', 2, false],
        [500, 'SEARCH_UNAVAILABLE', 2, false],
        [504, 'SEARCH_UNAVAILABLE', 2, false],
    ];
    for (const [code, expected, attempts, blocking] of cases) {
        const { fetchImpl, calls } = mockFetch([status(code)]);
        const error = await runDeepSeekSearch({ query: 'q', apiKey: 'k', baseUrl: 'https://search.example.test', fetchImpl, wait: noWait }).catch(e => e);
        assert.equal(error.code, expected, `status ${code}`);
        assert.equal(calls.length, attempts, `status ${code} attempts`);
        assert.equal(isSearchRoundBlocked(error), blocking, `status ${code} blocking`);
    }
    assert.deepEqual(classifyDeepSeekSearchStatus(503), { code: 'SEARCH_UNAVAILABLE', retryable: true });
});

test('a 5xx followed by a non-JSON 200 is reported as an invalid response', async () => {
    const { fetchImpl } = mockFetch([status(503), () => new Response('<html>', { status: 200 })]);
    await assert.rejects(runDeepSeekSearch({ query: 'q', apiKey: 'k', baseUrl: 'https://search.example.test', fetchImpl, wait: noWait }), { code: 'SEARCH_INVALID_RESPONSE' });
});

test('cancelling during the retry wait stops before a second request', async () => {
    const controller = new AbortController();
    const { fetchImpl, calls } = mockFetch([() => { setTimeout(() => controller.abort(), 5); return status(429)(); }]);
    const error = await runDeepSeekSearch({ query: 'q', apiKey: 'k', baseUrl: 'https://search.example.test', fetchImpl, signal: controller.signal, retryDelayMs: 1000 }).catch(e => e);
    assert.equal(error?.name, 'AbortError');
    assert.equal(calls.length, 1);
});

test('network errors are not swallowed into search error codes', async () => {
    const fetchImpl = async () => { throw new TypeError('fetch failed'); };
    await assert.rejects(runDeepSeekSearch({ query: 'q', apiKey: 'k', baseUrl: 'https://search.example.test', fetchImpl, wait: noWait }), TypeError);
    const error = new TypeError('fetch failed');
    assert.equal(searchNoticeFromError(error), null);
    assert.equal(searchFailureToolText(error), '搜索失败，请直接回答用户的问题。');
});

test('Retry-After supports seconds and HTTP dates and is capped at 3 seconds', () => {
    const now = Date.parse('2026-10-17T00:00:00Z');
    assert.equal(retryDelayFromHeader('1', 500, now), 1000);
    assert.equal(retryDelayFromHeader('0', 500, now), 0);
    assert.equal(retryDelayFromHeader('120', 500, now), 3000);
    assert.equal(retryDelayFromHeader(new Date(now + 1500).toUTCString(), 500, now), 1000, 'HTTP dates have second precision');
    assert.equal(retryDelayFromHeader(null, 500, now), 500);
    assert.equal(retryDelayFromHeader('soon', 500, now), 500);
});

test('rate-limit notice is readable in all three languages', () => {
    const zh = a => a, en = (_a, b) => b, ru = (_a, _b, c) => c;
    const payload = { code: 'SEARCH_RATE_LIMITED', provider: 'deepseek' };
    assert.match(localizeApiError(payload, zh), /^联网搜索（DeepSeek）.*限速/);
    assert.match(localizeApiError(payload, en), /^Web search \(DeepSeek\) was rate-limited/);
    assert.match(localizeApiError(payload, ru), /^Веб-поиск \(DeepSeek\)/);
    assert.match(localizeApiError({ code: 'SEARCH_INSUFFICIENT_BALANCE', provider: 'deepseek' }, zh), /余额不足/);
});

// —— 客户端：预填已配置的 DeepSeek 服务商，用户可改 ——

const deepseekActive = (searchConfig, extra = {}) => ({
    provider: 'deepseek', providerType: 'deepseek', apiKey: 'main-key', baseUrl: 'https://relay.example.test/v1', searchConfig, ...extra,
});
const zhipuActive = (searchConfig, providerConfigs = {}) => ({
    provider: 'zhipu', providerType: 'zhipu', apiKey: 'zhipu-key', baseUrl: 'https://llm.example.test', searchConfig, providerConfigs,
});

test('the configured DeepSeek provider is found whether or not it is the active one', () => {
    assert.deepEqual(findConfiguredDeepSeekApi(deepseekActive({})), { apiKey: 'main-key', baseUrl: 'https://relay.example.test/v1' });
    const zhipu = zhipuActive({}, {
        zhipu: { providerType: 'zhipu', apiKey: 'zhipu-key' },
        deepseek_k3x9: { providerType: 'deepseek', apiKey: ' instance-key ', baseUrl: 'https://api.deepseek.example.test' },
    });
    assert.deepEqual(findConfiguredDeepSeekApi(zhipu), { apiKey: 'instance-key', baseUrl: 'https://api.deepseek.example.test' });
    assert.equal(findConfiguredDeepSeekApi(zhipuActive({}, { deepseek: { providerType: 'deepseek', apiKey: '' } })), null);
    // 对话单独配了别的服务商时，还能从主配置里找到
    assert.equal(findConfiguredDeepSeekApi(zhipuActive({}), deepseekActive({})).apiKey, 'main-key');
});

test('choosing DeepSeek search pre-fills only the empty key and URL fields', () => {
    const configured = { apiKey: 'main-key', baseUrl: 'https://relay.example.test/v1' };
    assert.deepEqual(deepSeekSearchPrefill({ tool: 'tavily', apiKey: 'tavily-key' }, configured), { deepseekApiKey: 'main-key', deepseekBaseUrl: 'https://relay.example.test/v1' });
    assert.deepEqual(deepSeekSearchPrefill({ deepseekApiKey: 'own-key', deepseekBaseUrl: 'https://search.example.test' }, configured), {}, 'user edits are kept');
    assert.deepEqual(deepSeekSearchPrefill({}, null), { deepseekBaseUrl: DEEPSEEK_SEARCH_DEFAULT_BASE_URL });
    assert.deepEqual(deepSeekSearchPrefill({}, { apiKey: 'main-key', baseUrl: '' }), { deepseekApiKey: 'main-key', deepseekBaseUrl: DEEPSEEK_SEARCH_DEFAULT_BASE_URL });
});

test('edited DeepSeek search key and URL win over the provider values', () => {
    const config = deepseekActive({ tool: 'deepseek', deepseekApiKey: 'own-key', deepseekBaseUrl: 'https://search.example.test' });
    assert.deepEqual(resolveFunctionSearchConfig(config), { tool: 'deepseek', provider: 'deepseek', apiKey: 'own-key', baseUrl: 'https://search.example.test' });
});

test('empty DeepSeek search fields fall back to the configured provider, then the default URL', () => {
    assert.deepEqual(resolveFunctionSearchConfig(deepseekActive({ tool: 'deepseek' })),
        { tool: 'deepseek', provider: 'deepseek', apiKey: 'main-key', baseUrl: 'https://relay.example.test/v1' });
    const zhipu = zhipuActive({ tool: 'deepseek' }, { deepseek: { providerType: 'deepseek', apiKey: 'ds-key', baseUrl: '' } });
    assert.deepEqual(resolveFunctionSearchConfig(zhipu), { tool: 'deepseek', provider: 'deepseek', apiKey: 'ds-key', baseUrl: DEEPSEEK_SEARCH_DEFAULT_BASE_URL });
    assert.equal(resolveFunctionSearchConfig(zhipuActive({ tool: 'deepseek' })), null, 'no DeepSeek key anywhere');
});

test('the Tavily / Exa key is never sent to DeepSeek search, and other providers never lend their key', () => {
    const zhipu = zhipuActive({ tool: 'deepseek', apiKey: 'tavily-key' });
    assert.equal(resolveFunctionSearchConfig(zhipu), null);
    assert.equal(findConfiguredDeepSeekApi(zhipu), null);
});

test('Tavily and Exa settings pass through unchanged', () => {
    assert.equal(getSearchTool(undefined), 'tavily');
    assert.equal(getSearchTool({ tool: 'unknown' }), 'tavily');
    assert.equal(resolveFunctionSearchConfig({ searchConfig: { tool: 'exa' } }), null);
    assert.deepEqual(resolveFunctionSearchConfig({ searchConfig: { tool: 'exa', apiKey: 'exa-key', baseUrl: '' } }), { tool: 'exa', provider: 'exa', apiKey: 'exa-key', baseUrl: '' });
    // 有 DeepSeek 专用字段也不影响 Tavily / Exa
    assert.equal(resolveFunctionSearchConfig(deepseekActive({ tool: 'tavily', deepseekApiKey: 'own-key' })), null);
});

test('stored DeepSeek search settings keep both keys in the secret store only', () => {
    const split = splitApiSecrets({ searchConfig: { tool: 'deepseek', apiKey: 'tavily-secret', deepseekApiKey: 'search-secret', deepseekBaseUrl: 'https://search.example.test' } });
    assert.deepEqual(split.publicValue.searchConfig, { tool: 'deepseek', apiKey: '', deepseekApiKey: '', deepseekBaseUrl: 'https://search.example.test' });
    assert.equal(split.secrets.searchConfig.deepseekApiKey, 'search-secret');
    assert.equal(JSON.stringify(split.publicValue).includes('secret'), false);
});

// —— 路由：限速时整轮不失败，模型照常作答并带上提示 ——

let instance = 0;
async function routeFixture(route, fetchImpl) {
    const routeUrl = new URL(route === 'search' ? '../app/api/tools/search/route.js' : `../app/api/ai/${route === 'openai' ? '' : route + '/'}route.js`, import.meta.url);
    const id = ++instance;
    const lifecycleUrl = new URL('../app/lib/ai-request-lifecycle.js', import.meta.url).href;
    const mockUrl = `data:text/javascript,${encodeURIComponent(`
        export * from '${lifecycleUrl}';
        let fetcher; export const configure = value => { fetcher = value; };
        export const proxyFetch = (...args) => fetcher(...args);
        export const rotateKey = key => key;
        export const applyContentSafety = text => text;
        export const isOutboundRequestBlocked = () => false;
        export const isServerCredentialBlocked = () => false;
        export const resolveAiCredential = ({clientApiKey, clientBaseUrl}) => ({apiKey: clientApiKey, baseUrl: clientBaseUrl});
        export const safeUpstreamDetail = () => 'Synthetic upstream failure';
        // web-search fixture ${id}
    `)}`;
    (await import(mockUrl)).configure(fetchImpl);
    const hooks = registerHooks({ resolve(specifier, context, nextResolve) {
        if (context.parentURL?.startsWith(routeUrl.href) && /\/(proxy-fetch|keyRotator|content-safety|server-security\.mjs|ai-request-lifecycle\.js)$/.test(specifier)) {
            return { url: mockUrl, shortCircuit: true };
        }
        return nextResolve(specifier, context);
    } });
    try { return await import(`${routeUrl.href}?web-search=${id}`); }
    finally { hooks.deregister(); }
}

const twoSearches = route => route === 'claude'
    ? { content: [1, 2].map(id => ({ type: 'tool_use', id: `search-${id}`, name: 'web_search', input: { query: `query ${id}` } })), stop_reason: 'tool_use' }
    : { choices: [{ message: { content: null, tool_calls: [1, 2].map(id => ({ id: `search-${id}`, type: 'function', function: { name: 'web_search', arguments: JSON.stringify({ query: `query ${id}` }) } })) }, finish_reason: 'tool_calls' }] };
const answerStream = route => new Response(route === 'claude'
    ? 'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"answer"}}\n\ndata: {"type":"message_delta","delta":{"stop_reason":"end_turn"}}\n\ndata: {"type":"message_stop"}\n\n'
    : 'data: {"choices":[{"delta":{"content":"answer"}}]}\n\ndata: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n',
{ headers: { 'content-type': 'text/event-stream' } });
const chatRequest = route => new Request('https://author.example.test/api/ai', { method: 'POST', body: JSON.stringify({
    systemPrompt: 'synthetic', userPrompt: 'synthetic',
    apiConfig: { apiKey: 'main-key', baseUrl: 'https://llm.example.test/v1', model: route === 'claude' ? 'synthetic-claude' : 'synthetic' },
    tools: { functionSearch: true, searchConfig: { provider: 'deepseek', apiKey: 'main-key', baseUrl: 'https://search.example.test' } },
}) });

for (const route of ['openai', 'claude']) {
    test(`${route}: rate-limited DeepSeek search still answers and tells the user`, async () => {
        const calls = [];
        const api = await routeFixture(route, async (url, options) => {
            calls.push({ url, body: JSON.parse(options.body) });
            if (calls.length === 1) return Response.json(twoSearches(route));
            if (url.endsWith('/v1/tools/search')) return new Response('{}', { status: 429, headers: { 'retry-after': '0' } });
            return answerStream(route);
        });
        const response = await api.POST(chatRequest(route));
        const events = [];
        for await (const event of readAiEvents(response)) events.push(event);

        const searchCalls = calls.filter(c => c.url.endsWith('/v1/tools/search'));
        assert.equal(searchCalls.length, 2, 'first search retries once, the second search is skipped');
        assert.equal(searchCalls[0].body.query, 'query 1');
        assert.equal(calls.length, 4);
        assert.deepEqual(events.find(e => e.searchNotice)?.searchNotice, { code: 'SEARCH_RATE_LIMITED', provider: 'deepseek', status: 429 });
        assert.equal(events.filter(e => e.text).map(e => e.text).join(''), 'answer');

        const round2 = calls[3].body;
        const toolTexts = route === 'claude'
            ? round2.messages.at(-1).content.map(block => block.content)
            : round2.messages.filter(m => m.role === 'tool').map(m => m.content);
        assert.equal(toolTexts.length, 2);
        for (const text of toolTexts) assert.match(text, /限速/);
    });

    test(`${route}: DeepSeek search results reach the model and the source list`, async () => {
        const calls = [];
        const api = await routeFixture(route, async (url, options) => {
            calls.push({ url, body: JSON.parse(options.body) });
            if (calls.length === 1) return Response.json(twoSearches(route));
            if (url.endsWith('/v1/tools/search')) return Response.json(sample);
            return answerStream(route);
        });
        const events = [];
        for await (const event of readAiEvents(await api.POST(chatRequest(route)))) events.push(event);
        assert.equal(calls.length, 4);
        assert.equal(events.some(e => e.searchNotice), false);
        assert.deepEqual(events.find(e => e.grounding).grounding.sources.slice(0, 2), [
            { title: 'Example title', uri: 'https://example.test/a' },
            { title: 'Snippet only', uri: 'https://example.test/b' },
        ]);
        const round2 = JSON.stringify(calls[3].body);
        assert.match(round2, /Longer summary for the model\./);
        assert.doesNotMatch(round2, /Short display summary\./);
    });
}

test('/api/tools/search maps DeepSeek errors to status and code', async () => {
    const api = await routeFixture('search', async () => new Response('{}', { status: 402 }));
    const response = await api.POST(new Request('https://author.example.test/api/tools/search', { method: 'POST', body: JSON.stringify({ query: 'q', searchConfig: { provider: 'deepseek', apiKey: 'k', baseUrl: 'https://search.example.test' } }) }));
    assert.equal(response.status, 402);
    assert.equal((await response.json()).code, 'SEARCH_INSUFFICIENT_BALANCE');
});

test('/api/tools/search has no built-in DeepSeek address', async () => {
    let calls = 0;
    const api = await routeFixture('search', async () => { calls++; return Response.json(sample); });
    const response = await api.POST(new Request('https://author.example.test/api/tools/search', { method: 'POST', body: JSON.stringify({ query: 'q', searchConfig: { provider: 'deepseek', apiKey: 'k' } }) }));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).code, 'SEARCH_NO_BASE_URL');
    assert.equal(calls, 0);

    const okResponse = await api.POST(new Request('https://author.example.test/api/tools/search', { method: 'POST', body: JSON.stringify({ query: 'q', searchConfig: { provider: 'deepseek', apiKey: 'k', baseUrl: 'https://search.example.test' } }) }));
    assert.equal(okResponse.status, 200);
    assert.equal((await okResponse.json()).results[0].snippet, 'Longer summary for the model.');
});
