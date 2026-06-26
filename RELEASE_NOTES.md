## v1.2.46 — 统一字数口径，改进向量模型获取与移动端长回复稳定性

### 中文

#### 桌面端 / Web

- 统一桌面端与移动端的字数统计口径：仅计汉字、字母和数字，标点与空格不计；编辑器状态栏、字数显示与项目导入的字数全部改用同一规则，确保跨端一致。
- 改进向量（Embedding）模型获取：区分“拉取失败”与“已连通但无可用嵌入模型”两种情况，结果就近显示在向量模型区下方，并在更换向量 Key、地址或服务商后自动复位，可用新配置重新拉取。
- AI 上下文中的设定字段标签（角色档案、世界观、大纲等）随界面语言切换中、英、俄，不再固定中文；AI 侧栏“生成设定”的默认目标分类名也跟随界面语言。
- 新增桌面端应用图标。

#### Android 端

- 修复 AI 对话在长回复时逐渐卡顿、最终可能崩溃的问题：流式渲染改为节流刷新，并在生成过程中使用轻量文本，待回复结束后再呈现完整排版与可应用的设定卡片。
- Android 版本号更新为 `1.2.46+1246`。

---

### English

#### Desktop / Web

- Unified the word-count rule across desktop and mobile: only letters, digits, and CJK characters are counted while punctuation and spaces are excluded, applied consistently to the editor status bar, the word display, and project import counts.
- Improved embedding model discovery: distinguish a failed request from a connected provider that simply has no embedding models, show the outcome directly under the embedding section, and reset it after changing the embedding key, endpoint, or provider so a new configuration can re-fetch.
- Setting field labels sent in the AI context (character profiles, worldbuilding, outline, and so on) now follow the interface language across Chinese, English, and Russian instead of being fixed in Chinese; the default destination categories in the AI sidebar’s Generate Settings also follow the interface language.
- Added a desktop application icon.

#### Android

- Fixed AI chat becoming progressively laggy and potentially crashing on long replies: streaming now throttles UI refreshes and uses lightweight text while generating, then renders the full formatting and applicable setting cards once the reply completes.
- Android is now version `1.2.46+1246`.

---

## v1.2.45 — 新增跨端文字朗读并增强 AI、编辑器与设定集稳定性

### 中文

#### 桌面端 / Web

- 新增编辑器文字朗读：状态栏可朗读选中文字或当前章节，支持系统语音、OpenAI 兼容、Gemini、Claude 兼容和自定义 TTS 音源，并提供暂停、继续、停止、音色、语速及模型/音色发现。
- 新增可复制的 TTS 错误详情与针对鉴权、限流、模型/端点错误的提示；API Key 仅保存在本机会话存储，TTS 配置、音色和语速不会参与云同步。
- 新增“当前段落高亮”偏好设置，以淡色标记正在编辑的段落，并在编辑器失焦后保留细光标位置。
- 隔离不同作品和章节的编辑器撤销历史，切章前刷新待保存内容，并让延迟保存始终携带原作品/章节身份，避免撤销或异步保存覆盖错误章节。
- 统一 OpenAI、Claude、Gemini 及自定义兼容端点的配置迁移、模型获取、连接测试、Embedding 和请求路由；保留 Gemini 原生通道，并改善历史配置升级后的可用性。
- AI 侧栏新增明确的“生成设定”模式，可选择目标分类并输出可直接应用的设定卡片；历史消息勾选状态与实际请求上下文保持一致。
- 新增动态资源块加载失败的单次自恢复机制，减少客户端更新后旧页面因 chunk 失效而停在错误页的问题。
- 补充中、英、俄、阿 README 与中、英、俄帮助内容，并优化设定集导航短标签和相关错误提示。

#### Android 端

- 新增系统文字朗读面板，可朗读选中文字或当前章节，支持暂停、继续、停止、语速记忆及多语言语音选择。
- 改进 AI 模型获取与选择：支持从服务端读取完整模型列表，模型较多时可搜索，并完善加载、空结果和错误状态。
- 修复部分中转服务忽略流式请求或在最后一个事件后直接断开时出现的空回复、尾部截断；增加 OpenAI Chat/Responses、Claude Messages 和 Gemini 非流式 JSON 回退解析。
- 扩展设定集分类管理与快速新建流程：支持自定义分类的新建、重命名、清空和删除，并可整理、移动、排序和搜索分类内条目。
- 重做时间线总览和事件编辑体验，增加顺序、时间标记、关联设定、统计卡片、空状态及新增/编辑/删除流程。
- 修复新建或重命名分类后文本控制器提前释放引发的 Flutter 红屏断言，避免 `_dependents.isEmpty` 生命周期错误再次出现。
- Android 版本号更新为 `1.2.45+1245`。

---

### English

#### Desktop / Web

- Added editor text to speech: read the current selection or chapter from the status bar using system speech, OpenAI-compatible, Gemini, Claude-compatible, or custom TTS providers, with pause, resume, stop, voice, speed, and model/voice discovery controls.
- Added copyable TTS diagnostics with focused hints for authentication, rate limits, models, and endpoints. API keys stay in local session storage, while TTS configuration, voices, and speed are excluded from cloud sync.
- Added an optional Current Paragraph Highlight that tints the active paragraph and retains a thin caret after the editor loses focus.
- Isolated undo history between works and chapters, flushed pending edits before switching, and attached the original work/chapter identity to delayed saves to prevent cross-document overwrites.
- Unified configuration migration, model fetching, connection tests, embeddings, and request routing for OpenAI-, Claude-, Gemini-, and custom-compatible endpoints while preserving the native Gemini path.
- Added an explicit Generate Settings mode in the AI sidebar with destination-category selection and directly applicable setting cards; selected conversation history now matches the context actually sent.
- Added one-shot recovery for stale dynamic chunks so clients can recover after an update instead of remaining on an error page.
- Updated Chinese, English, Russian, and Arabic READMEs plus the Chinese, English, and Russian help content, and improved readable lore navigation labels and related errors.

#### Android

- Added a system text-to-speech sheet for the selection or current chapter, with pause, resume, stop, remembered speed, and multilingual voice selection.
- Improved AI model discovery and selection with complete server model lists, search for large catalogs, and clearer loading, empty, and error states.
- Fixed blank or truncated AI replies when a relay ignores streaming or closes after the final event; added non-streaming JSON fallbacks for OpenAI Chat/Responses, Claude Messages, and Gemini responses.
- Expanded lore category management and quick creation with custom-category create, rename, clear, and delete actions plus item organization, move, reorder, and search flows.
- Reworked the timeline overview and event editor with order values, time labels, linked lore, metrics, empty states, and complete create/edit/delete flows.
- Fixed the Flutter red-screen assertion caused by disposing a text controller while the create/rename category dialog still depended on it, preventing the `_dependents.isEmpty` lifecycle failure.
- Android is now version `1.2.45+1245`.