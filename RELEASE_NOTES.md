## v1.2.32 — 完善桌面 AI 参考与内联写作体验

### 中文

#### 桌面端

- 修复切换作品后 AI 助手“参考”内容没有跟随当前作品刷新、AI 会话仍停留在其他作品的问题。
- AI 助手“参考”里的 tokens 上限现在可以自行设置，默认值为 `200k`。
- 作品列表中的“默认作品”会与作品名称保持一致，激活作品时同步更新当前作品标记。
- 修正侧栏主题切换按钮的“亮色 / 护眼 / 暗色”文字，让按钮显示当前主题，并在提示中说明下一次切换目标。
- 修正帮助文档中的“主题 & 排版”“工具栏功能”“设定集系统”说明，包括排版建议表格、`</>` 代码块图标显示和设定树图标描述。
- 正文中按 `Ctrl+J` 呼出的 AI 写作窗口改为更大的补充指示输入区；点击窗口外不会再关闭并丢失文字，关闭后再次呼出会保留未提交内容。
- 桌面端关于页面现在显示当前应用版本号。

#### Android 端

- Android 安装包版本号更新为 `1232`。
- 移动端 AI 参考导入现在支持时间线和关系图内容。
- 移动端 AI 对话和章节写作页面在滚动时新增回到顶部、上一条、下一条、前往底部定位按钮。

---

### English

#### Desktop

- Fixed AI Assistant references not refreshing with the current work after switching works, and made AI sessions follow the active work.
- The AI Assistant reference token limit is now configurable, with a default of `200k`.
- The work list now keeps the “default work” label aligned with the current work name and updates the active work marker when a work is activated.
- Fixed the sidebar theme switch labels for Light / Eye Care / Dark so the button shows the current theme and the tooltip explains the next target.
- Corrected Help documentation for Theme & Layout, toolbar functions, and the settings set system, including the typography table, `</>` code block icon rendering, and setting tree icon descriptions.
- The `Ctrl+J` inline AI writing popover now has a larger instruction editor; clicking outside no longer closes the popover or discards draft text, and reopening preserves unsubmitted text.
- The desktop About page now shows the current app version.

#### Android

- Android version code is now `1232`.
- Mobile AI reference import now supports timeline and relationship graph content.
- Mobile AI chat and chapter writing screens now include scroll locator controls for top, previous item, next item, and bottom.
