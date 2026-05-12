## v1.2.27 — 移动端统计校准与同步状态修复

### 🇨🇳 中文

#### 📊 字数统计

- 统一移动端各处字数口径，备忘录、正文、书架、工作台、个人统计、写作目标等界面都使用同一套文本计数规则
- 正文 HTML / Quill 内容会正确转成可统计文本，章节内容不再因为存储字数为空而被漏算
- 创作字数会优先统计作品正文，不再把 AI 对话字数混入写作产出
- 写作目标、快照、阅读模式、章节排序等页面会在旧数据 `wordCount` 过期时自动从正文内容回退计算

#### 🧮 Token 统计

- AI 流式响应现在会读取提供商返回的准确 token usage
- 支持 OpenAI-compatible、Gemini、Claude/Responses 风格的 usage 字段解析
- 会话统计优先使用真实返回值，只在没有 provider usage 的旧消息上回退估算
- Token 统计页文案调整为真实/估算混合口径，避免把估算值当成精确值

#### ☁️ 同步状态

- 修复未登录时个人页仍显示"已同步"的问题，现在显示"云同步未启用"
- 修复刚登录后沿用旧同步状态的问题，登录、登出、切换账号都会重置同步生命周期
- 刚登录但还没有真实同步时间时显示"同步就绪"，只有完成同步并产生 `lastSyncTime` 后才显示"已同步"
- 云同步详情页同步按钮会按登录态和网络状态正确启用/禁用

#### 🧪 稳定性

- 增加字数统计、AI usage 解析、Token 汇总、ChatMessage usage 持久化等单元测试
- `flutter analyze --no-pub` 通过
- `flutter test --no-pub --reporter expanded` 通过

📦 Windows 安装包由本仓库自动构建，Android APK 由私有移动仓库签名构建后上传至本 Release。

---

### 🇬🇧 English

#### 📊 Word Counts

- Unified mobile word-count behavior across memos, body text, bookshelf, workspace, profile insights, and writing goals
- Body HTML / Quill content is converted into countable text, so chapter content is no longer missed when stored `wordCount` is stale or empty
- Creative writing totals now prioritize actual work body text instead of mixing in AI chat text
- Writing goals, snapshots, reading mode, chapter ordering, and related surfaces fall back to recalculating from chapter content when needed

#### 🧮 Token Stats

- Streaming AI responses now capture accurate token usage returned by providers
- Added parsing for OpenAI-compatible, Gemini, and Claude/Responses-style usage fields
- Session statistics prefer reported usage and only estimate legacy messages without provider usage
- Token stats wording now reflects the mixed reported/estimated model instead of presenting estimates as exact values

#### ☁️ Sync Status

- Fixed the profile page showing "Synced" while signed out; it now shows cloud sync as disabled
- Fixed stale sync state after signing in by resetting sync lifecycle on sign-in, sign-out, and account switches
- Newly signed-in sessions show "Sync ready" until a real `lastSyncTime` exists; "Synced" is shown only after an actual sync
- Sync detail actions are enabled or disabled according to authentication and network state

#### 🧪 Stability

- Added unit coverage for word counting, AI usage parsing, token aggregation, and ChatMessage usage persistence
- `flutter analyze --no-pub` passed
- `flutter test --no-pub --reporter expanded` passed

📦 Windows installer is built from this public repo. Android APK is signed in the private mobile repo and uploaded here.
