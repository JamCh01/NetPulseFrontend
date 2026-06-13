import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import TasksPage from './tasks-page'
import { renderWithProviders } from '@/test/utils'
import { server } from '@/test/mocks/server'

const target = {
  target_uuid: 'target-iperf3',
  name: 'Tokyo iperf3 Target',
  target: 'iperf3.tokyo.example.com',
  target_type: 'domain',
  ip_version: '4',
  is_anycast: false,
  continent: 'Asia',
  country: 'Japan',
  city: 'Tokyo',
  zip_code: '',
  carrier: '',
  comment: null,
  tags: [],
  supported_protocols: ['icmp', 'tcp', 'mtr', 'iperf3'],
  is_enabled: true,
  is_deleted: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const agent = {
  agent_uuid: 'agent-tokyo',
  name: 'Tokyo Agent',
  agent_name: 'Tokyo Agent',
  ip_version: '4',
  continent: 'Asia',
  country: 'Japan',
  city: 'Tokyo',
  zip_code: '',
  carrier: '',
  comment: null,
  tags: [],
  is_enabled: true,
  is_deleted: false,
  status: 'online',
  expected_config_version: 1,
  applied_config_version: 1,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const iperf3Task = {
  task_uuid: 'task-iperf3',
  name: 'Tokyo iperf3 daily',
  target_uuid: target.target_uuid,
  agent_uuid: agent.agent_uuid,
  target,
  agent,
  task_type: 'iperf3',
  ip_family: '4',
  interval: 86400,
  timeout: 15000,
  packet_count: 1,
  probe_config: {
    mode: 'multi_thread',
    port: 5201,
    duration_sec: 10,
    parallel: 8,
    execution_time: '03:05:00',
  },
  mtr_retry_config: null,
  schedule_jitter_ms: 0,
  is_enabled: true,
  is_deleted: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const tcpTask = {
  task_uuid: 'task-tcp',
  name: 'Tokyo TCP',
  target_uuid: target.target_uuid,
  agent_uuid: agent.agent_uuid,
  target,
  agent,
  task_type: 'tcp',
  ip_family: '4',
  interval: 60,
  timeout: 3000,
  packet_count: 30,
  probe_config: {
    port: 22,
    payload_size: 64,
    packet_count: 30,
    connect_interval_ms: 1500,
  },
  mtr_retry_config: null,
  schedule_jitter_ms: 0,
  is_enabled: true,
  is_deleted: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const routeTraceCapableTarget = {
  ...target,
  target_uuid: 'target-route-trace',
  name: 'Cloudflare Route Trace',
  target: '1.1.1.1',
  target_type: 'ip',
  ip_version: '4',
  supported_protocols: ['route_trace'],
}

const mixedRouteTraceTarget = {
  ...target,
  target_uuid: 'target-mixed-route-trace',
  name: 'Mixed Route Trace Target',
  target: 'example.com',
  target_type: 'domain',
  ip_version: '4',
  supported_protocols: ['icmp', 'tcp', 'mtr', 'iperf3', 'route_trace'],
}

describe('TasksPage', () => {
  it('loads Target and Agent options for quick association with backend-compatible page sizes', async () => {
    const user = userEvent.setup()
    const targetPageSizes: string[] = []
    const agentPageSizes: string[] = []
    const quickAssociateRequests: unknown[] = []
    const quickTarget = { ...target, ip_version: '4+6' }
    const quickAgent = { ...agent, ip_version: '6' }
    server.use(
      http.get('*/api/v1/tasks', () => HttpResponse.json({ items: [] })),
      http.get('*/api/v1/targets', ({ request }) => {
        targetPageSizes.push(new URL(request.url).searchParams.get('page_size') ?? '')
        return HttpResponse.json({ items: [quickTarget] })
      }),
      http.get('*/api/v1/agents', ({ request }) => {
        agentPageSizes.push(new URL(request.url).searchParams.get('page_size') ?? '')
        return HttpResponse.json({ items: [quickAgent] })
      }),
      http.post('*/api/v1/relations/quick-associate', async ({ request }) => {
        quickAssociateRequests.push(await request.json())
        return HttpResponse.json([iperf3Task])
      }),
    )

    renderWithProviders(<TasksPage />)

    await user.click(screen.getByRole('button', { name: '快速关联' }))
    const dialog = await screen.findByRole('dialog', { name: '快速关联' })

    await user.click(within(dialog).getByRole('combobox', { name: 'Target' }))
    await user.click(await screen.findByRole('option', { name: /Tokyo iperf3 Target/ }))
    await user.click(within(dialog).getByRole('combobox', { name: 'Agent' }))
    await user.click(await screen.findByRole('option', { name: /Tokyo Agent/ }))

    expect(within(dialog).getByRole('combobox', { name: 'Target' })).toHaveTextContent('Tokyo iperf3 Target')
    expect(within(dialog).getByRole('combobox', { name: 'Agent' })).toHaveTextContent('Tokyo Agent')
    expect(within(dialog).getByRole('button', { name: '关联' })).toBeEnabled()
    expect(within(dialog).getByText('任务类型')).toBeInTheDocument()
    expect(within(dialog).getByText('IP 版本')).toBeInTheDocument()
    expect(within(dialog).getByRole('option', { name: 'ICMP' })).toHaveAttribute('aria-selected', 'true')
    await user.click(within(dialog).getByRole('option', { name: 'MTR' }))
    expect(within(dialog).getByRole('option', { name: 'IPv6' })).toHaveAttribute('aria-selected', 'true')

    await user.click(within(dialog).getByRole('button', { name: '关联' }))

    expect(targetPageSizes).toContain('100')
    expect(agentPageSizes).toContain('100')
    expect(quickAssociateRequests).toEqual([
      {
        target_uuid: target.target_uuid,
        agent_uuid: agent.agent_uuid,
        task_types: ['icmp', 'mtr'],
        ip_families: ['6'],
      },
    ])
  })

  it('does not render raw Target addresses in task target selectors', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('*/api/v1/tasks', () => HttpResponse.json({ items: [] })),
      http.get('*/api/v1/targets', () => HttpResponse.json({ items: [target] })),
      http.get('*/api/v1/agents', () => HttpResponse.json({ items: [agent] })),
    )

    renderWithProviders(<TasksPage />)

    await user.click(screen.getByRole('button', { name: '新增 Task' }))
    const dialog = await screen.findByRole('dialog', { name: '新增 Task' })
    await user.click(within(dialog).getByRole('combobox', { name: 'Target' }))

    expect(await screen.findByRole('option', { name: 'Tokyo iperf3 Target' })).toBeInTheDocument()
    expect(screen.queryByText('iperf3.tokyo.example.com')).not.toBeInTheDocument()
  })

  it('shows only fields related to the selected protocol when creating tasks', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('*/api/v1/tasks', () => HttpResponse.json({ items: [] })),
      http.get('*/api/v1/targets', () => HttpResponse.json({ items: [target] })),
      http.get('*/api/v1/agents', () => HttpResponse.json({ items: [agent] })),
    )

    renderWithProviders(<TasksPage />)

    await user.click(screen.getByRole('button', { name: '新增 Task' }))
    const dialog = await screen.findByRole('dialog', { name: '新增 Task' })
    await user.click(within(dialog).getByRole('combobox', { name: 'Target' }))
    await user.click(await screen.findByRole('option', { name: /Tokyo iperf3 Target/ }))

    expect(within(dialog).getByText('ICMP 参数')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('调度间隔')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('超时时间')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('包数量')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('载荷大小')).toHaveValue(64)
    expect(within(dialog).getByLabelText('TTL')).toBeInTheDocument()
    expect(within(dialog).getByRole('switch', { name: '禁止分片' })).toBeInTheDocument()
    expect(within(dialog).queryByLabelText('端口')).not.toBeInTheDocument()
    expect(within(dialog).queryByLabelText('iperf3 线程模式')).not.toBeInTheDocument()

    await user.click(within(dialog).getByRole('combobox', { name: '协议类型' }))
    await user.click(await screen.findByRole('option', { name: 'TCP' }))

    expect(within(dialog).getByText('TCP 参数')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('端口')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('端口')).toHaveValue(22)
    expect(within(dialog).getByLabelText('连接间隔')).toHaveValue(1000)
    expect(within(dialog).getByLabelText('载荷大小')).toHaveValue(64)
    expect(within(dialog).queryByLabelText('iperf3 执行时长')).not.toBeInTheDocument()

    await user.click(within(dialog).getByRole('combobox', { name: '协议类型' }))
    await user.click(await screen.findByRole('option', { name: 'MTR' }))

    expect(within(dialog).getByText('MTR 参数')).toBeInTheDocument()
    expect(within(dialog).getByRole('combobox', { name: 'MTR 探测协议' })).toHaveTextContent('ICMP Echo')
    expect(within(dialog).getByLabelText('最大跳数')).toHaveValue(30)
    expect(within(dialog).getByLabelText('载荷大小')).toHaveValue(64)
    expect(within(dialog).getByLabelText('包数量')).toHaveValue(10)
    expect(within(dialog).getByRole('switch', { name: '启用 MTR 重试' })).toBeInTheDocument()
    expect(within(dialog).queryByLabelText('端口')).not.toBeInTheDocument()

    await user.click(within(dialog).getByRole('combobox', { name: 'MTR 探测协议' }))
    await user.click(await screen.findByRole('option', { name: 'TCP' }))
    expect(within(dialog).getByLabelText('端口')).toHaveValue(443)

    await user.click(within(dialog).getByRole('combobox', { name: '协议类型' }))
    await user.click(await screen.findByRole('option', { name: 'IPERF3' }))

    expect(within(dialog).getByText('IPERF3 参数')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('端口')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('端口')).toHaveValue(5201)
    expect(within(dialog).getByLabelText('iperf3 线程模式')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('iperf3 执行时长')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('iperf3 UTC 执行时间')).toHaveValue('00:00')
    expect(within(dialog).queryByLabelText('调度间隔')).not.toBeInTheDocument()
    expect(within(dialog).queryByLabelText('包数量')).not.toBeInTheDocument()
  })

  it('edits iperf3 tasks with one canonical protocol label and described two-column fields', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('*/api/v1/tasks', () => HttpResponse.json({ items: [iperf3Task] })),
      http.get('*/api/v1/targets', () => HttpResponse.json({ items: [target] })),
      http.get('*/api/v1/agents', () => HttpResponse.json({ items: [agent] })),
    )

    renderWithProviders(<TasksPage />)

    await user.click(await screen.findByRole('button', { name: '编辑' }))

    const dialog = await screen.findByRole('dialog', { name: '编辑 Task' })
    expect(within(dialog).getByText('协议类型')).toBeInTheDocument()
    expect(within(dialog).getByText('IPERF3')).toBeInTheDocument()
    expect(within(dialog).queryByDisplayValue('IPERF3')).not.toBeInTheDocument()
    expect(within(dialog).getByText('任务类型由创建时确定；只能修改绑定关系、IP 协议族、调度参数和对应协议的探测参数。')).toBeInTheDocument()

    expect(within(dialog).getByText('iperf3 线程模式')).toBeInTheDocument()
    expect(within(dialog).getByText('单线程用于基线测试，8 线程用于模拟多连接吞吐能力。')).toBeInTheDocument()
    expect(within(dialog).getByRole('combobox', { name: 'iperf3 线程模式' })).toHaveTextContent('8 线程')
    expect(within(dialog).queryByText('multi_thread')).not.toBeInTheDocument()
    expect(within(dialog).getByText('iperf3 执行时长')).toBeInTheDocument()
    expect(within(dialog).getByText('单次上传和下载动作各自运行的秒数，后端五分钟 claim 窗口覆盖两段动作。')).toBeInTheDocument()
    expect(within(dialog).getByText('iperf3 UTC 执行时间')).toBeInTheDocument()
    expect(within(dialog).getByText('按 UTC 时间每天执行 iperf3 任务，格式为 HH:MM；Agent 本地执行时间会随所在时区换算。')).toBeInTheDocument()

    const config = within(dialog).getByLabelText('任务配置')
    expect(config).toHaveClass('overflow-y-auto')
    expect(within(config).getByLabelText('端口')).toHaveValue(5201)
    expect(within(config).getByLabelText('iperf3 执行时长')).toHaveValue(10)
    expect(within(config).getByLabelText('iperf3 UTC 执行时间')).toHaveValue('03:05')
  })

  it('submits iperf3 execution time when creating and editing tasks', async () => {
    const user = userEvent.setup()
    const createRequests: unknown[] = []
    const updateRequests: unknown[] = []
    server.use(
      http.get('*/api/v1/tasks', () => HttpResponse.json({ items: [iperf3Task] })),
      http.get('*/api/v1/targets', () => HttpResponse.json({ items: [target] })),
      http.get('*/api/v1/agents', () => HttpResponse.json({ items: [agent] })),
      http.post('*/api/v1/tasks', async ({ request }) => {
        createRequests.push(await request.json())
        return HttpResponse.json({ ...iperf3Task, probe_config: { ...iperf3Task.probe_config, execution_time: '04:30:00' } }, { status: 201 })
      }),
      http.patch('*/api/v1/tasks/:taskUuid', async ({ request }) => {
        updateRequests.push(await request.json())
        return HttpResponse.json({ ...iperf3Task, probe_config: { ...iperf3Task.probe_config, execution_time: '05:45:00' } })
      }),
    )

    renderWithProviders(<TasksPage />)

    await user.click(screen.getByRole('button', { name: '新增 Task' }))
    const createDialog = await screen.findByRole('dialog', { name: '新增 Task' })
    await user.click(within(createDialog).getByRole('combobox', { name: 'Target' }))
    await user.click(await screen.findByRole('option', { name: /Tokyo iperf3 Target/ }))
    await user.click(within(createDialog).getByRole('combobox', { name: 'Agent' }))
    await user.click(await screen.findByRole('option', { name: /Tokyo Agent/ }))
    await user.click(within(createDialog).getByRole('combobox', { name: '协议类型' }))
    await user.click(await screen.findByRole('option', { name: 'IPERF3' }))
    await user.clear(within(createDialog).getByLabelText('iperf3 UTC 执行时间'))
    await user.type(within(createDialog).getByLabelText('iperf3 UTC 执行时间'), '04:30')
    await user.click(within(createDialog).getByRole('button', { name: '创建' }))

    expect(createRequests).toHaveLength(1)
    expect(createRequests[0]).toMatchObject({
      task_type: 'iperf3',
      probe_config: {
        execution_time: '04:30',
      },
    })

    await user.click(await screen.findByRole('button', { name: '编辑' }))
    const editDialog = await screen.findByRole('dialog', { name: '编辑 Task' })
    await user.clear(within(editDialog).getByLabelText('iperf3 UTC 执行时间'))
    await user.type(within(editDialog).getByLabelText('iperf3 UTC 执行时间'), '05:45')
    await user.click(within(editDialog).getByRole('button', { name: '保存' }))

    expect(updateRequests).toHaveLength(1)
    expect(updateRequests[0]).toMatchObject({
      probe_config: {
        execution_time: '05:45',
      },
    })
  })

  it('offers iperf3 in create protocol choices when the target supports it', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('*/api/v1/tasks', () => HttpResponse.json({ items: [] })),
      http.get('*/api/v1/targets', () => HttpResponse.json({ items: [target] })),
      http.get('*/api/v1/agents', () => HttpResponse.json({ items: [agent] })),
    )

    renderWithProviders(<TasksPage />)

    await user.click(screen.getByRole('button', { name: '新增 Task' }))
    const dialog = await screen.findByRole('dialog', { name: '新增 Task' })
    await user.click(within(dialog).getByRole('combobox', { name: 'Target' }))
    await user.click(await screen.findByRole('option', { name: /Tokyo iperf3 Target/ }))
    await user.click(within(dialog).getByRole('combobox', { name: '协议类型' }))

    expect(await screen.findByRole('option', { name: 'IPERF3' })).toBeInTheDocument()
  })

  it('creates route trace tasks against a normal Target that supports route_trace', async () => {
    const user = userEvent.setup()
    const createRequests: unknown[] = []
    server.use(
      http.get('*/api/v1/tasks', () => HttpResponse.json({ items: [] })),
      http.get('*/api/v1/targets', () => HttpResponse.json({ items: [routeTraceCapableTarget] })),
      http.get('*/api/v1/agents', () => HttpResponse.json({ items: [agent] })),
      http.post('*/api/v1/tasks', async ({ request }) => {
        createRequests.push(await request.json())
        return HttpResponse.json({
          task_uuid: 'task-route-trace',
          name: 'Cloudflare Route Trace',
          target_uuid: routeTraceCapableTarget.target_uuid,
          target: routeTraceCapableTarget,
          agent_uuid: agent.agent_uuid,
          agent,
          task_type: 'route_trace',
          ip_family: '4',
          interval: 600,
          timeout: 10000,
          packet_count: 3,
          probe_config: {
            probe_protocol: 'icmp_echo',
            payload_size: 64,
            max_hops: 30,
          },
          mtr_retry_config: null,
          schedule_jitter_ms: 0,
          is_enabled: true,
          is_deleted: false,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        }, { status: 201 })
      }),
    )

    renderWithProviders(<TasksPage />)

    await user.click(screen.getByRole('button', { name: '新增 Task' }))
    const dialog = await screen.findByRole('dialog', { name: '新增 Task' })
    await user.click(within(dialog).getByRole('combobox', { name: 'Target' }))
    await user.click(await screen.findByRole('option', { name: /Cloudflare Route Trace/ }))
    await user.click(within(dialog).getByRole('combobox', { name: '协议类型' }))
    await user.click(await screen.findByRole('option', { name: 'Route Trace' }))
    await user.click(within(dialog).getByRole('combobox', { name: 'Agent' }))
    await user.click(await screen.findByRole('option', { name: /Tokyo Agent/ }))
    await user.click(within(dialog).getByRole('button', { name: '创建' }))

    expect(createRequests).toHaveLength(1)
    expect(createRequests[0]).toMatchObject({
      target_uuid: routeTraceCapableTarget.target_uuid,
      agent_uuid: agent.agent_uuid,
      task_type: 'route_trace',
      ip_family: '4',
      interval: 600,
      timeout: 10000,
      packet_count: 3,
      probe_config: {
        probe_protocol: 'icmp_echo',
        payload_size: 64,
        max_hops: 30,
      },
    })
  })

  it('offers route trace after both target and agent are selected', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('*/api/v1/tasks', () => HttpResponse.json({ items: [] })),
      http.get('*/api/v1/targets', () => HttpResponse.json({ items: [mixedRouteTraceTarget] })),
      http.get('*/api/v1/agents', () => HttpResponse.json({ items: [agent] })),
    )

    renderWithProviders(<TasksPage />)

    await user.click(screen.getByRole('button', { name: '新增 Task' }))
    const dialog = await screen.findByRole('dialog', { name: '新增 Task' })
    await user.click(within(dialog).getByRole('combobox', { name: 'Target' }))
    await user.click(await screen.findByRole('option', { name: /Mixed Route Trace Target/ }))
    await user.click(within(dialog).getByRole('combobox', { name: 'Agent' }))
    await user.click(await screen.findByRole('option', { name: /Tokyo Agent/ }))
    await user.click(within(dialog).getByRole('combobox', { name: '协议类型' }))

    expect(await screen.findByRole('option', { name: 'Route Trace' })).toBeInTheDocument()
  })

  it('submits and edits TCP connect interval in probe config', async () => {
    const user = userEvent.setup()
    const createRequests: unknown[] = []
    const updateRequests: unknown[] = []
    server.use(
      http.get('*/api/v1/tasks', () => HttpResponse.json({ items: [tcpTask] })),
      http.get('*/api/v1/targets', () => HttpResponse.json({ items: [target] })),
      http.get('*/api/v1/agents', () => HttpResponse.json({ items: [agent] })),
      http.post('*/api/v1/tasks', async ({ request }) => {
        createRequests.push(await request.json())
        return HttpResponse.json(tcpTask, { status: 201 })
      }),
      http.patch('*/api/v1/tasks/:taskUuid', async ({ request }) => {
        updateRequests.push(await request.json())
        return HttpResponse.json({ ...tcpTask, probe_config: { ...tcpTask.probe_config, connect_interval_ms: 2000 } })
      }),
    )

    renderWithProviders(<TasksPage />)

    await user.click(screen.getByRole('button', { name: '新增 Task' }))
    const createDialog = await screen.findByRole('dialog', { name: '新增 Task' })
    await user.click(within(createDialog).getByRole('combobox', { name: 'Target' }))
    await user.click(await screen.findByRole('option', { name: /Tokyo iperf3 Target/ }))
    await user.click(within(createDialog).getByRole('combobox', { name: 'Agent' }))
    await user.click(await screen.findByRole('option', { name: /Tokyo Agent/ }))
    await user.click(within(createDialog).getByRole('combobox', { name: '协议类型' }))
    await user.click(await screen.findByRole('option', { name: 'TCP' }))
    await user.clear(within(createDialog).getByLabelText('连接间隔'))
    await user.type(within(createDialog).getByLabelText('连接间隔'), '750')
    await user.click(within(createDialog).getByRole('button', { name: '创建' }))

    expect(createRequests).toHaveLength(1)
    expect(createRequests[0]).toMatchObject({
      task_type: 'tcp',
      probe_config: {
        port: 22,
        payload_size: 64,
        connect_interval_ms: 750,
      },
    })

    await user.click(await screen.findByRole('button', { name: '编辑' }))
    const editDialog = await screen.findByRole('dialog', { name: '编辑 Task' })
    expect(within(editDialog).getByLabelText('连接间隔')).toHaveValue(1500)
    await user.clear(within(editDialog).getByLabelText('连接间隔'))
    await user.type(within(editDialog).getByLabelText('连接间隔'), '2000')
    await user.click(within(editDialog).getByRole('button', { name: '保存' }))

    expect(updateRequests).toHaveLength(1)
    expect(updateRequests[0]).toMatchObject({
      probe_config: {
        port: 22,
        payload_size: 64,
        connect_interval_ms: 2000,
      },
    })
  })
})
