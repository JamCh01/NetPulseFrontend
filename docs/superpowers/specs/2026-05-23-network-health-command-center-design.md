# Network Health Command Center Design

## Goal

将 NetPulse 前端从任务卡片式页面重构为面向大规模 Target 和 Agent 的网络健康指挥台。第一屏回答四个问题：哪里异常、影响多大、证据是什么、下一步进入哪个诊断页面。

## Scope

第一阶段重构以下区域：

- `/dashboard`：登录后的网络健康总览。
- `/monitoring` 与 `/app/monitoring`：公开和登录态共用的 Target 分组监控入口。
- `/monitoring/:taskUuid` 与 `/app/monitoring/:taskUuid`：ICMP/TCP 任务诊断详情。
- `/monitoring/:taskUuid/mtr` 与 `/app/monitoring/:taskUuid/mtr`：MTR hop 级证据页。
- 监控相关 API hook：统一读取 `/api/v1/monitoring/*`，按后端真实字段适配。

不在第一阶段重写用户管理、Agent 管理、Webhook、Alert 规则编辑等后台管理页面。

## Information Architecture

导航命名以运维工作流为中心：

- Dashboard 展示为 Network Health。
- Tasks 仍保留任务管理入口，但监控诊断入口使用 Monitoring。
- Monitoring 页以 Target 为主轴，Target 下聚合 Agent 和协议任务。

公开页面和登录页面使用同一套监控页面组件。登录态额外显示管理按钮，公开页只显示诊断和数据。

## Visual Direction

采用深色、紧凑、专业的 NOC 运维控制台风格。保留 Tailwind、现有 UI 组件和 Geist 字体，但减少玻璃拟态和装饰性卡片。

界面规则：

- 使用分栏、表格、列表和状态条承载密集信息。
- 卡片只用于摘要、重复实体和证据面板。
- 控件高度稳定，图表和表格有固定最小高度，避免刷新时跳动。
- 状态色清晰区分 healthy、degraded、critical、no data。
- 中文文案简洁专业，不加入营销式说明。

## Data Model

前端建立监控适配层，将后端响应归一化为页面使用的结构：

- Target：`target_uuid`、`name`、`target`、`target_type`、`ip_version`、`is_anycast`、`carrier`、地理字段。
- Task：`task_uuid`、`name`、`task_type`、`interval_sec`、`target`、`agent`、`probe_config`、`latest_result`。
- Agent：`agent_uuid`、`name`、`continent`、`country`、`city`、`carrier`、`status`。
- Metrics：只用于 ICMP/TCP。MTR 不从 metrics 接口读取派生指标。
- MTR：通过 MTR results 和 result detail 读取 hop 级数据，保留 hop、IP、ASN、packet loss、avg/best/worst。

## Dashboard

Dashboard 顶部展示健康状态条：

- Target 总数。
- Anycast Target 数。
- Task 总数。
- 有最新结果的任务数。
- 无数据任务数。

主体分为三列：

- 左侧：Target coverage，按 Target 展示 Agent 覆盖和协议覆盖。
- 中间：Attention queue，按无数据、失败、MTR 异常等信号排序。
- 右侧：Evidence panel，显示选中 Target 的任务、Agent、协议覆盖、最近结果和诊断入口。

## Monitoring Index

`/monitoring` 和 `/app/monitoring` 不再显示平铺任务卡片，而是显示 Target 分组列表。

每个 Target 行展示：

- Target 名称、地址、Anycast、运营商。
- Agent 数量。
- ICMP/TCP/MTR 覆盖状态。
- 最新结果状态。
- 子任务列表，点击进入对应诊断页。

页面支持协议筛选和搜索，默认按 Target 名称排序。

## Metrics Detail

ICMP/TCP 详情页采用结论优先：

- 顶部显示任务名、协议、Target、Agent、端口、时间范围、最新状态。
- ICMP/TCP 使用 `/metrics` 绘制 smoke 图或多 Agent 对比图。
- 指标包括 latency、packet loss、jitter；TCP 还包括 connect latency 和 failure。
- MTR 类型任务不展示 metrics 图表，直接提示进入 MTR 证据页。

## MTR Detail

MTR 详情页只展示 MTR 结果和 hop 表：

- 顶部显示任务、Target、Agent、时间范围、最新 result。
- 时间线展示 MTR result 列表。
- hop 表展示 `packet_loss_pct`、`avg_ms`、`best_ms`、`worst_ms`、ASN 信息。
- 不展示 `mtr_final_hop_loss_pct` 或类似派生指标。

## Error Handling

- API 失败时保留页面结构，局部展示错误状态。
- Target tree 或 task tree 失败时，页面可以退化为 `/monitoring/tasks` 数据。
- Metrics 查询失败不影响任务基本信息和 MTR 入口。
- 空数据明确展示“暂无数据”，不伪造指标。

## Testing

实现后运行：

- `npm run build`
- 必要时运行 `npm run test`
- 启动 `npm run dev`，用浏览器检查 `/dashboard`、`/monitoring`、一个 ICMP/TCP 详情页、一个 MTR 详情页。

浏览器检查覆盖桌面和移动视口，确认页面不空白、无明显重叠、核心链接可用。
