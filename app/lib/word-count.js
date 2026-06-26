// 统一字数口径：数 Unicode 字母 + 数字（汉字、英文字母、数字逐字计），
// 标点 / 空格 / 符号一律不计。移动端 TextUtils.countWords 使用完全相同的规则，
// 保证桌面端与移动端字数一致。
export function countWords(text) {
    if (!text) return 0;
    // 用原生正则一次扫描计数：V8 对 String.match 的优化远快于 JS 层逐字 RegExp.test，
    // 长章节逐键统计不卡顿。口径与移动端 TextUtils.countWords 完全一致：只计 Unicode 字母 + 数字。
    const matches = String(text).match(/[\p{L}\p{N}]/gu);
    return matches ? matches.length : 0;
}
