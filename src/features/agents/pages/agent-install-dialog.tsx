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
    <Dialog
      open={!!agent}
      disablePointerDismissal
      onOpenChange={(open) => { if (!open) onClose() }}
    >
      <DialogContent className="max-h-[92vh] overflow-hidden border border-slate-600/80 bg-slate-900 p-0 text-slate-100 ring-slate-500/40 sm:max-w-4xl">
        <DialogHeader className="border-b border-slate-700/80 bg-slate-900 px-5 py-4 pr-12">
          <DialogTitle className="text-lg text-slate-50">{t('agentAdmin.createdDialogTitle')}</DialogTitle>
          <DialogDescription className="max-w-2xl text-slate-200">{t('agentAdmin.createdDialogDesc')}</DialogDescription>
        </DialogHeader>
        {agent && (
          <div className="max-h-[calc(92vh-9rem)] space-y-5 overflow-y-auto px-5 py-4">
            <div className="flex flex-col gap-3 rounded-lg border border-slate-600/80 bg-slate-800/80 p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="text-xs font-medium uppercase text-slate-300">
                  {t('agentAdmin.createdAgent')}
                </div>
                <div className="break-all text-base font-semibold text-slate-50">{agent.name}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {agent.install_command_available && (
                  <Badge className="border border-emerald-300/60 bg-emerald-950/70 text-emerald-50">
                    {t('agentAdmin.oneClickInstall')}
                  </Badge>
                )}
                <Badge className="border border-amber-300/60 bg-amber-950/70 text-amber-50">
                  {t('agentAdmin.oneTimeOnly')}
                </Badge>
              </div>
            </div>

            <p className="rounded-lg border border-amber-300/60 bg-amber-950/70 px-3 py-2 text-sm text-amber-50">
              {t('agentAdmin.credentialWarning')}
            </p>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-50">{t('agentAdmin.oneCommandInstallTitle')}</h3>
              <InstallStepBlock
                title={t('agentAdmin.oneCommandInstallAction')}
                description={t('agentAdmin.oneCommandInstallDesc')}
                code={installCommand ?? t('agentAdmin.installCommandUnavailable')}
                codeClassName="border-emerald-300/50 text-emerald-50"
                copyLabel={copiedField === 'installCommand' ? t('agentAdmin.copied') : t('agentAdmin.copyInstallCommand')}
                copyDisabled={!installCommand}
                onCopy={() => void copyValue(installCommand, 'installCommand')}
              />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-50">{t('agentAdmin.credentialDetailsTitle')}</h3>
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
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-50">{t('agentAdmin.advancedInfoTitle')}</h3>
              <InstallStepBlock
                title={t('agentAdmin.natsConfigSnippet')}
                description={t('agentAdmin.natsConfigSnippetDesc')}
                code={natsConfigSnippet ?? t('agentAdmin.natsConfigSnippetUnavailable')}
                codeClassName="border-slate-600/80 text-slate-100"
                copyLabel={copiedField === 'natsConfig' ? t('agentAdmin.copied') : t('agentAdmin.copyNatsConfigSnippet')}
                copyDisabled={!natsConfigSnippet}
                onCopy={() => void copyValue(natsConfigSnippet, 'natsConfig')}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button onClick={onClose}>{t('agentAdmin.closeDialog')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface InstallStepBlockProps {
  title: string
  description: string
  code: string
  codeClassName: string
  copyLabel: string
  copyDisabled: boolean
  onCopy: () => void
}

function InstallStepBlock({
  title,
  description,
  code,
  codeClassName,
  copyLabel,
  copyDisabled,
  onCopy,
}: InstallStepBlockProps) {
  return (
    <section className="grid min-h-0 gap-3 rounded-lg border border-slate-600/80 bg-slate-800/70 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="text-sm font-medium text-slate-50">{title}</div>
          <div className="text-xs leading-5 text-slate-200">{description}</div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={copyDisabled}
          onClick={onCopy}
        >
          {copyLabel}
        </Button>
      </div>
      <pre className={`max-h-72 overflow-auto rounded-md border bg-slate-950/90 p-3 text-xs leading-5 shadow-inner ${codeClassName}`}>
        <code>{code}</code>
      </pre>
    </section>
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
    <div className="space-y-1.5 rounded-lg border border-slate-600/80 bg-slate-950/70 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase text-slate-300">{label}</span>
        {copyLabel && onCopy && (
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-cyan-100 hover:bg-cyan-950/80 hover:text-cyan-50" onClick={onCopy}>
            {copyLabel}
          </Button>
        )}
      </div>
      <code className="block break-all text-sm text-slate-50">{value ?? '-'}</code>
    </div>
  )
}
