## v1.2.42 — 修复作品信息切换崩溃与大纲曲线兼容

### 中文

#### 桌面端 / Web

- 修复在「作品信息」面板或多本书之间切换时，旧数据把创作目标存成非数组导致 `map is not a function` 并进入崩溃页的问题。
- 增强作品列表与创作目标的前端兜底，即使本地/同步数据出现异常形态，也会先规整后再渲染。
- 修复大纲曲线读取旧数据或异常数据时的兼容问题，避免曲线点缺失字段时影响分类设置面板。
- 收紧设定内容归一化逻辑，保留 `bookInfo.goals` 与 `plotCurve` 这类结构化字段，而不是错误地转成纯文本。

#### Android 端

- Android 版本号对齐为 `1.2.42+1242`。
- 本次移动端未包含额外功能同步变更，仅按 public release 流程同步版本号与发布产物。

---

### English

#### Desktop / Web

- Fixed a crash when opening Book Info or switching between books if older data stored writing goals as a non-array value, causing `map is not a function`.
- Hardened the Book Info work list and writing-goal rendering so malformed local or synced data is normalized before rendering.
- Fixed plot curve compatibility for older or malformed data so missing point fields no longer break the category settings panel.
- Tightened settings-content normalization to preserve structured fields such as `bookInfo.goals` and `plotCurve` instead of flattening them into plain text.

#### Android

- Android is now version `1.2.42+1242`.
- No additional mobile feature changes are included in this release; the mobile build is version-aligned as part of the public release flow.
