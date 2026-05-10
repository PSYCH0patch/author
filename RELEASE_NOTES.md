## v1.2.25 — AI 行内差异对比 · 首个 Android 安装包 | Inline AI diff preview · First Android APK

### 🇨🇳 中文

#### ✍️ AI 行内差异对比
- **改写结果直接在正文中展示**：AI 改写不再局限在聊天面板里，改写后的差异会以行内对比的形式直接嵌入正文，原文和建议内容一目了然
- **逐段接受或拒绝**：每段改写建议都可以单独采纳或放弃，不需要在聊天面板和编辑器之间来回复制
- **快捷键支持**：`Tab` 采纳当前建议，`Esc` 放弃并恢复原文，适合连续审稿和快速迭代
- **续写与改写体验分离**：续写仍以幽灵文字预览，改写类操作使用更清晰的行内差异展示，不再混淆

#### 📱 首个 Android 安装包
- **Author 移动端正式发布**：本版本起，每次发布都会同时提供 Windows 桌面安装包和 Android APK
- **正式签名**：APK 使用正式发布签名，后续版本可直接覆盖安装升级
- **完整性校验**：附带 `.sha256` 校验文件，下载后可核对文件是否完整

#### 🔐 安全加固
- **减少日志敏感输出**：设定导入、PDF/PMPX 解析、云端同步等流程不再在控制台输出详细数据，避免正文片段或设定名意外泄露
- **提交前自动安全扫描**：新增代码提交前的自动检查机制，防止内部文档或密钥类文件被意外推送到公开仓库

---

### 🇬🇧 English

#### ✍️ Inline AI Diff Preview
- **Rewrites appear directly in the editor**: AI suggestions are now displayed as inline diffs embedded in your draft, showing original and suggested text side by side
- **Accept or reject per section**: Each rewrite suggestion can be individually accepted or dismissed — no more copying between the chat panel and the editor
- **Keyboard shortcuts**: Press `Tab` to accept a suggestion, `Esc` to dismiss and restore the original text, ideal for continuous review
- **Separated continuation and rewrite previews**: Continuations still use ghost text; rewrites now use a clearer inline diff view to avoid confusion

#### 📱 First Android APK
- **Author mobile is officially available**: Starting from this release, both a Windows desktop installer and an Android APK are published together
- **Production signed**: The APK is signed with the official release key, so future versions can be installed as direct upgrades
- **Integrity check**: A `.sha256` checksum file is included alongside the APK for download verification

#### 🔐 Security Hardening
- **Reduced sensitive log output**: Settings import, PDF/PMPX parsing, and cloud sync no longer print detailed data to the console, preventing accidental exposure of draft content or setting names
- **Pre-commit safety checks**: A new automated check runs before code commits to prevent internal documents or secret-like files from being pushed to the public repository
