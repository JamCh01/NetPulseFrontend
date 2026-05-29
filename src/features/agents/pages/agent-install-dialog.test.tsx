import { describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '@/test/utils'
import { createMockAgent } from '@/test/mocks/data/factories'
import { AgentInstallDialog } from './agent-install-dialog'

describe('AgentInstallDialog', () => {
  it('shows one-time Agent credentials and copies the one-click install command', async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
    const onClose = vi.fn()
    const agent = createMockAgent({
      name: 'Tokyo Edge Agent',
      auth_token: 'agent-token-once',
      nats_username: 'agent-00000000-0000-0000-0000-000000000001',
      nats_password: 'nats-password-once',
      install_command_available: true,
      install_command: {
        agent_uuid: '00000000-0000-0000-0000-000000000001',
        nats_username: 'agent-00000000-0000-0000-0000-000000000001',
        service_name: 'netpulse-agent',
        install_path: '/usr/local/bin/netpulse-agent',
        env_file: '/etc/netpulse-agent.env',
        contains_secrets: true,
        command: "sudo bash -s <<'NETPULSE_AGENT_INSTALL'\necho install\nNETPULSE_AGENT_INSTALL",
        script: '#!/usr/bin/env bash\necho install',
        nats_config_snippet: 'user: "agent-00000000-0000-0000-0000-000000000001"\npassword: "nats-password-once"',
      },
    })

    renderWithProviders(<AgentInstallDialog agent={agent} onClose={onClose} />)

    const dialog = screen.getByRole('dialog', { name: 'Agent 已创建' })
    expect(within(dialog).getByText('Tokyo Edge Agent')).toBeInTheDocument()
    expect(within(dialog).getByText('agent-token-once')).toBeInTheDocument()
    expect(within(dialog).getByText('agent-00000000-0000-0000-0000-000000000001')).toBeInTheDocument()
    expect(within(dialog).getByText('nats-password-once')).toBeInTheDocument()
    expect(within(dialog).getByText(/sudo bash -s/)).toBeInTheDocument()
    expect(within(dialog).getByText(/user: "agent-00000000/)).toBeInTheDocument()
    expect(within(dialog).getByText('安装步骤')).toBeInTheDocument()
    expect(within(dialog).getByText('1. 同步 NATS 用户配置')).toBeInTheDocument()
    expect(within(dialog).getByText('2. 执行一键安装命令')).toBeInTheDocument()
    expect(within(dialog).getByText('一次性凭据')).toBeInTheDocument()
    expect(within(dialog).getByText('凭据只在创建响应中完整返回一次。')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: '复制安装命令' }))

    expect(writeText).toHaveBeenCalledWith(agent.install_command?.command)
    expect(await within(dialog).findByRole('button', { name: '已复制' })).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: '复制 NATS 配置' }))

    expect(writeText).toHaveBeenCalledWith(agent.install_command?.nats_config_snippet)
  })

  it('requires an explicit close action and ignores outside clicks', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const agent = createMockAgent({ name: 'Seoul Edge Agent' })

    renderWithProviders(<AgentInstallDialog agent={agent} onClose={onClose} />)

    const dialog = screen.getByRole('dialog', { name: 'Agent 已创建' })
    await user.click(document.body)

    expect(onClose).not.toHaveBeenCalled()
    expect(dialog).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: '关闭' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
