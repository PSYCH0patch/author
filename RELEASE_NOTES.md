## v1.2.39 — 修复编辑器空白点击与移动端模型选择

### 中文

#### 桌面端 / Web

- 修复在编辑器正文外侧灰色区域点击时会把光标和滚动位置强制跳到文末的问题。
- 空白区域点击现在只会重新聚焦编辑器，并保留当前阅读/编辑滚动位置。
- 将本地桌面客户端打包目录 `local-clients-v*/` 加入忽略与打包排除规则，避免安装包产物误出现在 Git 变更或新版安装包里。

#### Android 端

- Android 版本更新为 `1.2.39+1239`。
- 修复 AI 对话顶部模型选择控件的命中区域：点击下拉箭头也能打开模型选择面板，不再只能点机器人图标。

---

### English

#### Desktop / Web

- Fixed editor outside-page clicks forcing the cursor and scroll position to jump to the end of the document.
- Outside-page clicks now refocus the editor while preserving the current editing scroll position.
- Added `local-clients-v*/` to Git ignore and packaging excludes so local installer bundles do not appear as Git changes or get bundled into new installers.

#### Android

- Android is now version `1.2.39+1239`.
- Fixed the AI chat model selector hit area: tapping the dropdown arrow now opens the model selector sheet, instead of only the robot icon responding.
