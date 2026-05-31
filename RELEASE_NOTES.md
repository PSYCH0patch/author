## v1.2.35 — 完善 WebDAV 同步与 AI 存档管理

### 中文

#### 桌面端 / Web

- WebDAV 同步目录现在会先通过 `PROPFIND` 判断是否存在，不存在时才执行 `MKCOL`，避免目录已存在时被部分 WebDAV 服务返回 `409` 后误报失败。
- WebDAV 目录请求统一使用尾部 `/`，兼容自建 WebDAV、坚果云、NAS、Nextcloud 等对 collection 路径更严格的服务。
- 修复桌面端 WebDAV 密码框留空保存或测试时可能清空已保存密码的问题；留空会继续保留本机已保存密码。
- 局域网导入支持直接粘贴同步快照 JSON，适合没有局域网直连条件时手动迁移。
- AI 助手「存档」Tab 新增删除操作，可清理不再需要的内联生成记录；帮助页同步补充复制和删除说明。
- WebDAV 代理继续保留私网访问限制，公网部署不会代理访问 localhost 或内网地址。

#### Android 端

- Android 版本更新为 `1.2.35+1235`。
- 移动端新增 WebDAV 同步和局域网同步设置，支持坚果云、123 云盘和自建 WebDAV 服务。
- 移动端 WebDAV 同步同样改为先 `PROPFIND` 后按需 `MKCOL`，目录请求统一带尾部 `/`，提升自建 WebDAV 兼容性。
- 个人页、同步状态页和同步指示器接入 Firebase、WebDAV、局域网三种同步方式的提示和入口。
- 修复章节重排页面使用已废弃 `onReorder` API 的 analyze 提示，改用 `onReorderItem`。
- 新增章节重排工具测试，覆盖新旧索引转换和筛选列表下的排序行为。

---

### English

#### Desktop / Web

- WebDAV sync now checks directory existence with `PROPFIND` before creating collections with `MKCOL`, preventing false failures when existing directories return `409` on stricter WebDAV services.
- WebDAV collection requests now consistently use trailing `/` paths for better compatibility with self-hosted WebDAV, Jianguoyun, NAS, and Nextcloud-style services.
- Fixed saved WebDAV passwords being cleared when saving or testing with an empty password field; leaving the field blank now keeps the local saved password.
- LAN import can now accept pasted sync snapshot JSON directly, making manual transfer possible when direct LAN access is unavailable.
- Added delete actions to the AI Assistant Archive tab so old inline generation records can be cleaned up; Help documentation now mentions copy and delete actions.
- The WebDAV proxy still keeps private-network safeguards, so public deployments cannot proxy localhost or private-network WebDAV targets.

#### Android

- Android version is now `1.2.35+1235`.
- Added mobile WebDAV sync and LAN sync settings, supporting Jianguoyun, 123 Cloud Drive, and self-hosted WebDAV services.
- Mobile WebDAV sync now also uses `PROPFIND` before `MKCOL` and sends trailing `/` collection paths for better self-hosted WebDAV compatibility.
- Profile, sync status, and sync indicator surfaces now expose Firebase, WebDAV, and LAN sync options.
- Fixed Flutter analyze warnings from deprecated `onReorder` usage by switching chapter reorder pages to `onReorderItem`.
- Added chapter reorder utility tests covering index conversion and filtered-list reorder behavior.
