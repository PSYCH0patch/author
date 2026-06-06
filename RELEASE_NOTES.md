## v1.2.38 — 修正装备类设定归类与开源边界

### 中文

#### 桌面端 / Web

- 修正 AI 设定动作中的分类识别：装备、武器、道具、法宝、器物等条目会统一归入“物品/道具”分类，而不是误写成自定义分类。
- 扩展中英文分类别名识别，支持 `equipment`、`gear`、`weapon`、`artifact`、`装备物品`、`武器装备` 等常见表达。
- 在 AI 设定动作提示词中明确要求装备类条目使用 `object` 分类，减少生成后需要手动整理的情况。
- 新增 1.2 开源核心边界说明，明确 1.2 公开仓库、1.3+ 商业线、Reader 产品线和私有仓库的分工。
- README 与帮助文档同步更新 AI 致谢信息，并恢复公开 Release 中的 Android APK 下载入口说明。

#### Android 端

- Android 版本更新为 `1.2.38+1238`。
- 移动端 AI 设定动作同步修正装备、武器、道具、法宝、器物等分类别名，保持与桌面端一致。
- 新增测试覆盖：自定义分类仍会保留，装备类别名会正确进入“物品/道具”分类。
- 章节概要中心做稳定性小修：异步生成/保存结束后先确认页面仍挂载，再更新生成中状态，降低快速关闭页面时的异常风险。
- 调整部分概要中心控件属性与格式，适配当前 Flutter 组件 API。

---

### English

#### Desktop / Web

- Fixed AI settings action category detection: equipment, weapons, props, artifacts, and similar entries now map to the Object / Props category instead of being created as custom categories.
- Expanded Chinese and English category aliases, including `equipment`, `gear`, `weapon`, `artifact`, `装备物品`, and `武器装备`.
- Updated the AI settings action prompt to explicitly require equipment-like entries to use the `object` category, reducing manual cleanup after generation.
- Added the Author 1.2 open-core boundary document, clarifying the split between the public 1.2 repository, 1.3+ commercial lines, Reader products, and private repositories.
- Updated README and in-app Help acknowledgments, and restored the Android APK download entry for public releases.

#### Android

- Android is now version `1.2.38+1238`.
- Mobile AI settings actions now use the same equipment / weapon / prop / artifact alias mapping as desktop.
- Added tests to ensure custom categories are preserved while equipment-like aliases map to Object / Props.
- Polished Chapter Synopsis Center stability by checking that the page is still mounted before clearing generation state after async work.
- Adjusted a few synopsis center widget properties and formatting details for the current Flutter component API.
