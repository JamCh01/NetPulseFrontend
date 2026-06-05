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
})
