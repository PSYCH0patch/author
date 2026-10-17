// 外部搜索（Function Calling）配置在发请求前的整理。
//
// searchConfig 存在本地 API 配置里：apiKey 按 api-secret-storage 的规则单独加密保存，
// 不同步、不随项目导出。DeepSeek 搜索可以沿用当前 DeepSeek 服务商的 Key：
// 只存 useMainKey 开关，不把主 Key 复制进 searchConfig，发请求时才在内存里取用。

import { isDeepSeekPresetConfig } from './ai-provider-compat.js';

export const SEARCH_TOOLS = ['tavily', 'exa', 'deepseek'];
export const DEFAULT_SEARCH_TOOL = 'tavily';
export const SEARCH_TOOL_LABELS = { tavily: 'Tavily', exa: 'Exa', deepseek: 'DeepSeek' };
// 设置面板"点此获取"链接：各搜索工具申请 API Key 的页面
export const SEARCH_TOOL_KEY_PAGES = {
    tavily: 'https://tavily.com',
    exa: 'https://exa.ai',
    deepseek: 'https://platform.deepseek.com/api_keys',
};

// 与 SettingsPanel PROVIDERS 里 DeepSeek 的默认地址一致；服务端路由不内置这个地址。
export const DEEPSEEK_SEARCH_DEFAULT_BASE_URL = 'https://api.deepseek.com';

export function getSearchTool(searchConfig) {
    const tool = searchConfig?.tool || searchConfig?.provider;
    return SEARCH_TOOLS.includes(tool) ? tool : DEFAULT_SEARCH_TOOL;
}

/** 当前对话服务商是 DeepSeek 且没有关掉"沿用"开关时，搜索直接用主 API Key。 */
export function usesMainKeyForSearch(apiConfig) {
    const searchConfig = apiConfig?.searchConfig || {};
    return getSearchTool(searchConfig) === 'deepseek'
        && searchConfig.useMainKey !== false
        && isDeepSeekPresetConfig(apiConfig);
}

/**
 * 返回随请求发给服务端的 searchConfig；没有可用的 Key 时返回 null（调用方提示用户去设置）。
 * Tavily / Exa 保持原样传递，地址留空时由服务端使用各自默认地址。
 */
export function resolveFunctionSearchConfig(apiConfig) {
    const searchConfig = apiConfig?.searchConfig || {};
    const tool = getSearchTool(searchConfig);
    if (tool !== 'deepseek') {
        return searchConfig.apiKey ? { ...searchConfig, tool, provider: tool } : null;
    }

    const reuseMainKey = usesMainKeyForSearch(apiConfig);
    const apiKey = String((reuseMainKey ? apiConfig?.apiKey : searchConfig.apiKey) || '').trim();
    if (!apiKey) return null;
    const baseUrl = String(searchConfig.baseUrl || '').trim()
        || (reuseMainKey ? String(apiConfig?.baseUrl || '').trim() : '')
        || DEEPSEEK_SEARCH_DEFAULT_BASE_URL;
    return { tool, provider: tool, apiKey, baseUrl };
}
