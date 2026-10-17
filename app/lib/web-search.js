// Function Calling 外部搜索的公共部分：搜索服务错误分类、给模型看的失败说明，
// 以及 DeepSeek 搜索（POST {base}/v1/tools/search）的请求拼装和结果整理。
//
// 这里不发网络请求、不读环境变量：发送由调用方传入的 fetchImpl 完成（路由里是
// proxyFetch），搜索地址和 Key 都由客户端随请求传入，默认地址见 app/lib/search-config.js。

export const DEEPSEEK_SEARCH_PATH = '/v1/tools/search';

const DEEPSEEK_MAX_QUERY_CHARS = 128;
const DEEPSEEK_MAX_COUNT = 50;
const DEFAULT_RESULT_COUNT = 5;
const MAX_TITLE_CHARS = 300;
const MAX_SNIPPET_CHARS = 2000;
const DEFAULT_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 3000;

// 只有这些错误码会出现在 searchNotice 事件里，前端按码出三语提示（api-error-i18n.js）。
export const SEARCH_ERROR_MESSAGES = {
    SEARCH_NO_BASE_URL: '请先填写搜索服务地址',
    SEARCH_NO_API_KEY: '请先配置搜索服务的 API Key',
    SEARCH_INVALID_QUERY: '搜索关键词不能为空',
    SEARCH_INVALID_KEY: '搜索服务的 API Key 无效或无权限',
    SEARCH_INSUFFICIENT_BALANCE: '搜索服务账户余额不足',
    SEARCH_RATE_LIMITED: '搜索请求太频繁，已被限速',
    SEARCH_UNAVAILABLE: '搜索服务暂时不可用',
    SEARCH_REQUEST_REJECTED: '搜索请求被拒绝',
    SEARCH_INVALID_RESPONSE: '搜索服务返回了无法识别的结果',
};

// 出现这些错误后，同一轮里剩下的搜索不再发出：Key 和余额问题重试没用，限速时继续请求只会更糟。
const ROUND_BLOCKING_CODES = new Set(['SEARCH_NO_BASE_URL', 'SEARCH_NO_API_KEY', 'SEARCH_INVALID_KEY', 'SEARCH_INSUFFICIENT_BALANCE', 'SEARCH_RATE_LIMITED']);

const TOOL_FAILURE_TEXT = {
    SEARCH_RATE_LIMITED: '搜索服务暂时限速，这次没有拿到搜索结果。请根据已有知识回答，并告诉用户联网搜索被限速、稍后可以再试。',
    SEARCH_INSUFFICIENT_BALANCE: '搜索服务账户余额不足，这次没有拿到搜索结果。请根据已有知识回答，并告诉用户需要检查搜索服务的账户余额。',
    SEARCH_INVALID_KEY: '搜索服务的 API Key 无效，这次没有拿到搜索结果。请根据已有知识回答，并告诉用户检查搜索设置中的 API Key。',
};
const DEFAULT_TOOL_FAILURE_TEXT = '搜索失败，请直接回答用户的问题。';

export class SearchProviderError extends Error {
    constructor(code, { provider = '', status = 0, retryable = false } = {}) {
        super(SEARCH_ERROR_MESSAGES[code] || '搜索请求失败');
        this.name = 'SearchProviderError';
        this.code = code;
        this.provider = provider;
        this.status = status;
        this.retryable = retryable;
    }
}

export function isSearchProviderError(error) {
    return error?.name === 'SearchProviderError' && typeof error.code === 'string';
}

export function isSearchRoundBlocked(error) {
    return isSearchProviderError(error) && ROUND_BLOCKING_CODES.has(error.code);
}

/** 搜索失败时作为 tool 结果交给模型的文字，让模型照常作答并说明原因。 */
export function searchFailureToolText(error) {
    return (isSearchProviderError(error) && TOOL_FAILURE_TEXT[error.code]) || DEFAULT_TOOL_FAILURE_TEXT;
}

/** 发给前端的 searchNotice 事件内容；非搜索服务错误（网络、地址被拦截等）返回 null。 */
export function searchNoticeFromError(error) {
    if (!isSearchProviderError(error)) return null;
    return { code: error.code, provider: error.provider, ...(error.status ? { status: error.status } : {}) };
}

/** 把 /api/tools/search 的错误响应状态码对齐到上游含义。 */
export function searchErrorHttpStatus(error) {
    if (!isSearchProviderError(error)) return 500;
    if (error.status >= 400 && error.status < 600) return error.status;
    return error.code === 'SEARCH_INVALID_RESPONSE' ? 502 : 400;
}

function clipText(value, maxChars) {
    if (typeof value !== 'string') return '';
    const text = value.trim();
    return text.length > maxChars ? `${text.slice(0, maxChars)}…` : text;
}

/** 用户可能填服务商根地址、…/v1 或完整的 …/v1/tools/search，统一成接口地址。 */
export function buildDeepSeekSearchUrl(baseUrl) {
    const root = String(baseUrl || '').trim()
        .replace(/\/+$/, '')
        .replace(/\/v1\/tools\/search$/i, '')
        .replace(/\/v1$/i, '');
    if (!root) throw new SearchProviderError('SEARCH_NO_BASE_URL', { provider: 'deepseek' });
    return `${root}${DEEPSEEK_SEARCH_PATH}`;
}

/** query 必须是 1–128 个 Unicode 字符且不能全是空白；count 限制在 1–50。 */
export function buildDeepSeekSearchBody(query, { count = DEFAULT_RESULT_COUNT } = {}) {
    const chars = Array.from(String(query ?? '').trim());
    const trimmedQuery = chars.slice(0, DEEPSEEK_MAX_QUERY_CHARS).join('').trim();
    if (!trimmedQuery) throw new SearchProviderError('SEARCH_INVALID_QUERY', { provider: 'deepseek' });
    const safeCount = Number.isFinite(Number(count))
        ? Math.min(DEEPSEEK_MAX_COUNT, Math.max(1, Math.round(Number(count))))
        : DEFAULT_RESULT_COUNT;
    return { query: trimmedQuery, count: safeCount };
}

/**
 * 映射成与 Tavily / Exa 一致的 {title, url, snippet}。
 * snippet 是给模型读的内容：优先用较长的 summary，没有再退回界面用的 snippet。
 */
export function mapDeepSeekSearchResults(data) {
    if (!data || typeof data !== 'object' || !Array.isArray(data.results)) {
        throw new SearchProviderError('SEARCH_INVALID_RESPONSE', { provider: 'deepseek' });
    }
    return data.results
        .filter(item => item && typeof item === 'object')
        .map(item => ({
            title: clipText(item.title, MAX_TITLE_CHARS),
            url: clipText(item.url, MAX_SNIPPET_CHARS),
            snippet: clipText(item.summary, MAX_SNIPPET_CHARS) || clipText(item.snippet, MAX_SNIPPET_CHARS),
        }))
        .filter(item => item.url || item.snippet);
}

/** 402 余额不足；429 限速；408 / 5xx 可以稍后重试；其他 4xx 改请求前不要重试。 */
export function classifyDeepSeekSearchStatus(status) {
    if (status === 401 || status === 403) return { code: 'SEARCH_INVALID_KEY', retryable: false };
    if (status === 402) return { code: 'SEARCH_INSUFFICIENT_BALANCE', retryable: false };
    if (status === 429) return { code: 'SEARCH_RATE_LIMITED', retryable: true };
    if (status === 408 || status >= 500) return { code: 'SEARCH_UNAVAILABLE', retryable: true };
    return { code: 'SEARCH_REQUEST_REJECTED', retryable: false };
}

/** Retry-After 可以是秒数或 HTTP 日期；没有或无法解析时用默认等待，最长等 3 秒。 */
export function retryDelayFromHeader(value, fallbackMs = DEFAULT_RETRY_DELAY_MS, now = Date.now()) {
    const raw = String(value ?? '').trim();
    let ms = NaN;
    if (/^\d+(\.\d+)?$/.test(raw)) ms = Number(raw) * 1000;
    else if (raw) ms = Date.parse(raw) - now;
    if (!Number.isFinite(ms) || ms < 0) ms = fallbackMs;
    return Math.min(MAX_RETRY_DELAY_MS, Math.max(0, ms));
}

function abortableDelay(ms, signal) {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) { reject(signal.reason); return; }
        const onAbort = () => { clearTimeout(timer); reject(signal.reason); };
        const timer = setTimeout(() => { signal?.removeEventListener('abort', onAbort); resolve(); }, ms);
        signal?.addEventListener('abort', onAbort, { once: true });
    });
}

/**
 * 调用 DeepSeek 搜索。限速（账号级每秒 5 次）、408 和 5xx 会等一下再试一次，
 * 仍失败或遇到其他错误时抛出 SearchProviderError，由调用方决定怎么告诉模型和用户。
 * 网络错误、地址被拦截和取消原样抛出。
 */
export async function runDeepSeekSearch({
    query, apiKey, baseUrl, fetchImpl, signal, count = DEFAULT_RESULT_COUNT,
    maxRetries = 1, retryDelayMs = DEFAULT_RETRY_DELAY_MS, wait = abortableDelay,
}) {
    if (typeof fetchImpl !== 'function') throw new TypeError('fetchImpl is required');
    const url = buildDeepSeekSearchUrl(baseUrl);
    const body = JSON.stringify(buildDeepSeekSearchBody(query, { count }));
    if (!String(apiKey || '').trim()) throw new SearchProviderError('SEARCH_NO_API_KEY', { provider: 'deepseek' });

    for (let attempt = 0; ; attempt++) {
        signal?.throwIfAborted();
        const res = await fetchImpl(url, {
            method: 'POST', signal,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${String(apiKey).trim()}` },
            body,
        });
        if (res.ok) {
            let data;
            try { data = await res.json(); }
            catch { throw new SearchProviderError('SEARCH_INVALID_RESPONSE', { provider: 'deepseek', status: res.status }); }
            return mapDeepSeekSearchResults(data);
        }
        const retryAfter = res.headers?.get?.('retry-after');
        await res.body?.cancel().catch(() => {});
        const { code, retryable } = classifyDeepSeekSearchStatus(res.status);
        if (retryable && attempt < maxRetries) {
            await wait(retryDelayFromHeader(retryAfter, retryDelayMs), signal);
            continue;
        }
        throw new SearchProviderError(code, { provider: 'deepseek', status: res.status, retryable });
    }
}
