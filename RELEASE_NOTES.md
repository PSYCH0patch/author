## v1.2.36 — 新增章节概要中心与上下文优化

### 中文

#### 桌面端 / Web

- 新增章节概要中心，统一管理单章概要、多章概要、概要分组和已保存概要，不再跳转到割裂的独立界面。
- 章节列表、右键菜单和顶部“概要”入口现在都会打开同一个章节概要中心，可直接编辑、生成、保存、锁定和导出概要。
- 多章概要支持任选章节组成概要组，也支持选择多个概要组后合并压缩，为后续生态阶段的长期上下文能力做准备。
- 章节概要提示词升级为高保真总结：不限制输出 tokens，优先保留事件链、剧情颗粒度、结尾状态、续写注意和待回收信息。
- AI 上下文注入增加章节概要与多章概要组来源，优先使用稳定概要压缩前文，减少重复正文带来的 token 浪费。
- 优化 DeepSeek 等模型的缓存命中策略：稳定系统提示词和上下文结构，减少用户操作差异对缓存复用的影响。
- 修复阅读/编辑字号调整后分页排版异常的问题，恢复更稳定的分页裁剪和页面布局表现。
- 侧边栏自定义导航、API 模型自检、Firebase 离线诊断等细节继续优化，减少误选、误报和功能入口迷路。

#### Android 端

- Android 版本更新为 `1.2.36+1236`。
- 修复阅读模式在字号/行高调整后分页不铺满或切断文字的问题，改为按实际可用版面重新分页。
- API 配置自检/拉取模型列表时会保留已有勾选状态，新发现模型会加入列表但不会自动启用。
- 移动端“大纲”页改为读取设定集中的大纲节点，避免与章节列表展示内容重复。

---

### English

#### Desktop / Web

- Added a unified Chapter Synopsis Center for single-chapter summaries, multi-chapter summaries, summary groups, and saved summaries without jumping into separate workspaces.
- Chapter list actions, context-menu actions, and the top “Synopsis” entry now all open the same center, where users can edit, generate, save, lock, and export summaries.
- Multi-chapter summaries can be built from arbitrary chapter selections, and saved summary groups can be selected and merged into a further compressed group for future long-context workflows.
- Upgraded synopsis prompts for high-fidelity chapter summarization: output tokens are not artificially capped, and the model is asked to preserve event chains, plot granularity, ending state, continuity notes, and unresolved threads.
- AI context injection now includes chapter summaries and multi-chapter summary groups, using stable summaries to compress prior context and reduce repeated full-text token cost.
- Improved cache-hit friendliness for DeepSeek-style models by stabilizing prompt and context structure across user operations.
- Fixed pagination/layout regressions after changing editor font size by restoring the more stable page clipping and layout behavior.
- Continued polish around custom sidebar navigation, API model self-check behavior, and Firebase offline diagnostics to reduce accidental selections, noisy errors, and fragmented feature entry points.

#### Android

- Android is now version `1.2.36+1236`.
- Fixed reading-mode pagination after font-size/line-height changes by repaginating from measured available page space instead of slicing lines.
- API self-check/model fetching now preserves existing model selections; newly discovered models are added but not enabled automatically.
- The mobile Outline tab now reads outline nodes from the lore/settings collection instead of duplicating chapter-list content.
