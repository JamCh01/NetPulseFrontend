import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAgents, useCreateAgent, useDisableAgent, useUpdateAgent } from '@/api/hooks/use-agents'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { GeoCascader } from '@/features/agents/components/geo-cascader'
import type { AgentResponse } from '@/api/generated/types.gen'
import { AGENT_STATUS_COLORS } from '@/lib/constants'
import { formatDate } from '@/lib/format'

const PLATFORM_OPTIONS = [
  { value: 'x86_64-linux-musl', labelKey: 'agents.platformLinuxAmd64' },
  { value: 'aarch64-linux-musl', labelKey: 'agents.platformLinuxArm64' },
  { value: 'x86_64-macos', labelKey: 'agents.platformDarwinAmd64' },
  { value: 'aarch64-macos', labelKey: 'agents.platformDarwinArm64' },
  { value: 'x86_64-windows', labelKey: 'agents.platformWindowsAmd64' },
  { value: 'aarch64-windows', labelKey: 'agents.platformWindowsArm64' },
] as const

export default function AgentsPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { data, isLoading, error } = useAgents()
  const createAgent = useCreateAgent()
  const disableAgent = useDisableAgent()
  const updateAgent = useUpdateAgent()

  const [createOpen, setCreateOpen] = useState(false)
  const [disableUuid, setDisableUuid] = useState<string | null>(null)
  const [agentName, setAgentName] = useState('')
  const [continent, setContinent] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [isp, setIsp] = useState('')
  const [platform, setPlatform] = useState('')

  // Success dialog state
  const [successDialogOpen, setSuccessDialogOpen] = useState(false)
  const [createdAccessKey, setCreatedAccessKey] = useState('')
  const [createdInstallCommand, setCreatedInstallCommand] = useState('')
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedCmd, setCopiedCmd] = useState(false)

  const agents = (data ?? []) as AgentResponse[]
  const disableTarget = disableUuid ? agents.find((a) => a.agent_uuid === disableUuid) : null

  const handleToggle = () => {
    if (!disableUuid || !disableTarget) return
    if (disableTarget.status === 'disabled') {
      updateAgent.mutate(
        { uuid: disableUuid, data: { status: 'offline' } },
        { onSuccess: () => setDisableUuid(null) },
      )
    } else {
      disableAgent.mutate(disableUuid, {
        onSuccess: () => setDisableUuid(null),
      })
    }
  }

  const resetForm = () => {
    setAgentName('')
    setContinent('')
    setCountry('')
    setCity('')
    setIsp('')
    setPlatform('')
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const tags = [
      `continent:${continent}`,
      `country:${country}`,
      `city:${city}`,
      `isp:${isp}`,
    ]
    createAgent.mutate(
      { agent_name: agentName, tags, platform: platform || null },
      {
        onSuccess: (result) => {
          setCreateOpen(false)
          resetForm()
          const res = result as { access_key?: string; install_command?: string } | undefined
          if (res?.access_key) {
            setCreatedAccessKey(res.access_key)
            setCreatedInstallCommand(res.install_command ?? '')
            setSuccessDialogOpen(true)
          }
        },
      },
    )
  }

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(createdAccessKey)
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 2000)
    } catch { /* clipboard not available */ }
  }

  const handleCopyCmd = async () => {
    try {
      await navigator.clipboard.writeText(createdInstallCommand)
      setCopiedCmd(true)
      setTimeout(() => setCopiedCmd(false), 2000)
    } catch { /* clipboard not available */ }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{t('agents.title')}</h1>
        <Button
          className="bg-emerald-500/90 hover:bg-emerald-400 text-gray-950 border-none"
          onClick={() => setCreateOpen(true)}
        >
          {t('agents.createAgent')}
        </Button>
      </div>

      <div className="glass-light rounded-xl p-1">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-400 text-sm">{t('agents.failedToLoad')}</p>
          </div>
        ) : agents.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-text-muted text-sm">{t('agents.noAgents')}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('common.name')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('agents.tags')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('common.status')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('common.createdAt')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow
                  key={agent.agent_uuid}
                  className="border-white/5 cursor-pointer hover:bg-white/5"
                  onClick={() => navigate(`/agents/${agent.agent_uuid}`)}
                >
                  <TableCell className="text-text-primary font-medium">{agent.agent_name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {agent.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-text-secondary border border-white/10"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`border text-xs ${AGENT_STATUS_COLORS[agent.status] ?? AGENT_STATUS_COLORS.offline}`}
                    >
                      {agent.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-text-secondary text-sm font-[family-name:var(--font-mono)]">
                    {formatDate(agent.created_at, i18n.language)}
                  </TableCell>
                  <TableCell>
                    {agent.status === 'disabled' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setDisableUuid(agent.agent_uuid) }}
                        className="text-green-400 hover:text-green-300 hover:bg-green-500/10 text-xs h-7 px-2"
                      >
                        {t('agents.enableAgent')}
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setDisableUuid(agent.agent_uuid) }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs h-7 px-2"
                      >
                        {t('agents.disableAgent')}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create Agent Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('agents.dialogTitle')}</DialogTitle>
            <DialogDescription>{t('agents.dialogDesc')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div>
              <Label className="text-xs text-text-secondary mb-1.5">{t('agents.agentName')}</Label>
              <Input
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder={t('agents.agentNamePlaceholder')}
                required
              />
            </div>
            <GeoCascader
              continent={continent}
              country={country}
              city={city}
              onChange={({ continent: c, country: co, city: ci }) => {
                setContinent(c)
                setCountry(co)
                setCity(ci)
              }}
            />
            <div>
              <Label className="text-xs text-text-secondary mb-1.5">{t('agents.isp')}</Label>
              <Input
                value={isp}
                onChange={(e) => setIsp(e.target.value)}
                placeholder={t('agents.ispPlaceholder')}
                required
              />
            </div>
            <div>
              <Label className="text-xs text-text-secondary mb-1.5">{t('agents.platform')}</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v ?? '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('agents.selectPlatform')}>
                    {(value: string | null) => {
                      if (!value) return t('agents.selectPlatform')
                      const opt = PLATFORM_OPTIONS.find((o) => o.value === value)
                      return opt ? t(opt.labelKey) : value
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PLATFORM_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {t(opt.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={createAgent.isPending}
                className="bg-emerald-500/90 hover:bg-emerald-400 text-gray-950 border-none"
              >
                {createAgent.isPending ? t('common.creating') : t('agents.createAgent')}
              </Button>
            </DialogFooter>
            {createAgent.isError && (
              <p className="text-red-400 text-xs mt-2">{t('agents.createFailed')}</p>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* Agent Created Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-lg" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t('agents.createdTitle')}</DialogTitle>
            <DialogDescription>{t('agents.createdDesc')}</DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            {/* Access Key */}
            <div>
              <Label className="text-xs text-text-secondary mb-1.5">{t('agents.accessKey')}</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-emerald-400 text-sm font-mono break-all">
                  {createdAccessKey}
                </code>
                <Button variant="outline" size="sm" onClick={handleCopyKey} className="shrink-0">
                  {copiedKey ? t('common.copied') : t('common.copy')}
                </Button>
              </div>
            </div>

            {/* Install Command */}
            {createdInstallCommand && (
              <div>
                <Label className="text-xs text-text-secondary mb-1.5">{t('agents.installCommand')}</Label>
                <p className="text-[10px] text-text-dim mb-1.5">{t('agents.installCommandHint')}</p>
                <div className="flex items-start gap-2">
                  <code className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-cyan-400 text-xs font-mono break-all max-h-[120px] overflow-y-auto">
                    {createdInstallCommand}
                  </code>
                  <Button variant="outline" size="sm" onClick={handleCopyCmd} className="shrink-0 mt-0.5">
                    {copiedCmd ? t('common.copied') : t('common.copy')}
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setSuccessDialogOpen(false)}
              className="bg-emerald-500/90 hover:bg-emerald-400 text-gray-950 border-none"
            >
              {t('common.done')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable/Enable Agent Confirmation Dialog */}
      <Dialog open={disableUuid !== null} onOpenChange={(open) => { if (!open) setDisableUuid(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {disableTarget?.status === 'disabled' ? t('agents.enableAgent') : t('agents.disableAgent')}
            </DialogTitle>
            <DialogDescription>
              {disableTarget?.status === 'disabled'
                ? t('agents.enableAgentConfirm', { name: disableTarget?.agent_name ?? '' })
                : t('agents.disableAgentConfirm', { name: disableTarget?.agent_name ?? '' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisableUuid(null)}>
              {t('common.cancel')}
            </Button>
            {disableTarget?.status === 'disabled' ? (
              <Button
                onClick={handleToggle}
                disabled={updateAgent.isPending}
                className="bg-emerald-500/90 hover:bg-emerald-400 text-gray-950 border-none"
              >
                {updateAgent.isPending ? t('common.loading') : t('agents.enableAgent')}
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={handleToggle}
                disabled={disableAgent.isPending}
              >
                {disableAgent.isPending ? t('common.disabling') : t('agents.disableAgent')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
