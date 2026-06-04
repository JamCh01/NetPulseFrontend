import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Download, Pencil, Plus, Send, Trash2, Upload } from 'lucide-react'

import {
  useAgentArtifacts,
  useDeleteAgentArtifact,
  useDownloadAgentArtifact,
  useUpdateAgentArtifact,
  useUploadAgentArtifact,
} from '@/api/hooks/use-agent-artifacts'
import {
  useAgentUpdateAssignments,
  useAgentUpdatePolicies,
  useCreateAgentUpdatePolicy,
  useDispatchAgentUpdatePolicy,
} from '@/api/hooks/use-agent-updates'
import type { AgentArtifactResponse, AgentUpdateAssignment, AgentUpdatePolicy } from '@/api/generated/types.gen'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import { formatDateTime } from '@/lib/format'

const OS_OPTIONS = [
  { value: 'linux', label: 'Linux' },
  { value: 'darwin', label: 'macOS' },
  { value: 'windows', label: 'Windows' },
] as const

const ARCH_OPTIONS = [
  { value: 'x86_64', label: 'x86_64 (AMD64)' },
  { value: 'aarch64', label: 'aarch64 (ARM64)' },
] as const

const ARCH_ALIASES: Record<string, string> = {
  amd64: 'x86_64',
  x64: 'x86_64',
  arm64: 'aarch64',
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function shortSha(sha: string): string {
  return `${sha.slice(0, 12)}...${sha.slice(-6)}`
}

function normalizeArch(arch: string | null | undefined): string {
  const normalized = arch?.trim().toLowerCase()
  if (!normalized) return 'x86_64'
  return ARCH_ALIASES[normalized] ?? normalized
}

function osLabel(os: string | null | undefined, placeholder = 'Select OS'): string {
  if (!os) return placeholder
  return OS_OPTIONS.find((option) => option.value === os.toLowerCase())?.label ?? os
}

function archLabel(arch: string | null | undefined, placeholder = 'Select Arch'): string {
  if (!arch) return placeholder
  const canonical = normalizeArch(arch)
  return ARCH_OPTIONS.find((option) => option.value === canonical)?.label ?? arch
}

function artifactPlatform(artifact: AgentArtifactResponse): string {
  return `${osLabel(artifact.os)} / ${archLabel(artifact.arch)}`
}

function updateStateClass(state: string | null | undefined): string {
  if (state === 'installed') return 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
  if (state === 'failed' || state === 'rolled_back') return 'border border-red-500/30 bg-red-500/15 text-red-300'
  if (state === 'cancelled') return 'border border-border bg-muted text-text-muted'
  return 'border border-cyan-500/30 bg-cyan-500/15 text-cyan-300'
}

function assignmentToVersion(assignment: AgentUpdateAssignment): string {
  const legacy = assignment as AgentUpdateAssignment & { target_version?: string }
  return assignment.to_version ?? legacy.target_version ?? '-'
}

export default function ReleasesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [osFilter, setOsFilter] = useState('linux')
  const [archFilter, setArchFilter] = useState('')
  const [versionFilter, setVersionFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const queryFilters = useMemo(() => ({
    os: osFilter || undefined,
    arch: archFilter || undefined,
    version: versionFilter || undefined,
    is_active: activeFilter === 'all' ? undefined : activeFilter === 'active',
  }), [activeFilter, archFilter, osFilter, versionFilter])

  const { data, isLoading, error } = useAgentArtifacts(queryFilters)
  const artifacts = (data?.data.items ?? []) as AgentArtifactResponse[]
  const artifactsByUuid = useMemo(
    () => new Map(artifacts.map((artifact) => [artifact.artifact_uuid, artifact])),
    [artifacts],
  )

  const updatePoliciesQuery = useAgentUpdatePolicies()
  const updateAssignmentsQuery = useAgentUpdateAssignments()
  const updatePolicies = (updatePoliciesQuery.data?.data.items ?? []) as AgentUpdatePolicy[]
  const updateAssignments = (updateAssignmentsQuery.data?.data.items ?? []) as AgentUpdateAssignment[]

  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadVersion, setUploadVersion] = useState('')
  const [uploadOs, setUploadOs] = useState('linux')
  const [uploadArch, setUploadArch] = useState('x86_64')
  const [uploadActive, setUploadActive] = useState(true)
  const [uploadComment, setUploadComment] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadArtifact = useUploadAgentArtifact()

  const [editing, setEditing] = useState<AgentArtifactResponse | null>(null)
  const updateArtifact = useUpdateAgentArtifact()

  const [policyOpen, setPolicyOpen] = useState(false)
  const [policyName, setPolicyName] = useState('')
  const [policyArtifactUuid, setPolicyArtifactUuid] = useState('')
  const createUpdatePolicy = useCreateAgentUpdatePolicy()
  const dispatchUpdatePolicy = useDispatchAgentUpdatePolicy()

  const [deleteTarget, setDeleteTarget] = useState<AgentArtifactResponse | null>(null)
  const deleteArtifact = useDeleteAgentArtifact()
  const downloadArtifact = useDownloadAgentArtifact()

  const handleUpload = (event: React.FormEvent) => {
    event.preventDefault()
    const file = fileInputRef.current?.files?.[0]
    if (!file || !uploadVersion.trim()) return

    uploadArtifact.mutate(
      {
        file,
        version: uploadVersion.trim(),
        os: uploadOs,
        arch: uploadArch,
        is_active: uploadActive,
        comment: uploadComment.trim() || undefined,
      },
      {
        onSuccess: () => {
          setUploadOpen(false)
          setUploadVersion('')
          setUploadOs('linux')
          setUploadArch('x86_64')
          setUploadActive(true)
          setUploadComment('')
          if (fileInputRef.current) fileInputRef.current.value = ''
        },
      },
    )
  }

  const handleUpdate = (event: React.FormEvent) => {
    event.preventDefault()
    if (!editing) return
    updateArtifact.mutate(
      {
        artifactUuid: editing.artifact_uuid,
        body: {
          version: editing.version,
          os: editing.os,
          arch: normalizeArch(editing.arch),
          is_active: editing.is_active,
          comment: editing.comment ?? null,
        },
      },
      {
        onSuccess: () => setEditing(null),
      },
    )
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteArtifact.mutate(deleteTarget.artifact_uuid, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  const handleDownload = (artifact: AgentArtifactResponse) => {
    downloadArtifact.mutate(artifact.artifact_uuid, {
      onSuccess: (response) => {
        const data = response as { data?: { download_url?: string } } | undefined
        const url = data?.data?.download_url
        if (url) window.open(url, '_blank', 'noopener,noreferrer')
      },
    })
  }

  const openCreatePolicy = (artifact?: AgentArtifactResponse) => {
    const target = artifact ?? artifacts.find((item) => item.is_active) ?? artifacts[0]
    setPolicyArtifactUuid(target?.artifact_uuid ?? '')
    setPolicyName(target ? `${target.os} ${target.arch} ${target.version}` : '')
    setPolicyOpen(true)
  }

  const handleCreatePolicy = (event: React.FormEvent) => {
    event.preventDefault()
    const artifact = artifactsByUuid.get(policyArtifactUuid)
    if (!artifact || !policyName.trim()) return
    createUpdatePolicy.mutate(
      {
        name: policyName.trim(),
        artifact_uuid: artifact.artifact_uuid,
        os: artifact.os,
        arch: normalizeArch(artifact.arch),
        rollout_mode: 'manual',
        is_enabled: true,
        install_method_preference: ['systemd'],
      },
      {
        onSuccess: () => {
          setPolicyOpen(false)
          setPolicyName('')
          setPolicyArtifactUuid('')
        },
      },
    )
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <button
            onClick={() => navigate('/agents')}
            className="text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            Agents /
          </button>
          <h1 className="text-2xl font-semibold text-text-primary">Agent Artifacts</h1>
          <p className="mt-1 text-sm text-text-muted">{t('artifacts.description')}</p>
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="w-4 h-4" />
          {t('artifacts.uploadArtifact')}
        </Button>
      </div>

      <section className="glass-light rounded-lg border border-border/60 p-4">
        <div className="grid gap-3 md:grid-cols-[160px_160px_1fr_160px]">
          <div>
            <Label htmlFor="artifact-os-filter" className="mb-1.5 text-xs text-text-muted">OS</Label>
            <Select value={osFilter || '__all__'} onValueChange={(value) => setOsFilter(value === '__all__' ? '' : (value ?? ''))}>
              <SelectTrigger id="artifact-os-filter" aria-label="OS" className="w-full bg-background/95">
                <SelectValue>{(value: string | null) => value === '__all__' || !value ? t('artifacts.allOs') : osLabel(value, t('artifacts.osPlaceholder'))}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t('artifacts.allOs')}</SelectItem>
                {OS_OPTIONS.map((os) => <SelectItem key={os.value} value={os.value}>{os.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="artifact-arch-filter" className="mb-1.5 text-xs text-text-muted">Arch</Label>
            <Select value={archFilter || '__all__'} onValueChange={(value) => setArchFilter(value === '__all__' ? '' : (value ?? ''))}>
              <SelectTrigger id="artifact-arch-filter" aria-label="Arch" className="w-full bg-background/95">
                <SelectValue>{(value: string | null) => value === '__all__' || !value ? t('artifacts.allArch') : archLabel(value, t('artifacts.archPlaceholder'))}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t('artifacts.allArch')}</SelectItem>
                {ARCH_OPTIONS.map((arch) => <SelectItem key={arch.value} value={arch.value}>{arch.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="artifact-version-filter" className="mb-1.5 text-xs text-text-muted">Version</Label>
            <Input
              id="artifact-version-filter"
              value={versionFilter}
              onChange={(event) => setVersionFilter(event.target.value)}
              placeholder={t('artifacts.versionPlaceholder')}
              className="bg-background/95"
            />
          </div>
          <div>
            <Label htmlFor="artifact-active-filter" className="mb-1.5 text-xs text-text-muted">{t('common.status')}</Label>
            <Select value={activeFilter} onValueChange={(value) => setActiveFilter((value as typeof activeFilter) ?? 'all')}>
              <SelectTrigger id="artifact-active-filter" aria-label={t('common.status')} className="w-full bg-background/95">
                <SelectValue>{(value: string | null) => value === 'active' ? t('common.enabled') : value === 'inactive' ? t('common.stopped') : t('common.all')}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="active">{t('common.enabled')}</SelectItem>
                <SelectItem value="inactive">{t('common.stopped')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="glass-light rounded-lg border border-border/60 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-400">{t('artifacts.loadFailed')}</div>
        ) : artifacts.length === 0 ? (
          <div className="p-8 text-center text-sm text-text-muted">{t('artifacts.empty')}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.version')}</TableHead>
                <TableHead>{t('common.platform')}</TableHead>
                <TableHead>{t('common.file')}</TableHead>
                <TableHead>{t('common.size')}</TableHead>
                <TableHead>SHA256</TableHead>
                <TableHead>{t('common.storage')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('common.createdAt')}</TableHead>
                <TableHead>{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {artifacts.map((artifact) => (
                <TableRow key={artifact.artifact_uuid}>
                  <TableCell className="font-mono text-sm text-text-primary">{artifact.version}</TableCell>
                  <TableCell className="text-sm text-text-secondary">{artifactPlatform(artifact)}</TableCell>
                  <TableCell>
                    <div className="max-w-[220px] truncate text-sm text-text-secondary" title={artifact.filename}>
                      {artifact.filename}
                    </div>
                    {artifact.comment && <div className="max-w-[220px] truncate text-xs text-text-muted">{artifact.comment}</div>}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-text-secondary">{formatFileSize(artifact.size_bytes)}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => navigator.clipboard?.writeText(artifact.sha256)}
                      className="font-mono text-xs text-text-muted hover:text-text-primary"
                      title={artifact.sha256}
                    >
                      {shortSha(artifact.sha256)}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-text-secondary">{artifact.storage_provider}</div>
                    <div className="max-w-[180px] truncate text-xs text-text-muted" title={artifact.storage_bucket}>{artifact.storage_bucket}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={artifact.is_active ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300' : 'border border-border bg-muted text-text-muted'}>
                      {artifact.is_active ? t('common.enabled') : t('common.stopped')}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-text-secondary">{formatDateTime(artifact.created_at, 'zh')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-sm" aria-label={t('common.downloading')} onClick={() => handleDownload(artifact)}>
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label={t('common.edit')} onClick={() => setEditing(artifact)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label={t('common.delete')} className="text-red-400" onClick={() => setDeleteTarget(artifact)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section className="glass-light rounded-lg border border-border/60 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Agent Update Policies</h2>
            <p className="mt-1 text-sm text-text-muted">Bind uploaded artifacts to manual upgrade dispatch and track Agent assignment progress.</p>
          </div>
          <Button variant="outline" onClick={() => openCreatePolicy()} disabled={artifacts.length === 0}>
            <Plus className="w-4 h-4" />
            New Policy
          </Button>
        </div>
        {updatePoliciesQuery.isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 2 }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)}
          </div>
        ) : updatePoliciesQuery.error ? (
          <div className="p-8 text-center text-sm text-red-400">Agent update policies failed to load.</div>
        ) : updatePolicies.length === 0 ? (
          <div className="p-8 text-center text-sm text-text-muted">No Agent update policies.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>{t('common.version')}</TableHead>
                <TableHead>{t('common.platform')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {updatePolicies.map((policy) => {
                const artifact = artifactsByUuid.get(policy.artifact_uuid)
                return (
                  <TableRow key={policy.policy_uuid ?? policy.name}>
                    <TableCell className="text-sm font-medium text-text-primary">{policy.name}</TableCell>
                    <TableCell className="font-mono text-sm text-text-secondary">{artifact?.version ?? policy.artifact_uuid}</TableCell>
                    <TableCell className="text-sm text-text-secondary">{artifact ? artifactPlatform(artifact) : `${policy.os} / ${normalizeArch(policy.arch)}`}</TableCell>
                    <TableCell>
                      <Badge className={policy.is_enabled ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300' : 'border border-border bg-muted text-text-muted'}>
                        {policy.is_enabled ? t('common.enabled') : t('common.stopped')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Dispatch ${policy.name}`}
                        disabled={!policy.policy_uuid || dispatchUpdatePolicy.isPending || policy.is_enabled === false}
                        onClick={() => policy.policy_uuid && dispatchUpdatePolicy.mutate(policy.policy_uuid)}
                      >
                        <Send className="w-4 h-4" />
                        Dispatch
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </section>

      <section className="glass-light rounded-lg border border-border/60 overflow-hidden">
        <div className="border-b border-border/60 p-4">
          <h2 className="text-lg font-semibold text-text-primary">Agent Update Assignments</h2>
          <p className="mt-1 text-sm text-text-muted">Latest per-Agent upgrade state reported by dispatch, worker, or Agent heartbeat.</p>
        </div>
        {updateAssignmentsQuery.isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 2 }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)}
          </div>
        ) : updateAssignmentsQuery.error ? (
          <div className="p-8 text-center text-sm text-red-400">Agent update assignments failed to load.</div>
        ) : updateAssignments.length === 0 ? (
          <div className="p-8 text-center text-sm text-text-muted">No Agent update assignments.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.uuid')}</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>{t('common.version')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('common.lastUpdated')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {updateAssignments.map((assignment) => (
                <TableRow key={assignment.assignment_uuid ?? `${assignment.policy_uuid}-${assignment.agent_uuid}`}>
                  <TableCell className="font-mono text-xs text-text-primary">{assignment.assignment_uuid ?? '-'}</TableCell>
                  <TableCell className="font-mono text-xs text-text-secondary">{assignment.agent_uuid}</TableCell>
                  <TableCell className="font-mono text-sm text-text-secondary">{assignmentToVersion(assignment)}</TableCell>
                  <TableCell>
                    <Badge className={updateStateClass(assignment.state)}>{assignment.state ?? 'pending'}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-text-secondary">
                    {assignment.updated_at ? formatDateTime(assignment.updated_at, 'zh') : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('artifacts.uploadTitle')}</DialogTitle>
            <DialogDescription>{t('artifacts.uploadDesc')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <Label htmlFor="artifact-file" className="mb-1.5 text-xs text-text-muted">{t('common.file')}</Label>
              <input
                ref={fileInputRef}
                id="artifact-file"
                type="file"
                required
                className="w-full rounded-lg border border-input bg-background/95 px-3 py-2 text-sm text-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-text-primary"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label htmlFor="artifact-upload-version" className="mb-1.5 text-xs text-text-muted">{t('common.version')}</Label>
                <Input id="artifact-upload-version" value={uploadVersion} onChange={(event) => setUploadVersion(event.target.value)} required />
              </div>
              <div>
                <Label htmlFor="artifact-upload-os" className="mb-1.5 text-xs text-text-muted">OS</Label>
                <Select value={uploadOs} onValueChange={(value) => setUploadOs(value ?? 'linux')}>
                  <SelectTrigger id="artifact-upload-os" aria-label={`${t('common.upload')} OS`} className="w-full bg-background/95">
                    <SelectValue>{(value: string | null) => osLabel(value, 'Linux')}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>{OS_OPTIONS.map((os) => <SelectItem key={os.value} value={os.value}>{os.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="artifact-upload-arch" className="mb-1.5 text-xs text-text-muted">Arch</Label>
                <Select value={uploadArch} onValueChange={(value) => setUploadArch(value ?? 'x86_64')}>
                  <SelectTrigger id="artifact-upload-arch" aria-label={`${t('common.upload')} Arch`} className="w-full bg-background/95">
                    <SelectValue>{(value: string | null) => archLabel(value, 'x86_64 (AMD64)')}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>{ARCH_OPTIONS.map((arch) => <SelectItem key={arch.value} value={arch.value}>{arch.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/70 p-3">
              <div>
                <div className="text-sm font-medium text-text-primary">{t('artifacts.activeVersion')}</div>
                <div className="text-xs text-text-muted">{t('artifacts.activeVersionDesc')}</div>
              </div>
              <ToggleSwitch aria-label={t('artifacts.activeVersion')} checked={uploadActive} onChange={setUploadActive} />
            </div>
            <div>
              <Label htmlFor="artifact-upload-comment" className="mb-1.5 text-xs text-text-muted">{t('common.comment')}</Label>
              <Textarea id="artifact-upload-comment" value={uploadComment} onChange={(event) => setUploadComment(event.target.value)} rows={3} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={uploadArtifact.isPending}>
                <Plus className="w-4 h-4" />
                {uploadArtifact.isPending ? t('artifacts.uploading') : t('common.upload')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editing !== null} onOpenChange={(open) => { if (!open) setEditing(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('artifacts.editTitle')}</DialogTitle>
            <DialogDescription>{t('artifacts.editDesc')}</DialogDescription>
          </DialogHeader>
          {editing && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label htmlFor="artifact-edit-version" className="mb-1.5 text-xs text-text-muted">{t('common.version')}</Label>
                  <Input id="artifact-edit-version" value={editing.version} onChange={(event) => setEditing({ ...editing, version: event.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="artifact-edit-os" className="mb-1.5 text-xs text-text-muted">OS</Label>
                  <Select value={editing.os} onValueChange={(value) => setEditing({ ...editing, os: value ?? 'linux' })}>
                    <SelectTrigger id="artifact-edit-os" aria-label={`${t('common.edit')} OS`} className="w-full bg-background/95">
                      <SelectValue>{(value: string | null) => osLabel(value)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>{OS_OPTIONS.map((os) => <SelectItem key={os.value} value={os.value}>{os.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="artifact-edit-arch" className="mb-1.5 text-xs text-text-muted">Arch</Label>
                  <Select value={normalizeArch(editing.arch)} onValueChange={(value) => setEditing({ ...editing, arch: value ?? 'x86_64' })}>
                    <SelectTrigger id="artifact-edit-arch" aria-label={`${t('common.edit')} Arch`} className="w-full bg-background/95">
                      <SelectValue>{(value: string | null) => archLabel(value)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>{ARCH_OPTIONS.map((arch) => <SelectItem key={arch.value} value={arch.value}>{arch.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/70 p-3">
                <div>
                  <div className="text-sm font-medium text-text-primary">{t('artifacts.activeStatus')}</div>
                  <div className="text-xs text-text-muted">{t('artifacts.activeStatusDesc')}</div>
                </div>
                <ToggleSwitch aria-label={t('artifacts.activeStatus')} checked={editing.is_active} onChange={(checked) => setEditing({ ...editing, is_active: checked })} />
              </div>
              <div>
                <Label htmlFor="artifact-edit-comment" className="mb-1.5 text-xs text-text-muted">{t('common.comment')}</Label>
                <Textarea id="artifact-edit-comment" value={editing.comment ?? ''} onChange={(event) => setEditing({ ...editing, comment: event.target.value })} rows={3} />
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={updateArtifact.isPending}>{updateArtifact.isPending ? t('common.saving') : t('common.save')}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={policyOpen} onOpenChange={setPolicyOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Agent Update Policy</DialogTitle>
            <DialogDescription>Create a manual policy from an uploaded Agent artifact, then dispatch it to matching Agents.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePolicy} className="space-y-4">
            <div>
              <Label htmlFor="agent-update-policy-name" className="mb-1.5 text-xs text-text-muted">{t('common.name')}</Label>
              <Input
                id="agent-update-policy-name"
                value={policyName}
                onChange={(event) => setPolicyName(event.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="agent-update-policy-artifact" className="mb-1.5 text-xs text-text-muted">Artifact</Label>
              <Select value={policyArtifactUuid} onValueChange={(value) => setPolicyArtifactUuid(value ?? '')}>
                <SelectTrigger id="agent-update-policy-artifact" aria-label="Artifact" className="w-full bg-background/95">
                  <SelectValue placeholder="Select Artifact">
                    {(value: string | null) => {
                      const artifact = value ? artifactsByUuid.get(value) : undefined
                      return artifact ? `${artifact.version} - ${artifactPlatform(artifact)}` : 'Select Artifact'
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {artifacts.map((artifact) => (
                    <SelectItem key={artifact.artifact_uuid} value={artifact.artifact_uuid}>
                      {artifact.version} - {artifactPlatform(artifact)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setPolicyOpen(false)}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={createUpdatePolicy.isPending || !policyArtifactUuid || !policyName.trim()}>
                {createUpdatePolicy.isPending ? t('common.creating') : t('common.create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('artifacts.deleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('artifacts.deleteDesc', {
                version: deleteTarget?.version,
                platform: deleteTarget ? artifactPlatform(deleteTarget) : '',
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteArtifact.isPending}>
              {deleteArtifact.isPending ? t('common.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
