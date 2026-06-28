## v1.2.47 — 多语言报错与界面翻译全面补齐，移动端新增章节跳转与批量概要

### 中文

#### 桌面端 / Web

- 全面国际化服务端报错与提示：API 配置、获取模型列表、连接测试、向量（Embedding）、AI 写作与对话、文件导入、WebDAV/局域网同步、检查更新等环节的错误信息，过去部分写死中文，现在统一按界面语言显示中、英、俄三语，英文和俄文用户不再看到夹杂的中文报错。
- 内置默认设定分类名（如「主要角色」「配角」「势力组织」）与默认作品名，在英文 / 俄文界面下显示对应译名；仅作用于显示层，不改动任何已保存的数据，老作品零影响。
- 补齐编辑器占位符、模型与向量配置弹窗、生成参数项（输出 Token、思考等级等）的多语言文案。

#### Android 端

- 新增章节快速跳转：在章节列表输入章节号或标题关键字即可定位；目标若位于折叠的分卷内，会自动展开分卷后滚动过去。
- 新增批量逐章概要：在「多章概要」页可多选章节，串行生成每章概要，带实时进度与失败重试。
- 优化「多章概要」页的选择交互，移除冗余的逐行选择 / 取消按钮。
- Android 版本号更新为 `1.2.47+1247`。

---

### English

#### Desktop / Web

- Comprehensive internationalization of server-side errors and prompts: messages across API configuration, model-list fetching, connection testing, embeddings, AI writing and chat, file import, WebDAV/LAN sync, and update checks — previously hard-coded in Chinese in places — now display in Chinese, English, or Russian per the interface language, so English and Russian users no longer see stray Chinese in error messages.
- Built-in default setting categories (such as "Main Characters", "Supporting Characters", and "Factions") and the default work name now show their translated labels in English/Russian interfaces; this is display-only and does not change any saved data, so existing works are unaffected.
- Completed multilingual text for the editor placeholder, the model and embedding configuration dialogs, and generation parameters (output tokens, thinking level, and so on).

#### Android

- Added quick chapter jump: type a chapter number or title keyword in the chapter list to jump straight to it; if the target sits inside a collapsed volume, the volume expands automatically before scrolling.
- Added batch per-chapter synopsis: on the "Multi-chapter synopsis" page, select multiple chapters to generate each synopsis sequentially, with live progress and retry on failure.
- Refined the selection interaction on the "Multi-chapter synopsis" page and removed the redundant per-row select/deselect buttons.
- Android is now version `1.2.47+1247`.
