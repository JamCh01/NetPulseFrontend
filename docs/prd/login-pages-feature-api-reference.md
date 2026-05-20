# 登录后页面功能与接口清单（前后端对照）

最后更新：2026-05-20  
适用范围：`NetPulseFrontend` 登录后侧边栏页面（含管理员页面）  
后端能力基线：`http://115.178.32.10:8001/openapi.json`

---

## 1. 页面总览（按侧边栏）

普通登录后可见：

1. 仪表盘 `/dashboard`
2. 监控任务 `/tasks`
3. 告警规则 `/alerts`
4. 告警事件 `/alerts/events`
5. Webhook `/webhooks`

管理员可见（AdminGuard）：

1. 探针节点 `/agents`
2. 用户管理 `/users`
3. 审计日志 `/audit`
4. 分组管理 `/groups`
5. 系统健康 `/system/health`

---

## 2. 鉴权与会话（所有登录后页面共用）

### 功能

- 用户登录、刷新 token、退出登录
- 本地会话恢复
- 请求自动注入 `Authorization: Bearer <token>`

### 前端实现

- `src/api/hooks/use-auth.ts`
- `src/api/client.ts`
- `src/stores/auth-store.ts`

### 接口

- `POST /api/v1/auth/login`（已支持）
- `POST /api/v1/auth/refresh`（已支持）
- `POST /api/v1/auth/logout`（已支持）
- `GET /api/v1/auth/me`（后端有，前端当前未主流程使用）

---

## 3. 仪表盘 `/dashboard`

### 页面功能

- 显示当前监控概览（已改为 capability-aligned 模式）
- 展示任务优先队列
- 展示小型时序图
- 展示系统健康卡片

### 关键用户操作

- 切换时间范围
- 点击任务进入监控详情
- 查看健康状态

### 前端主要 hooks/组件

- `useTasks`
- `useMonitoringData`
- `useHealth`
- `HealthCard`
- `MiniSmokePingChart`

### 实际接口

- `GET /api/v1/tasks`（已支持）
- `GET /api/v1/monitoring/tasks/{task_uuid}/metrics`（已支持）
- `GET /api/v1/health`（后端缺失，已 fallback 到 `/health`）
- `GET /health`（已支持）

### 缺失能力（目前降级处理）

- `GET /api/v1/dashboard/stats`（后端缺失）
- `GET /api/v1/alerts/events`（后端缺失）

---

## 4. 监控任务 `/tasks` 与任务详情 `/tasks/:taskUuid`

### 页面功能

- 任务列表查询、分页
- 创建任务
- 编辑任务
- 启停任务
- 分配探针
- 任务详情查看

### 前端主要 hooks

- `useTasks`
- `useTask`
- `useCreateTask`
- `useUpdateTask`
- `useDisableTask`
- `useTaskAgents`
- `useAssignAgents`
- `useUnassignAgent`

### 实际接口

- `GET /api/v1/tasks`（已支持）
- `GET /api/v1/tasks/{task_uuid}`（已支持）
- `POST /api/v1/tasks`（已支持）
- `PATCH /api/v1/tasks/{task_uuid}`（前端支持，后端是否支持需按部署确认）
- `POST /api/v1/tasks/{task_uuid}/disable`（已支持）
- `POST /api/v1/tasks/{task_uuid}/enable`（已支持）

备注：

- 前端已做兼容：若 `PATCH` 启停失败，自动回退 `/enable` 或 `/disable`。

---

## 5. 探针节点 `/agents` 与详情 `/agents/:agentUuid`

### 页面功能

- 探针列表查询、创建、启停、编辑
- 探针详情查看
- 探针与任务关联管理

### 前端主要 hooks

- `useAgents`
- `useAgent`
- `useCreateAgent`
- `useUpdateAgent`
- `useDisableAgent`
- `useAgentTasks`
- `useAssignTasksFromAgent`
- `useUnassignTaskFromAgent`

### 接口（前端当前调用）

- `/api/v1/agents*`（多个读写接口）
- `/api/v1/agents/{agent_uuid}/tasks`（前端当前在用）

### 对齐说明

- 后端 openapi 当前包含 `/api/v1/agents*`（有基础支持）。
- `agents/{agent_uuid}/tasks` 路径需再做一次线上确认（若无此路径需前端改造为其他关系接口）。

---

## 6. 告警规则 `/alerts`

### 页面功能

- 告警规则列表、创建、编辑、停用
- 规则与任务、Webhook 关联配置

### 前端主要 hooks

- `useAlertRules`
- `useCreateAlertRule`
- `useUpdateAlertRule`
- `useDisableAlertRule`

### 前端预期接口

- `/api/v1/alerts/rules*`

### 当前后端状态

- 后端缺失（404）
- 前端已做 404 降级，不会整页崩溃

---

## 7. 告警事件 `/alerts/events`

### 页面功能

- 告警事件列表
- 按规则/任务/状态过滤
- 事件详情联动

### 前端主要 hooks

- `useAlertEvents`
- `useAlertRules`
- `useTasks`
- `useAgents`

### 前端预期接口

- `/api/v1/alerts/events*`

### 当前后端状态

- 后端缺失（404）
- 前端已做 capability 降级与请求抑制缓存

---

## 8. Webhook `/webhooks`

### 页面功能

- Webhook 列表、创建、编辑、删除
- 测试回调
- 轮换签名 secret
- Delivery 列表与重试

### 前端主要 hooks

- `useWebhooks`
- `useWebhook`
- `useCreateWebhook`
- `useUpdateWebhook`
- `useDeleteWebhook`
- `useTestWebhook`
- `useRotateSecret`
- `useWebhookDeliveries`
- `useRetryDelivery`

### 前端预期接口

- `/api/v1/webhooks*`

### 当前后端状态

- 当前部署 openapi 未提供（缺失）

---

## 9. 用户管理 `/users`

### 页面功能

- 用户列表、筛选
- 禁用用户
- 修改用户密码

### 前端主要 hooks

- `useUsers`
- `useDisableUser`
- `useChangePassword`
- `useUpdateUser`（部分场景）

### 前端预期接口

- `/api/v1/users*`

### 当前后端状态

- 当前部署 openapi 未提供（缺失）

---

## 10. 审计日志 `/audit`

### 页面功能

- 审计日志列表
- 按操作人/资源/动作过滤
- 展开查看详情

### 前端主要 hooks

- `useAuditLogs`
- `useUsers`（过滤器辅助）

### 前端预期接口

- `/api/v1/audit/logs`

### 当前后端状态

- 当前部署 openapi 未提供（缺失）

---

## 11. 分组管理 `/groups`

### 页面功能

- 分组列表
- 创建/编辑/删除分组

### 前端主要 hooks

- `useGroups`
- `useCreateGroup`
- `useUpdateGroup`
- `useDeleteGroup`

### 前端预期接口

- `/api/v1/users/groups*`

### 当前后端状态

- 当前部署 openapi 未提供（缺失）

---

## 12. 系统健康 `/system/health`

### 页面功能

- 显示系统组件健康状态
- 支持手动刷新

### 前端主要 hooks

- `useHealth`

### 接口

- 优先尝试 `GET /api/v1/health`（后端缺失）
- 自动 fallback `GET /health`（后端已支持）

---

## 13. 监控公共页（补充）

虽然不在登录后侧栏，但业务上与 dashboard/task 紧密相关：

- `/monitoring`
- `/monitoring/:taskUuid`
- `/monitoring/:taskUuid/mtr`

主要接口：

- `/api/v1/monitoring/tasks`
- `/api/v1/monitoring/tasks/{task_uuid}`
- `/api/v1/monitoring/tasks/{task_uuid}/metrics`
- `/api/v1/monitoring/tasks/{task_uuid}/mtr-results`
- `/api/v1/monitoring/mtr-results/{result_uuid}`（后端有，前端部分场景可继续增强）

---

## 14. 结论（当前可用性）

### 当前“可直接跑通”的核心链路

1. 登录/刷新/登出
2. 任务管理（含启停兼容）
3. Dashboard（已做 capability-aligned 改造）
4. 监控查询与图表（取决于后端是否有真实数据）

### 当前“前端有页面但后端能力缺失”的模块

1. 告警规则/告警事件
2. Webhook
3. 用户管理
4. 审计日志
5. 分组管理
6. Dashboard 聚合 stats（专用接口缺失）

### 现阶段联调建议

1. 先按可用链路验证：登录 -> Dashboard -> Tasks -> Monitoring。
2. 对缺失模块统一视为“后端能力待补”，避免误判为前端 bug。
3. 后端每次发布后，用 `openapi.json` 与本文档做增量对照更新。
