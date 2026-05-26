import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Download, Pencil, Plus, Trash2, Upload } from 'lucide-react'

import {
  useAgentArtifacts,
  useDeleteAgentArtifact,
  useDownloadAgentArtifact,
  useUpdateAgentArtifact,
  useUploadAgentArtifact,
} from '@/api/hooks/use-agent-artifacts'
import type { AgentArtifactResponse } from '@/api/generated/types.gen'
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

const OS_OPTIONS = ['linux', 'darwin', 'windows']
const ARCH_OPTIONS = ['x86_64', 'aarch64', 'arm64', 'amd64']

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function shortSha(sha: string): string {
  return `${sha.slice(0, 12)}...${sha.slice(-6)}`
}

function artifactPlatform(artifact: AgentArtifactResponse): string {
  return `${artifact.os} / ${artifact.arch}`
}

export default function ReleasesPage() {
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
          arch: editing.arch,
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
          <p className="mt-1 text-sm text-text-muted">管理 Agent 可执行文件版本、平台元数据和 Cloudflare R2 下载入口。</p>
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="w-4 h-4" />
          上传 Artifact
        </Button>
      </div>

      <section className="glass-light rounded-lg border border-border/60 p-4">
        <div className="grid gap-3 md:grid-cols-[160px_160px_1fr_160px]">
          <div>
            <Label htmlFor="artifact-os-filter" className="mb-1.5 text-xs text-text-muted">OS</Label>
            <Select value={osFilter || '__all__'} onValueChange={(value) => setOsFilter(value === '__all__' ? '' : (value ?? ''))}>
              <SelectTrigger id="artifact-os-filter" aria-label="OS" className="w-full bg-background/95">
                <SelectValue>{(value: string | null) => value === '__all__' || !value ? '全部 OS' : value}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">全部 OS</SelectItem>
                {OS_OPTIONS.map((os) => <SelectItem key={os} value={os}>{os}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="artifact-arch-filter" className="mb-1.5 text-xs text-text-muted">Arch</Label>
            <Select value={archFilter || '__all__'} onValueChange={(value) => setArchFilter(value === '__all__' ? '' : (value ?? ''))}>
              <SelectTrigger id="artifact-arch-filter" aria-label="Arch" className="w-full bg-background/95">
                <SelectValue>{(value: string | null) => value === '__all__' || !value ? '全部 Arch' : value}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">全部 Arch</SelectItem>
                {ARCH_OPTIONS.map((arch) => <SelectItem key={arch} value={arch}>{arch}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="artifact-version-filter" className="mb-1.5 text-xs text-text-muted">Version</Label>
            <Input
              id="artifact-version-filter"
              value={versionFilter}
              onChange={(event) => setVersionFilter(event.target.value)}
              placeholder="例如 1.2.3"
              className="bg-background/95"
            />
          </div>
          <div>
            <Label htmlFor="artifact-active-filter" className="mb-1.5 text-xs text-text-muted">状态</Label>
            <Select value={activeFilter} onValueChange={(value) => setActiveFilter((value as typeof activeFilter) ?? 'all')}>
              <SelectTrigger id="artifact-active-filter" aria-label="状态" className="w-full bg-background/95">
                <SelectValue>{(value: string | null) => value === 'active' ? '启用' : value === 'inactive' ? '停用' : '全部'}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="active">启用</SelectItem>
                <SelectItem value="inactive">停用</SelectItem>
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
          <div className="p-8 text-center text-sm text-red-400">Artifact 列表加载失败。</div>
        ) : artifacts.length === 0 ? (
          <div className="p-8 text-center text-sm text-text-muted">暂无 Agent Artifact。</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>版本</TableHead>
                <TableHead>平台</TableHead>
                <TableHead>文件</TableHead>
                <TableHead>大小</TableHead>
                <TableHead>SHA256</TableHead>
                <TableHead>存储</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
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
                      {artifact.is_active ? '启用' : '停用'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-text-secondary">{formatDateTime(artifact.created_at, 'zh')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-sm" aria-label="下载" onClick={() => handleDownload(artifact)}>
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label="编辑" onClick={() => setEditing(artifact)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label="删除" className="text-red-400" onClick={() => setDeleteTarget(artifact)}>
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

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>上传 Agent Artifact</DialogTitle>
            <DialogDescription>选择 Agent 可执行文件并填写版本与平台信息，后端会上传到 Cloudflare R2。</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <Label htmlFor="artifact-file" className="mb-1.5 text-xs text-text-muted">文件</Label>
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
                <Label htmlFor="artifact-upload-version" className="mb-1.5 text-xs text-text-muted">版本</Label>
                <Input id="artifact-upload-version" value={uploadVersion} onChange={(event) => setUploadVersion(event.target.value)} required />
              </div>
              <div>
                <Label htmlFor="artifact-upload-os" className="mb-1.5 text-xs text-text-muted">OS</Label>
                <Select value={uploadOs} onValueChange={(value) => setUploadOs(value ?? 'linux')}>
                  <SelectTrigger id="artifact-upload-os" aria-label="上传 OS" className="w-full bg-background/95">
                    <SelectValue>{(value: string | null) => value ?? 'linux'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>{OS_OPTIONS.map((os) => <SelectItem key={os} value={os}>{os}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="artifact-upload-arch" className="mb-1.5 text-xs text-text-muted">Arch</Label>
                <Select value={uploadArch} onValueChange={(value) => setUploadArch(value ?? 'x86_64')}>
                  <SelectTrigger id="artifact-upload-arch" aria-label="上传 Arch" className="w-full bg-background/95">
                    <SelectValue>{(value: string | null) => value ?? 'x86_64'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>{ARCH_OPTIONS.map((arch) => <SelectItem key={arch} value={arch}>{arch}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/70 p-3">
              <div>
                <div className="text-sm font-medium text-text-primary">启用版本</div>
                <div className="text-xs text-text-muted">启用后会出现在默认下载候选列表中。</div>
              </div>
              <ToggleSwitch aria-label="启用版本" checked={uploadActive} onChange={setUploadActive} />
            </div>
            <div>
              <Label htmlFor="artifact-upload-comment" className="mb-1.5 text-xs text-text-muted">备注</Label>
              <Textarea id="artifact-upload-comment" value={uploadComment} onChange={(event) => setUploadComment(event.target.value)} rows={3} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={uploadArtifact.isPending}>
                <Plus className="w-4 h-4" />
                {uploadArtifact.isPending ? '上传中' : '上传'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editing !== null} onOpenChange={(open) => { if (!open) setEditing(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑 Artifact</DialogTitle>
            <DialogDescription>只修改元数据，不会变更 Cloudflare R2 中的文件本体。</DialogDescription>
          </DialogHeader>
          {editing && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label htmlFor="artifact-edit-version" className="mb-1.5 text-xs text-text-muted">版本</Label>
                  <Input id="artifact-edit-version" value={editing.version} onChange={(event) => setEditing({ ...editing, version: event.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="artifact-edit-os" className="mb-1.5 text-xs text-text-muted">OS</Label>
                  <Input id="artifact-edit-os" value={editing.os} onChange={(event) => setEditing({ ...editing, os: event.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="artifact-edit-arch" className="mb-1.5 text-xs text-text-muted">Arch</Label>
                  <Input id="artifact-edit-arch" value={editing.arch} onChange={(event) => setEditing({ ...editing, arch: event.target.value })} required />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/70 p-3">
                <div>
                  <div className="text-sm font-medium text-text-primary">启用状态</div>
                  <div className="text-xs text-text-muted">停用后保留记录但不作为可用版本展示。</div>
                </div>
                <ToggleSwitch aria-label="启用状态" checked={editing.is_active} onChange={(checked) => setEditing({ ...editing, is_active: checked })} />
              </div>
              <div>
                <Label htmlFor="artifact-edit-comment" className="mb-1.5 text-xs text-text-muted">备注</Label>
                <Textarea id="artifact-edit-comment" value={editing.comment ?? ''} onChange={(event) => setEditing({ ...editing, comment: event.target.value })} rows={3} />
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setEditing(null)}>取消</Button>
                <Button type="submit" disabled={updateArtifact.isPending}>{updateArtifact.isPending ? '保存中' : '保存'}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除 Artifact</DialogTitle>
            <DialogDescription>
              确认删除 {deleteTarget?.version} ({deleteTarget ? artifactPlatform(deleteTarget) : ''})？该操作会软删除记录并尝试删除 R2 对象。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteArtifact.isPending}>
              {deleteArtifact.isPending ? '删除中' : '删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
