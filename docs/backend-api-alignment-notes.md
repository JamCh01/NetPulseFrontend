# 前后端接口对齐备注（给后端）

最后更新：2026-05-20  
维护位置：`NetPulseFrontend/docs/backend-api-alignment-notes.md`  
用途：记录“前端预期接口 vs 后端当前实际能力”的差异、前端临时处理方案、需要后端补齐项。  

---

## 0. 当前排查状态（摘要）

- 已完成：前端基础容错与兼容处理已落地，并完成首轮联调排查。
- 已完成：`/dashboard` 页面已切换 capability-aligned 模式，可在接口缺失时稳定展示（不崩溃）。
- 当前阻塞：后端缺失 dashboard/alerts 关键接口，且当前可用接口数据量不足，图表难以体现真实效果。

状态标记：

- `[已完成]` 前端基础处理 + dashboard 兼容改造 + 首轮测试
- `[待后端]` 补齐缺失接口（见第 2 节）
- `[待数据]` 提供可观测的真实测试数据（见第 7 节）

---

## 1. 当前联调基线

联调基线以线上文档为准：

- Swagger: `http://115.178.32.10:8000/docs`
- OpenAPI: `http://115.178.32.10:8000/openapi.json`

当前后端已确认提供：

- `/health`
- `/api/v1/auth/*`（login/refresh/logout/me）
- `/api/v1/tasks`、`/api/v1/tasks/{task_uuid}`、`/disable`、`/enable`
- `/api/v1/monitoring/tasks*`
- `/api/v1/agents*`
- `/api/v1/metadata/enums`
- `/api/v1/targets*`
- `/api/v1/results/ingestion-events*`
- `/api/v1/relations/quick-associate`

---

## 2. 前端预期但后端未提供（主要缺口）

### 2.1 Dashboard 聚合接口缺口

前端预期：

- `GET /api/v1/dashboard/stats`

当前状态：

- 后端返回 404（未提供）

影响：

- Dashboard 无法直接获取聚合统计，首屏会出现“能力缺失”降级提示。

前端已做处理：

- 已降级为兼容模式（不因该接口缺失导致崩溃）。
- 仍会显示缺失提示，且无法拿到后端标准聚合统计。

建议后端提供：

- `GET /api/v1/dashboard/stats`
- 返回建议包含：任务总数/活跃数、探针在线/离线/禁用数、可选最近事件计数。

---

### 2.2 Alert Rules / Alert Events 接口缺口

前端预期：

- `GET/POST/PATCH/DELETE /api/v1/alerts/rules...`
- `GET /api/v1/alerts/events...`

当前状态：

- 后端返回 404（未提供）

影响：

- 告警规则页无法完整工作。
- Dashboard 的“Recent Incident Signals”无法获取真实告警事件流。

前端已做处理：

- 对 404 做能力降级，不再整页报错。
- 相关区域展示为空态或“未部署能力”提示。

建议后端提供（最小可用）：

- `GET /api/v1/alerts/rules`
- `POST /api/v1/alerts/rules`
- `PATCH /api/v1/alerts/rules/{rule_uuid}`
- `DELETE /api/v1/alerts/rules/{rule_uuid}`
- `GET /api/v1/alerts/events`

备注（前端已做兼容）：

- 缺失时前端不会崩溃，改为“能力未部署”提示或空态。
- 但功能价值受限，无法替代真实事件与规则能力。

---

### 2.3 `/api/v1/health` 路径缺口（仅有 `/health`）

前端预期：

- `GET /api/v1/health`

当前状态：

- 后端仅有 `/health`

影响：

- 前端会先命中 `/api/v1/health` 404，再 fallback 到 `/health`。

前端已做处理：

- 自动 fallback 到 `/health`，功能可用。
- 已加“404 后停请求”缓存逻辑，减少重复噪音。

建议后端二选一：

1. 提供 `GET /api/v1/health`（推荐，与 v1 体系一致）
2. 或明确约定健康检查只走 `/health`，前端后续彻底移除 `/api/v1/health` 尝试。

---

## 3. 路由风格对齐问题（尾斜杠）

现状：

- 后端实际以“无尾斜杠”风格为主（如 `/api/v1/tasks`）。
- 前端历史 SDK 中存在带尾斜杠路径（如 `/api/v1/tasks/`），可能触发 307 或 404。

前端已做处理：

- 任务相关 hook 已切到无尾斜杠路径，并做 enable/disable 兼容回退。

建议：

- 后端 OpenAPI 与实际路由保持一致（统一无尾斜杠或统一兼容）。
- 前端将基于最新 openapi 重新生成 SDK，避免再漂移。

---

## 4. 前端当前“只能这样”的部分

以下能力在后端未提供前，前端只能降级：

1. Dashboard 聚合统计（缺 `dashboard/stats`）
2. 告警规则管理（缺 `alerts/rules`）
3. 事件流展示（缺 `alerts/events`）

当前前端策略：

- 不崩溃优先：接口缺失时展示降级提示/空态。
- 明确提示能力未部署，避免用户误解为登录失败或网络失败。

---

## 4.2 本轮已排查内容（可追溯）

1. 已验证线上接口文档可访问：`/docs`、`/openapi.json`。
2. 已确认 dashboard 相关 404 来源不是 token 问题，而是后端未提供对应 endpoint。
3. 已修复 dashboard 渲染崩溃点：
   - `target` 对象渲染兼容
   - `protocol` 为空兼容
4. 已增加缺失接口探测缓存，降低重复 404 噪音。
5. 已将 dashboard 改为基于现有接口可运行模式。

---

## 4.1 Dashboard 适配策略（已落地）

目的：在后端未提供 `dashboard/stats` 与 `alerts/events` 时，确保 `/dashboard` 可稳定使用。

已做适配：

1. 移除 Dashboard 对以下接口的强依赖：
   - `/api/v1/dashboard/stats`
   - `/api/v1/alerts/events`
2. Dashboard 核心展示改为基于当前可用 `tasks` 数据聚合：
   - Active Tasks 直接按任务列表统计
   - Priority Queue 基于活跃任务展示
3. Recent Incident Signals 区域改为“能力未部署”说明卡，而不是错误态。
4. 对已确认 404 的接口做一次性探测缓存，避免反复请求造成控制台噪音。
5. 对不稳定字段做兜底：
   - `protocol` 为空时默认 `icmp`
   - `target` 为对象时提取字符串展示（`target` 或 `name`）

当前限制：

- 无法展示后端聚合统计（因为缺少 `dashboard/stats`）。
- 无法展示真实告警事件流（因为缺少 `alerts/events`）。

---

## 5. 建议协作节奏（持续更新）

1. 后端每次上线后更新 openapi。
2. 前端按 openapi 做一轮自动对比与回归测试。
3. 本文档同步更新：
   - 新增了什么接口
   - 还缺什么接口
   - 前端临时兼容是否可以删除

### 后端上线通知建议（强烈建议执行）

当后端新增/恢复接口时，请在发布说明里明确以下信息并通知前端：

1. 接口路径和方法
2. 请求参数与鉴权要求
3. 返回 JSON 样例（成功/失败）
4. 是否和旧路径兼容（含尾斜杠行为）
5. 生效环境与上线时间

推荐通知模板：

- 新增接口：`GET /api/v1/dashboard/stats`
- 版本/环境：`prod-2026-xx-xx`
- 返回示例：`{ code, message, data: {...} }`
- 兼容说明：`无尾斜杠；旧路径 301/307/404 行为`
- 前端动作：`恢复 stats hook 主路径，移除 capability fallback`

前端收到通知后动作：

1. 先用 `/openapi.json` 二次确认接口在 `paths` 中。
2. 加一条 curl smoke 校验（带鉴权）。
3. 再切换前端从降级路径回主路径。

---

## 6. 变更记录

- 2026-05-20：初版建立。记录 dashboard/alerts/health 路径缺口，明确前端降级策略与后端补齐建议。
- 2026-05-20：补充 Dashboard capability-aligned 实施说明、字段兜底策略、后端上线通知模板。

---

## 7. 数据现状说明（非常重要）

当前现象：

- 虽然后端已有 `tasks`、`monitoring/tasks/*` 等接口，但当前返回数据不足或业务数据不完整。
- 前端页面可正常加载，但图表/趋势/事件可视化效果不明显，容易误判为前端问题。

需要后端支持：

1. 提供稳定且有代表性的测试数据（含时间序列、协议、目标、MTR 结果）。
2. 确保关键字段完整性（如 `protocol`、可显示的 target 字段）。
3. 提供至少一组“有数据”的演示任务，便于前端验证视觉与交互效果。

结论：

- 当前“看不到图效果”主要是数据问题，不是前端渲染框架问题。
