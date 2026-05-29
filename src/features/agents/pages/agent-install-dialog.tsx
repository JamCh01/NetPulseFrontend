import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import type { AdminAgent } from '@/api/hooks/admin-api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface AgentInstallDialogProps {
  agent: AdminAgent | null
  onClose: () => void
}

type CopiedField = 'token' | 'natsPassword' | 'installCommand' | 'natsConfig' | null

export function AgentInstallDialog({ agent, onClose }: AgentInstallDialogProps) {
  const { t } = useTranslation()
  const [copiedField, setCopiedField] = useState<CopiedField>(null)
  const installCommand = agent?.install_command?.command
  const natsConfigSnippet = agent?.install_command?.nats_config_snippet

  const copyValue = async (value: string | undefined, field: CopiedField) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 1800)
    } catch {
      toast.error(t('agentAdmin.copyFailed'))
    }
  }

  return (
    <Dialog open={!!agent} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('agentAdmin.createdDialogTitle')}</DialogTitle>
          <DialogDescription>{t('agentAdmin.createdDialogDesc')}</DialogDescription>
        </DialogHeader>
        {agent && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-text-primary">{agent.name}</span>
              {agent.install_command_available && (
                <Badge className="border border-emerald-400/40 bg-emerald-400/10 text-emerald-200">
                  {t('agentAdmin.oneClickInstall')}
                </Badge>
              )}
            </div>

            <p className="rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
              {t('agentAdmin.credentialWarning')}
            </p>

            <div className="grid gap-3 md:grid-cols-2">
              <CredentialBlock
                label={t('agentAdmin.agentToken')}
                value={agent.auth_token}
                copyLabel={copiedField === 'token' ? t('agentAdmin.copied') : t('agentAdmin.copyToken')}
                onCopy={() => void copyValue(agent.auth_token, 'token')}
              />
              <CredentialBlock
                label={t('agentAdmin.natsUsername')}
                value={agent.nats_username}
              />
              <CredentialBlock
                label={t('agentAdmin.natsPassword')}
                value={agent.nats_password}
                copyLabel={copiedField === 'natsPassword' ? t('agentAdmin.copied') : t('agentAdmin.copyNatsPassword')}
                onCopy={() => void copyValue(agent.nats_password, 'natsPassword')}
              />
              <CredentialBlock
                label={t('agentAdmin.systemdService')}
                value={agent.install_command?.service_name}
              />
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-text-primary">{t('agentAdmin.installCommand')}</div>
                  <div className="text-xs text-text-muted">{t('agentAdmin.installCommandDesc')}</div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!installCommand}
                  onClick={() => void copyValue(installCommand, 'installCommand')}
                >
                  {copiedField === 'installCommand' ? t('agentAdmin.copied') : t('agentAdmin.copyInstallCommand')}
                </Button>
              </div>
              <pre className="max-h-72 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-xs leading-5 text-emerald-200">
                <code>{installCommand ?? t('agentAdmin.installCommandUnavailable')}</code>
              </pre>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-text-primary">{t('agentAdmin.natsConfigSnippet')}</div>
                  <div className="text-xs text-text-muted">{t('agentAdmin.natsConfigSnippetDesc')}</div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!natsConfigSnippet}
                  onClick={() => void copyValue(natsConfigSnippet, 'natsConfig')}
                >
                  {copiedField === 'natsConfig' ? t('agentAdmin.copied') : t('agentAdmin.copyNatsConfigSnippet')}
                </Button>
              </div>
              <pre className="max-h-72 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-xs leading-5 text-cyan-100">
                <code>{natsConfigSnippet ?? t('agentAdmin.natsConfigSnippetUnavailable')}</code>
              </pre>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button onClick={onClose}>{t('common.done')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface CredentialBlockProps {
  label: string
  value?: string
  copyLabel?: string
  onCopy?: () => void
}

function CredentialBlock({ label, value, copyLabel, onCopy }: CredentialBlockProps) {
  return (
    <div className="space-y-1.5 rounded-lg border border-border bg-white/[0.03] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</span>
        {copyLabel && onCopy && (
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onCopy}>
            {copyLabel}
          </Button>
        )}
      </div>
      <code className="block break-all text-sm text-emerald-300">{value ?? '-'}</code>
    </div>
  )
}
