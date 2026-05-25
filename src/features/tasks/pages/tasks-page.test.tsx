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
  },
  mtr_retry_config: null,
  schedule_jitter_ms: 0,
  is_enabled: true,
  is_deleted: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

describe('TasksPage', () => {
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
    expect(within(dialog).getByText('任务类型由创建时确定，IPERF3 每天定时执行一次。')).toBeInTheDocument()

    expect(within(dialog).getByText('iperf3 线程模式')).toBeInTheDocument()
    expect(within(dialog).getByText('单线程用于基线测试，8 线程用于模拟多连接吞吐能力。')).toBeInTheDocument()
    expect(within(dialog).getByRole('combobox', { name: 'iperf3 线程模式' })).toHaveTextContent('8 线程')
    expect(within(dialog).queryByText('multi_thread')).not.toBeInTheDocument()
    expect(within(dialog).getByText('iperf3 执行时长')).toBeInTheDocument()
    expect(within(dialog).getByText('单次上传和下载动作各自运行的秒数，后端五分钟 claim 窗口覆盖两段动作。')).toBeInTheDocument()

    const config = within(dialog).getByLabelText('任务配置')
    expect(config).toHaveClass('divide-y')
    expect(within(config).getByLabelText('端口')).toHaveValue(5201)
    expect(within(config).getByLabelText('iperf3 执行时长')).toHaveValue(10)
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
})
