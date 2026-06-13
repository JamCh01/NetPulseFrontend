import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'

import MonitoringIndexPage from './monitoring-index-page'
import { renderWithProviders } from '@/test/utils'
import { server } from '@/test/mocks/server'

vi.mock('@/features/monitoring/components/charts/multi-agent-chart', () => ({
  MultiAgentChart: () => <div data-testid="multi-agent-chart" />,
}))

describe('MonitoringIndexPage', () => {
  it('shows the selected Target comment in the Target summary detail area', async () => {
    server.use(
      http.get('*/api/v1/monitoring/targets/target-1', () => HttpResponse.json({
        data: {
          target_uuid: 'target-1',
          name: 'Tokyo Edge',
          target: 'example.com',
          target_type: 'domain',
          ip_version: '4+6',
          is_anycast: false,
          continent: 'Asia',
          country: 'Japan',
          city: 'Tokyo',
          carrier: 'Example IDC',
          comment: '# 东京边缘节点\n\n- 公网连通性监控\n- Anycast 入口\n\n[Runbook](https://example.com/runbook)',
        },
      })),
      http.get('*/api/v1/monitoring/tasks', () => HttpResponse.json({
        data: {
          items: [{
            task_uuid: 'task-1',
            name: 'Tokyo ICMP',
            task_type: 'icmp',
            interval_sec: 60,
            is_enabled: true,
            target: {
              target_uuid: 'target-1',
              name: 'Tokyo Edge',
              target: 'example.com',
              target_type: 'domain',
              ip_version: '4+6',
              is_anycast: false,
              continent: 'Asia',
              country: 'Japan',
              city: 'Tokyo',
              carrier: 'Example IDC',
              comment: '# 东京边缘节点\n\n- 公网连通性监控\n- Anycast 入口\n\n[Runbook](https://example.com/runbook)',
            },
            agent: {
              agent_uuid: 'agent-1',
              name: 'Tokyo Agent',
              city: 'Tokyo',
              country: 'Japan',
            },
            latest_result: {
              exists: true,
              latest_sample_at: '2026-06-05T00:00:00Z',
              latest_run_status: 'success',
            },
            created_at: '2026-06-05T00:00:00Z',
            updated_at: '2026-06-05T00:00:00Z',
          }],
        },
      })),
    )

    renderWithProviders(<MonitoringIndexPage />, {
      initialEntries: ['/monitoring?target_uuid=target-1'],
    })

    const summary = await screen.findByRole('region', { name: 'Tokyo Edge' })
    expect(screen.queryByText('example.com')).not.toBeInTheDocument()
    expect(within(summary).getByText('Target 描述')).toBeInTheDocument()
    expect(within(summary).getByRole('heading', { name: '东京边缘节点' })).toBeInTheDocument()
    expect(within(summary).getByText('公网连通性监控')).toBeInTheDocument()
    expect(within(summary).getByText('Anycast 入口')).toBeInTheDocument()
    expect(within(summary).getByRole('link', { name: 'Runbook' })).toHaveAttribute('href', 'https://example.com/runbook')
    expect(within(summary).queryByText('任务数')).not.toBeInTheDocument()
    expect(within(summary).queryByText('Agent')).not.toBeInTheDocument()
  })

  it('prefers the public Target detail comment over stale task list data', async () => {
    server.use(
      http.get('*/api/v1/monitoring/targets/target-1', () => HttpResponse.json({
        data: {
          target_uuid: 'target-1',
          name: 'Tokyo Edge',
          target: 'example.com',
          target_type: 'domain',
          ip_version: '4+6',
          is_anycast: false,
          continent: 'Asia',
          country: 'Japan',
          city: 'Tokyo',
          carrier: 'Example IDC',
          comment: '后台刚更新的 Target 描述。',
        },
      })),
      http.get('*/api/v1/monitoring/tasks', () => HttpResponse.json({
        data: {
          items: [{
            task_uuid: 'task-1',
            name: 'Tokyo ICMP',
            task_type: 'icmp',
            interval_sec: 60,
            is_enabled: true,
            target: {
              target_uuid: 'target-1',
              name: 'Tokyo Edge',
              target: 'example.com',
              target_type: 'domain',
              ip_version: '4+6',
              is_anycast: false,
              continent: 'Asia',
              country: 'Japan',
              city: 'Tokyo',
              carrier: 'Example IDC',
              comment: '旧的任务列表 Target 描述。',
            },
            agent: {
              agent_uuid: 'agent-1',
              name: 'Tokyo Agent',
              city: 'Tokyo',
              country: 'Japan',
            },
            latest_result: {
              exists: true,
              latest_sample_at: '2026-06-05T00:00:00Z',
              latest_run_status: 'success',
            },
            created_at: '2026-06-05T00:00:00Z',
            updated_at: '2026-06-05T00:00:00Z',
          }],
        },
      })),
    )

    renderWithProviders(<MonitoringIndexPage />, {
      initialEntries: ['/monitoring?target_uuid=target-1'],
    })

    const summary = await screen.findByRole('region', { name: 'Tokyo Edge' })
    expect(await within(summary).findByText('后台刚更新的 Target 描述。')).toBeInTheDocument()
    expect(within(summary).queryByText('旧的任务列表 Target 描述。')).not.toBeInTheDocument()
  })

  it('hides protocol sections when the selected Target has no tasks for that protocol', async () => {
    server.use(
      http.get('*/api/v1/monitoring/targets/target-1', () => HttpResponse.json({
        data: {
          target_uuid: 'target-1',
          name: 'Tokyo Edge',
          target: 'example.com',
          target_type: 'domain',
          ip_version: '4+6',
          is_anycast: false,
          continent: 'Asia',
          country: 'Japan',
          city: 'Tokyo',
          carrier: 'Example IDC',
          comment: 'Only ICMP is monitored.',
        },
      })),
      http.get('*/api/v1/monitoring/tasks', () => HttpResponse.json({
        data: {
          items: [{
            task_uuid: 'task-icmp-1',
            name: 'Tokyo ICMP',
            task_type: 'icmp',
            interval_sec: 60,
            is_enabled: true,
            target: {
              target_uuid: 'target-1',
              name: 'Tokyo Edge',
              target: 'example.com',
              target_type: 'domain',
              ip_version: '4+6',
              is_anycast: false,
              continent: 'Asia',
              country: 'Japan',
              city: 'Tokyo',
              carrier: 'Example IDC',
              comment: 'Only ICMP is monitored.',
            },
            agent: {
              agent_uuid: 'agent-1',
              name: 'Tokyo Agent',
              city: 'Tokyo',
              country: 'Japan',
            },
            latest_result: {
              exists: true,
              latest_sample_at: '2026-06-05T00:00:00Z',
              latest_run_status: 'success',
            },
            created_at: '2026-06-05T00:00:00Z',
            updated_at: '2026-06-05T00:00:00Z',
          }],
        },
      })),
      http.get('*/api/v1/monitoring/tasks/task-icmp-1/metrics', () => HttpResponse.json({
        data: { series: [] },
      })),
    )

    renderWithProviders(<MonitoringIndexPage />, {
      initialEntries: ['/monitoring?target_uuid=target-1'],
    })

    await screen.findByRole('region', { name: 'Tokyo Edge' })
    expect(screen.getByRole('heading', { name: 'ICMP' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'TCP' })).not.toBeInTheDocument()
    expect(screen.queryByText('MTR 结果')).not.toBeInTheDocument()
    expect(screen.queryByText('iperf3 结果')).not.toBeInTheDocument()
    expect(screen.queryByText('当前 Target 没有 TCP 任务')).not.toBeInTheDocument()
    expect(screen.queryByText('当前 Target 没有 MTR 任务')).not.toBeInTheDocument()
    expect(screen.queryByText('当前 Target 没有 IPERF3 任务')).not.toBeInTheDocument()
  })

  it('links Route Trace tasks to the Route Trace result page', async () => {
    server.use(
      http.get('*/api/v1/monitoring/tasks', () => HttpResponse.json({
        data: {
          items: [{
            task_uuid: 'task-route-trace-1',
            name: 'Tokyo Route Trace',
            task_type: 'route_trace',
            interval_sec: 600,
            is_enabled: true,
            target: {
              target_uuid: 'target-1',
              name: 'Tokyo Edge',
              target: '[Target]',
              target_type: 'domain',
              ip_version: '4',
              is_anycast: false,
              continent: 'Asia',
              country: 'Japan',
              city: 'Tokyo',
              carrier: 'Example IDC',
            },
            agent: {
              agent_uuid: 'agent-1',
              name: 'Tokyo Agent',
              city: 'Tokyo',
              country: 'Japan',
            },
            latest_result: {
              exists: true,
              latest_sample_at: '2026-06-07T00:00:03Z',
              latest_run_status: 'ok',
            },
            created_at: '2026-06-07T00:00:00Z',
            updated_at: '2026-06-07T00:00:00Z',
          }],
        },
      })),
    )

    renderWithProviders(<MonitoringIndexPage />, {
      initialEntries: ['/app/monitoring'],
    })

    const taskLink = await screen.findByRole('link', { name: /Tokyo Route Trace/ })
    expect(taskLink).toHaveAttribute('href', '/app/monitoring/task-route-trace-1/route-trace')
  })

  it('shows Route Trace results on the selected Target page', async () => {
    server.use(
      http.get('*/api/v1/monitoring/targets/target-1', () => HttpResponse.json({
        data: {
          target_uuid: 'target-1',
          name: 'Tokyo Edge',
          target: '[Target]',
          target_type: 'domain',
          ip_version: '4',
          is_anycast: false,
          continent: 'Asia',
          country: 'Japan',
          city: 'Tokyo',
          carrier: 'Example IDC',
          comment: 'Route Trace target.',
        },
      })),
      http.get('*/api/v1/monitoring/tasks', () => HttpResponse.json({
        data: {
          items: [{
            task_uuid: 'task-route-trace-1',
            name: 'Tokyo Route Trace',
            task_type: 'route_trace',
            interval_sec: 600,
            is_enabled: true,
            target: {
              target_uuid: 'target-1',
              name: 'Tokyo Edge',
              target: '[Target]',
              target_type: 'domain',
              ip_version: '4',
              is_anycast: false,
              continent: 'Asia',
              country: 'Japan',
              city: 'Tokyo',
              carrier: 'Example IDC',
            },
            agent: {
              agent_uuid: 'agent-1',
              name: 'Tokyo Agent',
              city: 'Tokyo',
              country: 'Japan',
            },
            latest_result: {
              exists: true,
              latest_sample_at: '2026-06-07T00:00:03Z',
              latest_run_status: 'ok',
              hop_count: 5,
            },
            created_at: '2026-06-07T00:00:00Z',
            updated_at: '2026-06-07T00:00:00Z',
          }],
        },
      })),
      http.get('*/api/v1/monitoring/tasks/task-route-trace-1/route-trace-results', () => HttpResponse.json({
        data: {
          task_uuid: 'task-route-trace-1',
          items: [{
            result_uuid: 'route-result-1',
            task_uuid: 'task-route-trace-1',
            agent_uuid: 'agent-1',
            latest_sample_at: '2026-06-07T00:00:03Z',
            latest_run_status: 'ok',
            target_reached: true,
            hop_count: 2,
            duration_ms: 3000,
            resolved_ip: '[Target IP]',
            as_path: ['AS64512', 'AS13335'],
            hops: [
              {
                hop: 1,
                addresses: [{
                  ip: '10.0.0.1',
                  hostname: 'gateway.local',
                  asn: 'AS64512',
                  packet_loss_pct: 0,
                  packets_sent: 3,
                  packets_received: 3,
                  avg_ms: 1.2,
                  best_ms: 1,
                  worst_ms: 1.5,
                }],
              },
              {
                hop: 2,
                addresses: [{
                  ip: '[Target IP]',
                  hostname: null,
                  asn: 'AS13335',
                  packet_loss_pct: 0,
                  packets_sent: 3,
                  packets_received: 3,
                  avg_ms: 8,
                  best_ms: 7.5,
                  worst_ms: 8.5,
                }],
              },
            ],
          }],
        },
      })),
    )

    renderWithProviders(<MonitoringIndexPage />, {
      initialEntries: ['/monitoring?target_uuid=target-1'],
    })

    expect(await screen.findByRole('heading', { name: 'Route Trace 结果' })).toBeInTheDocument()
    expect(screen.getByText('Route Trace Result 时间轴')).toBeInTheDocument()
    expect(screen.queryByText('MTR Result 时间轴')).not.toBeInTheDocument()
    expect(screen.getByText('AS64512->AS13335')).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /2 \[Target IP\] - AS13335 3 3 0.0% 8.0ms 7.5ms 8.5ms/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '查看 Route Trace 结果' })).not.toBeInTheDocument()
  })
})
