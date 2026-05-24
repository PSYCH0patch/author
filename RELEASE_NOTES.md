## v1.2.33 — 完善章节编排、AI 存档与移动端备份

### 中文

#### 桌面端 / Web

- 章节列表现在支持悬停点击「+」，可直接在当前章节后插入空白章节。
- 新增「特殊章节」标记，章节重排编号时会跳过这类章节，适合前言、番外、资料章等不参与编号的内容。
- 修复 AI 助手「存档」空白的问题：内联 AI 已接受、已拒绝或重新生成时放弃的内容都会保存到当前作品的 AI 存档，之后可重新插入正文。
- 切换章节时会记住每章上次的光标和滚动位置，返回章节后会恢复到上次编辑位置并显示光标。
- 修复作品切换时，如果目标作品顶部是分卷，正文仍停留在上一部作品内容的问题；现在会回到该作品上次章节，或自动选择第一个可编辑章节。
- 删除分卷按钮增加提示，明确只删除分卷本身，不删除包含的章节。
- 网页版「关于」页面现在也能读取并显示当前版本号。
- 本地光标位置、作品当前章节和 AI 生成存档均保持本地私有，不进入云同步或项目导出。

#### Android 端

- Android 安装包版本号更新为 `1233`。
- 优化移动端备份与导出流程，让项目导出、ZIP 备份和本地备份历史更容易在手机文件系统中找到和使用。
- 修复备份页导出失败时 `setState()` 返回 Future 的运行时错误。
- 修复备份列表在新版 Flutter 调试模式下触发 `ListTile` 背景材质断言的问题。
- 升级 `flutter_quill` 依赖，修复新 Flutter SDK 下 `TextInputClient.onFocusReceived` 缺失导致的 Android 编译失败。

---

### English

#### Desktop / Web

- Chapter rows now show a hover `+` action for inserting a blank chapter directly after the current chapter.
- Added a “special chapter” marker. Renumbering skips these chapters, which is useful for prologues, extras, notes, and other unnumbered content.
- Fixed the empty AI Assistant Archive issue: accepted, rejected, and regenerated-away inline AI text is now saved to the current work's AI archive and can be inserted back into the manuscript later.
- Chapter switching now remembers each chapter's last cursor and scroll position, restoring the previous editing location and visible caret when you return.
- Fixed work switching when the target work starts with a volume: the editor now restores that work's last chapter or falls back to its first editable chapter instead of keeping another work's content.
- Added clearer tooltip text for deleting a volume, explaining that only the volume itself is removed and its chapters are kept.
- The web About page can now read and display the current app version.
- Cursor positions, active chapter memory, and AI generation archives stay local-only and are excluded from cloud sync and project exports.

#### Android

- Android version code is now `1233`.
- Improved mobile backup and export flows so project exports, ZIP backups, and local backup history are easier to find and use on-device.
- Fixed a runtime error where backup export failure handling returned a Future from `setState()`.
- Fixed backup list `ListTile` material assertions in newer Flutter debug builds.
- Updated `flutter_quill` to fix Android build failures with newer Flutter SDKs caused by the missing `TextInputClient.onFocusReceived` implementation.
