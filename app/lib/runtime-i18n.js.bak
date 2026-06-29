// 运行时语言工具：供「在浏览器运行、但拿不到 useI18n hook」的库代码使用。
// 同步、文件导入、向量等非组件模块直接读持久化的 author-lang 出文案；
// 服务端（无 window）一律回退中文。
//
// 与 api-error-i18n.js 的分工：
//   - api-error-i18n：服务端路由返回机器码 code，组件层（有 useI18n 的 text）按 code 翻译。
//   - runtime-i18n：非组件库代码自己读语言、直接产出本地化字符串 / Error。

export function currentLang() {
    try {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('author-lang') || 'zh';
        }
    } catch { /* localStorage 不可用时回退 */ }
    return 'zh';
}

// translate：按当前界面语言三选一
export function tt(zh, en, ru) {
    const l = currentLang();
    if (l === 'en') return en;
    if (l === 'ru') return ru;
    return zh;
}

// 本地化的 Error，便于 throw localizedError(...)
export function localizedError(zh, en, ru) {
    return new Error(tt(zh, en, ru));
}
