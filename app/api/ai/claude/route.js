import { withApiResources } from '../../../lib/api-resource-guard.js';
import { createGenerationLifecycle, generationAbortResponse } from '../../../lib/ai-request-lifecycle.js';
import { streamAiResponse, createClaudeMapper } from '../../../lib/ai-stream.js';
// Claude 兼容 Messages API — SSE 流式转发
// 使用 Anthropic 兼容格式 (/v1/messages)

export const runtime = 'nodejs';
export const maxDuration = 120;

import { applyContentSafety } from '../../../lib/content-safety';
import { proxyFetch } from '../../../lib/proxy-fetch';
import { rotateKey } from '../../../lib/keyRotator';
import { isOutboundRequestBlocked, isServerCredentialBlocked, resolveAiCredential, safeUpstreamDetail } from '../../../lib/server-security.mjs';
import { buildClaudeRequestParams } from '../../../lib/ai-model-rules.js';

// Anthropic 格式的搜索工具定义
const WEB_SEARCH_TOOL = {
    name: 'web_search',
    description: '搜索互联网获取最新信息。当用户问到你不确定、需要实时数据、或涉及近期事件的问题时，调用此工具。',
    input_schema: {
        type: 'object',
        properties: {
            query: { type: 'string', description: '要搜索的关键词或问题' },
        },
        required: ['query'],
    },
};

// 内联搜索执行（与 /api/ai/route.js 共享逻辑）
async function executeSearch(query, searchConfig, proxyUrl, signal) {
    const provider = searchConfig.provider || 'tavily';
    searchConfig.apiKey = rotateKey(searchConfig.apiKey);
    switch (provider) {
        case 'tavily': {
            const tavilyBase = (searchConfig.baseUrl || 'https://api.tavily.com').replace(/\/$/, '');
            const res = await proxyFetch(`${tavilyBase}/search`, {
                method: 'POST', signal,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ api_key: searchConfig.apiKey, query, max_results: 5, include_answer: false }),
            }, proxyUrl);
            if (!res.ok) { await res.body?.cancel().catch(() => {}); console.error('Tavily Search error:', res.status); return []; }
            const data = await res.json();
            return (data.results || []).map(item => ({ title: item.title || '', url: item.url || '', snippet: item.content || '' }));
        }
        case 'exa': {
            const exaBase = (searchConfig.baseUrl || 'https://api.exa.ai').replace(/\/$/, '');
            const res = await proxyFetch(`${exaBase}/search`, {
                method: 'POST', signal,
                headers: { 'Content-Type': 'application/json', 'x-api-key': searchConfig.apiKey },
                body: JSON.stringify({ query, type: 'auto', numResults: 5, contents: { highlights: { numSentences: 3 } } }),
            }, proxyUrl);
            if (!res.ok) { await res.body?.cancel().catch(() => {}); console.error('Exa Search error:', res.status); return []; }
            const data = await res.json();
            return (data.results || []).map(item => ({ title: item.title || '', url: item.url || '', snippet: (item.highlights || []).join(' ') || item.text || '' }));
        }
        default: return [];
    }
}

async function handlePOST(request) {
    const lifecycle = createGenerationLifecycle(request.signal);
    const { signal } = lifecycle;
    try {
        signal.throwIfAborted();
        const { systemPrompt, userPrompt, apiConfig, maxTokens, temperature, topP, reasoningEffort, tools: toolsConfig } = await request.json();
        const proxyUrl = apiConfig?.proxyUrl || '';

        const credential = resolveAiCredential({
            request,
            clientApiKey: apiConfig?.apiKey,
            clientBaseUrl: apiConfig?.baseUrl,
            envApiKey: process.env.CLAUDE_API_KEY,
            envBaseUrl: process.env.CLAUDE_BASE_URL,
        });
        const apiKey = rotateKey(credential.apiKey);
        const baseUrl = credential.baseUrl;
        const model = apiConfig?.model || process.env.CLAUDE_MODEL || 'claude-opus-5-5';

        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: '请先配置 Claude 兼容 API Key', code: 'NO_API_KEY_CLAUDE' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (!baseUrl) {
            return new Response(
                JSON.stringify({ error: '请先填写 Claude 兼容 API 地址', code: 'NO_BASE_URL_CLAUDE' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const url = baseUrl.endsWith('/v1') ? baseUrl + '/messages' : baseUrl + '/v1/messages';
        const commonHeaders = {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        };

        // 将 system prompt 转为 content block 格式并启用提示缓存
        const safeSystemPrompt = applyContentSafety(systemPrompt);
        const systemBlocks = [
            {
                type: 'text',
                text: safeSystemPrompt,
                cache_control: { type: 'ephemeral' },
            }
        ];

        // 思考与采样参数按模型分流：新一代用 adaptive + output_config.effort，
        // Haiku 4.5 及更早、以及无法识别的兼容模型继续用 budget_tokens
        const baseParams = {
            model,
            system: systemBlocks,
            ...buildClaudeRequestParams({ model, maxTokens, temperature, topP, reasoningEffort }),
        };

        const messages = [
            { role: 'user', content: userPrompt }
        ];

        // ===== Function Calling 搜索模式 =====
        if (toolsConfig?.functionSearch && toolsConfig?.searchConfig?.apiKey) {
            if (!toolsConfig.searchConfig.provider) {
                toolsConfig.searchConfig.provider = toolsConfig.searchConfig.tool || 'tavily';
            }

            // 第 1 轮：非流式请求，附带搜索工具定义
            const round1Res = await proxyFetch(url, {
                method: 'POST', signal,
                headers: commonHeaders,
                body: JSON.stringify({
                    ...baseParams,
                    messages,
                    tools: [WEB_SEARCH_TOOL],
                }),
            }, proxyUrl);

            if (!round1Res.ok) {
                const errorText = await round1Res.text();
                console.error('Claude 兼容 Function Calling 第1轮错误:', round1Res.status);
                return errorResponse(round1Res.status, errorText);
            }

            const round1Data = await round1Res.json();
            signal.throwIfAborted();

            // 检查模型是否使用了 tool_use
            const toolUseBlocks = (round1Data.content || []).filter(b => b.type === 'tool_use');

            if (toolUseBlocks.length > 0) {
                // 收集搜索结果和来源
                const allSources = [];
                const toolResults = [];

                for (const toolBlock of toolUseBlocks) {
                    if (toolBlock.name === 'web_search') {
                        const searchQuery = toolBlock.input?.query || userPrompt;

                        try {
                            const results = await executeSearch(searchQuery, toolsConfig.searchConfig, proxyUrl, signal);

                            const resultText = results.length > 0
                                ? results.map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.snippet}`).join('\n\n')
                                : '没有找到相关搜索结果。';

                            toolResults.push({
                                type: 'tool_result',
                                tool_use_id: toolBlock.id,
                                content: resultText,
                            });

                            for (const r of results) {
                                allSources.push({ title: r.title, uri: r.url });
                            }
                        } catch (searchErr) {
                            signal.throwIfAborted();
                            console.error('搜索执行失败:', searchErr?.code || searchErr?.name || 'UNKNOWN');
                            toolResults.push({
                                type: 'tool_result',
                                tool_use_id: toolBlock.id,
                                content: '搜索失败，请直接回答用户的问题。',
                            });
                        }
                    }
                }

                // 第 2 轮：流式请求，附带搜索结果
                const round2Messages = [
                    ...messages,
                    { role: 'assistant', content: round1Data.content },
                    { role: 'user', content: toolResults },
                ];

                const round2Res = await proxyFetch(url, {
                    method: 'POST', signal,
                    headers: commonHeaders,
                    body: JSON.stringify({
                        ...baseParams,
                        messages: round2Messages,
                        stream: true,
                    }),
                }, proxyUrl);

                if (!round2Res.ok) {
                    const errorText = await round2Res.text();
                    console.error('Claude 兼容 Function Calling 第2轮错误:', round2Res.status);
                    return errorResponse(round2Res.status, errorText);
                }

                // 流式转发 + 前置发送搜索来源
                return streamClaudeResponse(round2Res, allSources, lifecycle);
            }

            // 模型没调用工具 → 直接把非流式结果包装成 SSE 返回
            const encoder = new TextEncoder();
            const textContent = (round1Data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
            const thinkingContent = (round1Data.content || []).filter(b => b.type === 'thinking').map(b => b.thinking).join('');
            const stream = new ReadableStream({
                start(controller) {
                    if (thinkingContent) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ thinking: thinkingContent })}\n\n`));
                    }
                    if (textContent) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: textContent })}\n\n`));
                    }
                    if (round1Data.usage) {
                        const cachedTokens = (round1Data.usage.cache_read_input_tokens || 0);
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                            usage: {
                                promptTokens: round1Data.usage.input_tokens || 0,
                                completionTokens: round1Data.usage.output_tokens || 0,
                                totalTokens: (round1Data.usage.input_tokens || 0) + (round1Data.usage.output_tokens || 0),
                                cachedTokens,
                            }
                        })}\n\n`));
                    }
                    if (!Array.isArray(round1Data.content) || (round1Data.stop_reason && !['end_turn', 'stop_sequence'].includes(round1Data.stop_reason))) {
                        controller.enqueue(encoder.encode('data: {"status":"incomplete","code":"AI_STREAM_INCOMPLETE","error":"生成未完成。"}\n\n'));
                    } else {
                        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    }
                    controller.close();
                },
            });
            return new Response(stream, {
                headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
            });
        }

        // ===== 普通流式请求（无搜索）=====
        const requestBody = {
            ...baseParams,
            messages,
            stream: true,
        };

        const response = await proxyFetch(url, {
            method: 'POST', signal,
            headers: commonHeaders,
            body: JSON.stringify(requestBody),
        }, proxyUrl);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Claude 兼容 API 错误:', response.status);
            return errorResponse(response.status, errorText);
        }

        return streamClaudeResponse(response, [], lifecycle);

    } catch (error) {
        const aborted = generationAbortResponse(lifecycle);
        if (aborted) return aborted;
        console.error('Claude 兼容接口错误:', error?.code || error?.name || 'UNKNOWN');
        if (isServerCredentialBlocked(error)) {
            return new Response(
                JSON.stringify({ error: error.message, code: error.code }),
                { status: 403, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
            );
        }
        if (isOutboundRequestBlocked(error)) {
            return new Response(
                JSON.stringify({ error: error.message, code: error.code }),
                { status: 400, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
            );
        }
        return new Response(
            JSON.stringify({ error: '网络连接失败，请检查 API 地址是否正确', code: 'NETWORK_ERROR_CHECK' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    } finally {
        if (!lifecycle.streaming) lifecycle.dispose();
    }
}

// ===== 错误响应 =====
function errorResponse(status, errorText = '') {
    let errMsg = '';
    let code = '';
    let detail = '';

    if (status === 401) { errMsg = 'API Key 无效或已过期，请检查后重新填写'; code = 'AI_INVALID_KEY'; }
    else if (status === 403) { errMsg = 'API Key 无权限或已被禁用'; code = 'AI_NO_PERMISSION'; }
    else if (status === 429) { errMsg = '请求频率过高或额度不足，请稍后再试'; code = 'AI_RATE_LIMIT'; }
    else if (status === 529) { errMsg = 'Anthropic API 过载，请稍后再试'; code = 'AI_OVERLOADED'; }

    if (!code && errorText) {
        try {
            const errObj = JSON.parse(errorText);
            const msg = safeUpstreamDetail(errObj?.error?.message || '', 300);
            const upstreamCode = errObj?.error?.code || '';
            if (upstreamCode === 'insufficient_user_quota' || msg.includes('额度') || msg.includes('quota')) {
                errMsg = 'API 账户余额不足，请充值后重试'; code = 'AI_INSUFFICIENT_QUOTA';
            } else if (msg.includes('Context window is full') || msg.includes('context_length') || msg.includes('too many tokens')) {
                errMsg = '上下文过长：设定集 + 前文 + 对话内容超出模型上下文窗口，请减少勾选的参考内容或清空对话历史'; code = 'AI_CONTEXT_TOO_LONG';
            } else if (msg.includes('too long') || msg.includes('maximum context length')) {
                errMsg = '输入内容过长，请减少勾选的参考内容或缩短对话历史'; code = 'AI_INPUT_TOO_LONG';
            } else if (msg) {
                errMsg = `Claude 服务错误：${msg}`; code = 'AI_SERVICE_ERROR'; detail = msg;
            }
        } catch { /* ignore */ }
    }
    if (!errMsg) { errMsg = `Claude 服务返回错误(${status})，请检查 API 配置`; code = 'AI_RETURNED_ERROR'; }

    return new Response(
        JSON.stringify({ error: errMsg, code, status, detail }),
        { status, headers: { 'Content-Type': 'application/json' } }
    );
}

// ===== 流式转发 Claude SSE 响应（可选前置搜索来源）=====
function streamClaudeResponse(response, sources, lifecycle) {
    return streamAiResponse(response, lifecycle, createClaudeMapper(), sources?.length
        ? [{ grounding: { searchQueries: [], sources, supports: [] } }] : []);
}

export const POST = withApiResources('/api/ai/claude', handlePOST);
