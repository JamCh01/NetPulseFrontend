import { useState, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useReleases, useUploadRelease, useDeleteRelease, usePushUpdate } from '@/api/hooks/use-releases'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import type { ReleaseResponse, ReleaseListResponse } from '@/api/generated/types.gen'
import { PLATFORM_OPTIONS } from '@/lib/constants'
import { formatDateTime } from '@/lib/format'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ReleasesPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const [platformFilter, setPlatformFilter] = useState<string>('')
  const { data, isLoading, error } = useReleases(platformFilter || undefined)
  const releases = ((data as ReleaseListResponse)?.releases ?? []) as ReleaseResponse[]

  // Upload dialog
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadVersion, setUploadVersion] = useState('')
  const [uploadPlatform, setUploadPlatform] = useState('')
  const [uploadNotes, setUploadNotes] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadRelease = useUploadRelease()

  // Delete dialog
  const [deleteUuid, setDeleteUuid] = useState<string | null>(null)
  const deleteTarget = deleteUuid ? releases.find((r) => r.release_uuid === deleteUuid) : null
  const deleteRelease = useDeleteRelease()

  // Push dialog
  const [pushUuid, setPushUuid] = useState<string | null>(null)
  const pushTarget = pushUuid ? releases.find((r) => r.release_uuid === pushUuid) : null
  const pushUpdate = usePushUpdate()
  const [pushResult, setPushResult] = useState<number | null>(null)

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault()
    const file = fileInputRef.current?.files?.[0]
    if (!file || !uploadVersion || !uploadPlatform) return

    uploadRelease.mutate(
      {
        file,
        version: uploadVersion,
        platform: uploadPlatform,
        release_notes: uploadNotes.trim() || undefined,
      },
      {
        onSuccess: () => {
          setUploadOpen(false)
          setUploadVersion('')
          setUploadPlatform('')
          setUploadNotes('')
          if (fileInputRef.current) fileInputRef.current.value = ''
        },
      },
    )
  }

  const handleDelete = () => {
    if (!deleteUuid) return
    deleteRelease.mutate(deleteUuid, { onSuccess: () => setDeleteUuid(null) })
  }

  const handlePush = () => {
    if (!pushUuid) return
    pushUpdate.mutate(pushUuid, {
      onSuccess: (result) => {
        const res = result as { pushed?: number }
        setPushResult(res?.pushed ?? 0)
      },
    })
  }

  const getPlatformLabel = (platform: string): string => {
    const opt = PLATFORM_OPTIONS.find((p) => p.value === platform)
    return opt ? t(opt.labelKey) : platform
  }

  const handleCopySha = async (sha: string) => {
    try {
      await navigator.clipboard.writeText(sha)
    } catch { /* clipboard not available */ }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/agents')}
            className="text-text-muted hover:text-text-primary transition-colors text-sm"
          >
            {t('agents.title')} /
          </button>
          <h1 className="text-2xl font-bold text-text-primary">{t('agents.releases')}</h1>
        </div>
        <Button
          
          onClick={() => setUploadOpen(true)}
        >
          {t('agents.uploadRelease')}
        </Button>
      </div>

      {/* Platform filter */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-text-muted">{t('agents.platform')}:</span>
        <Select
          value={platformFilter}
          onValueChange={(val) => setPlatformFilter(val === '__all__' ? '' : (val ?? ''))}
        >
          <SelectTrigger className="w-48">
            <SelectValue>
              {(value: string | null) =>
                value && value !== '__all__' ? getPlatformLabel(value) : t('agents.allPlatforms')
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t('agents.allPlatforms')}</SelectItem>
            {PLATFORM_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Release list */}
      <div className="glass-light rounded-xl p-1">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-400 text-sm">{t('agents.failedToLoad')}</p>
          </div>
        ) : releases.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-text-muted text-sm">{t('agents.noReleases')}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('agents.versionLabel')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('agents.platform')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('agents.filename')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('agents.fileSize')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('agents.sha256')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('agents.releaseNotes')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('common.createdAt')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {releases.map((release) => (
                <TableRow key={release.release_uuid} className="border-white/5 hover:bg-white/5">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-text-primary font-medium font-mono text-sm">v{release.version}</span>
                      {release.is_latest && (
                        <Badge className="border text-[9px] bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                          {t('agents.latest')}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-text-secondary text-xs">{getPlatformLabel(release.platform)}</TableCell>
                  <TableCell className="text-text-secondary text-xs font-mono max-w-[200px] truncate">{release.filename}</TableCell>
                  <TableCell className="text-text-secondary text-xs font-mono">{formatFileSize(release.file_size)}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleCopySha(release.sha256)}
                      className="text-text-dim text-[10px] font-mono hover:text-text-secondary transition-colors cursor-pointer"
                      title={release.sha256}
                    >
                      {release.sha256.slice(0, 12)}...
                    </button>
                  </TableCell>
                  <TableCell className="text-text-secondary text-xs max-w-[160px] truncate">
                    {release.release_notes ?? '-'}
                  </TableCell>
                  <TableCell className="text-text-secondary text-xs font-mono">
                    {formatDateTime(release.created_at, i18n.language)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                        onClick={() => { setPushResult(null); setPushUuid(release.release_uuid) }}
                      >
                        {t('agents.pushUpdate')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => setDeleteUuid(release.release_uuid)}
                      >
                        {t('common.delete')}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('agents.uploadRelease')}</DialogTitle>
            <DialogDescription>{t('agents.uploadReleaseDesc')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4 mt-2">
            <div>
              <Label className="text-xs text-text-secondary mb-1.5">{t('agents.file')}</Label>
              <input
                ref={fileInputRef}
                type="file"
                required
                className="w-full text-sm text-text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-white/10 file:text-text-primary hover:file:bg-white/15 file:cursor-pointer"
              />
            </div>
            <div>
              <Label className="text-xs text-text-secondary mb-1.5">{t('agents.versionLabel')}</Label>
              <Input
                value={uploadVersion}
                onChange={(e) => setUploadVersion(e.target.value)}
                placeholder={t('agents.versionPlaceholder')}
                required
              />
            </div>
            <div>
              <Label className="text-xs text-text-secondary mb-1.5">{t('agents.platform')}</Label>
              <Select value={uploadPlatform} onValueChange={(val) => setUploadPlatform(val ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder={t('agents.selectPlatform')}>
                    {(value: string | null) => value ? getPlatformLabel(value) : t('agents.selectPlatform')}
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
            <div>
              <Label className="text-xs text-text-secondary mb-1.5">{t('agents.releaseNotes')}</Label>
              <Textarea
                value={uploadNotes}
                onChange={(e) => setUploadNotes(e.target.value)}
                placeholder={t('agents.releaseNotesPlaceholder')}
                className="text-xs min-h-[80px]"
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={uploadRelease.isPending}
                
              >
                {uploadRelease.isPending ? t('common.creating') : t('agents.uploadRelease')}
              </Button>
            </DialogFooter>
            {uploadRelease.isError && (
              <p className="text-red-400 text-xs">{t('agents.uploadFailed')}</p>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteUuid !== null} onOpenChange={(open) => { if (!open) setDeleteUuid(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('agents.deleteRelease')}</DialogTitle>
            <DialogDescription>
              {t('agents.deleteReleaseConfirm', {
                version: deleteTarget?.version ?? '',
                platform: deleteTarget ? getPlatformLabel(deleteTarget.platform) : '',
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUuid(null)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteRelease.isPending}>
              {deleteRelease.isPending ? t('common.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
          {deleteRelease.isError && (
            <p className="text-red-400 text-xs">{t('agents.deleteFailed')}</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Push Confirmation */}
      <Dialog open={pushUuid !== null} onOpenChange={(open) => { if (!open) { setPushUuid(null); setPushResult(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('agents.pushUpdate')}</DialogTitle>
            <DialogDescription>
              {pushResult === null
                ? t('agents.pushConfirm', {
                    version: pushTarget?.version ?? '',
                    platform: pushTarget ? getPlatformLabel(pushTarget.platform) : '',
                  })
                : t('agents.pushSuccess', { count: pushResult })
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {pushResult === null ? (
              <>
                <Button variant="outline" onClick={() => setPushUuid(null)}>{t('common.cancel')}</Button>
                <Button
                  onClick={handlePush}
                  disabled={pushUpdate.isPending}
                  
                >
                  {pushUpdate.isPending ? t('common.loading') : t('agents.pushUpdate')}
                </Button>
              </>
            ) : (
              <Button onClick={() => { setPushUuid(null); setPushResult(null) }}>
                {t('common.done')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
