## v1.2.26 — 应用内升级 · AI 关联作品 · 余额自动刷新

### 🇨🇳 中文

#### 📱 应用内升级

以前发现新版本要跳浏览器下载、找文件管理器安装，体验比较割裂。现在更新流程在应用内完成：弹窗里能直接看到更新日志，点"下载并安装"后会显示下载进度，完成后自动唤起系统安装器。如果 GitHub 下载不了，也会自动尝试 Gitee 源。

对于涉及数据格式变更的版本，Release 说明里加上强制更新标记后，移动端会隐藏"稍后"按钮，确保用户升级到兼容版本。

#### 🧠 AI 对话关联作品

- 顶部工具栏新增📖按钮，随时给当前对话关联或更换作品——关联后 AI 会自动读取作品设定作为上下文
- 历史对话也能补挂作品，不用再为了挂作品专门新建会话
- 会话列表里能按"关联作品"筛选，快速找到和某个作品相关的所有对话

#### ⚡ 流式输出稳定性

- 修复了流式生成期间切到后台会报错的问题（现在会自动暂停流，回来继续看已生成的内容）
- 修复了自由滚动时被强制拉回底部的抖动

#### 🔌 API 配置

- 填好 API Key 后余额会自动查询，不用每次手动点"查询余额"了
- 已有余额时按钮文案变成"刷新"，更直观
- DeepSeek 余额接口修正为官方地址 `GET https://api.deepseek.com/user/balance`
- 禁用某个 Provider 后不会再退回页面后偷偷重新启用

#### 🚀 启动与登录

- 全新启动动画 + 首次使用引导
- 移动端可以跳过登录直接使用，登录只影响云同步

📦 Windows 安装包由本仓库自动构建，Android APK 由私有移动仓库签名构建后上传至本 Release。

---

### 🇬🇧 English

#### 📱 In-app updates

Previously, updating meant opening a browser, finding the download, and manually installing. Now the entire flow happens inside the app: a dialog shows the changelog, tapping "Download & Install" displays a progress bar, and the system installer opens automatically when done. If GitHub is unreachable, the app falls back to Gitee.

For releases with breaking data changes, adding the force-update marker to the release body hides the "Later" button and ensures users upgrade.

#### 🧠 AI chat ↔ work linking

- New 📖 button in the toolbar to link or change the associated work — AI will automatically use the work's lore as context
- Existing conversations can be linked to a work retroactively
- Session list can be filtered by "linked to work" for quick access

#### ⚡ Streaming stability

- Fixed crashes when switching to background during streamed responses (the stream now pauses gracefully)
- Fixed forced scroll-to-bottom jitter while freely scrolling

#### 🔌 API configuration

- Balance auto-refreshes after entering an API key
- Button label changes to "Refresh" when a balance is already shown
- DeepSeek balance endpoint corrected to `GET https://api.deepseek.com/user/balance`
- Disabled providers now stay disabled after navigating away

#### 🚀 Startup & sign-in

- New startup animation + first-run onboarding
- Mobile app can be used without signing in — sign-in only enables cloud sync

📦 Windows installer is built from this public repo. Android APK is signed in the private mobile repo and uploaded here.
