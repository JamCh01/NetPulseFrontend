import { useMemo, useState } from 'react'
import { Save, Settings } from 'lucide-react'

import { useSystemSettings, useUpdateSystemSettings } from '@/api/hooks/use-settings'
import type { AppSettingsResponse, AppSettingsUpdate } from '@/api/generated/types.gen'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleSwitch } from '@/components/ui/toggle-switch'

type SettingsFormState = AppSettingsResponse & {
  artifact_r2_secret_access_key: string
}

interface FieldConfig {
  key: keyof SettingsFormState
  label: string
  description: string
  type: 'text' | 'number' | 'secret'
}

interface SwitchConfig {
  key: keyof SettingsFormState
  label: string
  description: string
}

interface SectionConfig {
  title: string
  description: string
  fields: FieldConfig[]
  switches?: SwitchConfig[]
}

const SECTIONS: SectionConfig[] = [
  {
    title: 'VictoriaMetrics',
    description: 'ICMP/TCP 时序指标的写入和查询地址。worker 使用写入地址，API 图表查询使用查询地址。',
    fields: [
      { key: 'victoriametrics_write_url', label: '写入地址', description: 'Prometheus import 写入 endpoint。', type: 'text' },
      { key: 'victoriametrics_query_url', label: '查询地址', description: 'VictoriaMetrics query endpoint。', type: 'text' },
    ],
  },
  {
    title: 'Result Worker',
    description: '控制 NATS 结果消费 worker 的拉取批量、等待时间和进程内并发。',
    fields: [
      { key: 'worker_fetch_batch_size', label: '拉取批量', description: '每次从 NATS 拉取的结果消息数量。', type: 'number' },
      { key: 'worker_fetch_timeout_sec', label: '拉取超时', description: '等待 NATS 返回消息的最长秒数。', type: 'number' },
      { key: 'worker_processing_concurrency', label: '处理并发数', description: '单个 worker 进程内并发处理消息的上限。', type: 'number' },
    ],
  },
  {
    title: 'Agent State Worker',
    description: '处理 Agent 心跳和任务配置 ACK 的 worker 参数。',
    fields: [
      { key: 'agent_state_worker_fetch_batch_size', label: '拉取批量', description: '每次拉取心跳或 ACK 消息的数量。', type: 'number' },
      { key: 'agent_state_worker_fetch_timeout_sec', label: '拉取超时', description: '等待 Agent 状态消息的最长秒数。', type: 'number' },
      { key: 'agent_offline_after_sec', label: '离线阈值', description: 'Agent 超过该秒数无心跳后标记为离线。', type: 'number' },
    ],
  },
  {
    title: 'Agent Status Worker',
    description: '周期扫描 Agent 状态，并可使用 PostgreSQL advisory lock 保证单实例执行。',
    fields: [
      { key: 'agent_status_sweep_interval_sec', label: '扫描间隔', description: 'Agent 状态扫描间隔，单位秒。', type: 'number' },
    ],
    switches: [
      { key: 'agent_status_singleton_lock_enabled', label: '启用单实例锁', description: '开启后多个 worker 中只有拿到 advisory lock 的实例执行扫描。' },
    ],
  },
  {
    title: 'ASN Enrichment Worker',
    description: '控制 MTR hop ASN 补全任务的调度频率、claim 批量和过期回收。',
    fields: [
      { key: 'asn_enrichment_sweep_interval_sec', label: '扫描间隔', description: 'ASN enrichment worker 扫描间隔，单位秒。', type: 'number' },
      { key: 'asn_enrichment_batch_size', label: 'Claim 批量', description: '每批 claim 的 MTR result 数量。', type: 'number' },
      { key: 'asn_enrichment_claim_stale_after_sec', label: 'Claim 过期秒数', description: 'claim 超过该时间可被其他 worker 回收。', type: 'number' },
    ],
    switches: [
      { key: 'asn_enrichment_singleton_lock_enabled', label: '启用单实例锁', description: '开启后 ASN enrichment 扫描强制单实例执行。' },
    ],
  },
  {
    title: 'Result Ingestion Events',
    description: '结果入库事件用于排查 NATS 消费和结果写入链路。',
    fields: [
      { key: 'result_ingestion_event_retention_days', label: '保留天数', description: '诊断事件保留天数。', type: 'number' },
    ],
  },
  {
    title: 'Cloudflare R2 Artifact Storage',
    description: 'Agent Artifact 上传、下载和预签名 URL 使用的 Cloudflare R2 配置。',
    fields: [
      { key: 'artifact_storage_provider', label: '存储提供方', description: '当前后端支持 cloudflare_r2。', type: 'text' },
      { key: 'artifact_r2_endpoint_url', label: 'R2 Endpoint', description: 'Cloudflare R2 S3 API endpoint URL。', type: 'text' },
      { key: 'artifact_r2_access_key_id', label: 'Access Key ID', description: 'Cloudflare R2 Access Key ID。', type: 'text' },
      { key: 'artifact_r2_secret_access_key', label: 'Secret Access Key', description: '不回显明文；留空保存时保持原密钥。', type: 'secret' },
      { key: 'artifact_r2_bucket', label: 'Bucket', description: '保存 Agent Artifact 的 R2 Bucket。', type: 'text' },
      { key: 'artifact_r2_public_base_url', label: '公开下载 Base URL', description: '可选；不填时后端使用预签名 S3 URL。', type: 'text' },
      { key: 'artifact_download_url_ttl_sec', label: '下载 URL TTL', description: '预签名下载 URL 有效期，单位秒。', type: 'number' },
      { key: 'artifact_upload_max_bytes', label: '上传大小上限', description: 'Agent Artifact 上传大小上限，单位字节。', type: 'number' },
    ],
  },
]

function toFormState(settings: AppSettingsResponse): SettingsFormState {
  return {
    ...settings,
    artifact_r2_secret_access_key: '',
  }
}

function buildPatchBody(form: SettingsFormState): AppSettingsUpdate {
  const body: AppSettingsUpdate = {
    victoriametrics_write_url: form.victoriametrics_write_url,
    victoriametrics_query_url: form.victoriametrics_query_url || null,
    worker_fetch_batch_size: Number(form.worker_fetch_batch_size),
    worker_fetch_timeout_sec: Number(form.worker_fetch_timeout_sec),
    worker_processing_concurrency: Number(form.worker_processing_concurrency),
    agent_state_worker_fetch_batch_size: Number(form.agent_state_worker_fetch_batch_size),
    agent_state_worker_fetch_timeout_sec: Number(form.agent_state_worker_fetch_timeout_sec),
    agent_offline_after_sec: Number(form.agent_offline_after_sec),
    agent_status_sweep_interval_sec: Number(form.agent_status_sweep_interval_sec),
    agent_status_singleton_lock_enabled: Boolean(form.agent_status_singleton_lock_enabled),
    asn_enrichment_sweep_interval_sec: Number(form.asn_enrichment_sweep_interval_sec),
    asn_enrichment_batch_size: Number(form.asn_enrichment_batch_size),
    asn_enrichment_claim_stale_after_sec: Number(form.asn_enrichment_claim_stale_after_sec),
    asn_enrichment_singleton_lock_enabled: Boolean(form.asn_enrichment_singleton_lock_enabled),
    result_ingestion_event_retention_days: Number(form.result_ingestion_event_retention_days),
    artifact_storage_provider: form.artifact_storage_provider,
    artifact_r2_endpoint_url: form.artifact_r2_endpoint_url || null,
    artifact_r2_access_key_id: form.artifact_r2_access_key_id || null,
    artifact_r2_bucket: form.artifact_r2_bucket,
    artifact_r2_public_base_url: form.artifact_r2_public_base_url || null,
    artifact_download_url_ttl_sec: Number(form.artifact_download_url_ttl_sec),
    artifact_upload_max_bytes: Number(form.artifact_upload_max_bytes),
  }
  if (form.artifact_r2_secret_access_key.trim()) {
    body.artifact_r2_secret_access_key = form.artifact_r2_secret_access_key.trim()
  }
  return body
}

function fieldValue(form: SettingsFormState, key: keyof SettingsFormState): string | number {
  const value = form[key]
  if (typeof value === 'number') return value
  if (typeof value === 'string') return value
  return ''
}

export default function SettingsPage() {
  const { data, isLoading, error } = useSystemSettings()
  const settings = data?.data

  if (isLoading) {
    return (
      <SettingsShell saveDisabled>
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-56 w-full" />
          ))}
        </div>
      </SettingsShell>
    )
  }

  if (error || !settings) {
    return (
      <SettingsShell saveDisabled>
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">系统设置加载失败。</div>
      </SettingsShell>
    )
  }

  return <SettingsForm settings={settings} />
}

function SettingsShell({
  children,
  onSubmit,
  saveDisabled,
  saving = false,
}: {
  children: React.ReactNode
  onSubmit?: (event: React.FormEvent) => void
  saveDisabled: boolean
  saving?: boolean
}) {
  return (
    <form onSubmit={onSubmit} className="p-6 space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-text-primary">
            <Settings className="w-5 h-5" />
            <h1 className="text-2xl font-semibold">系统设置</h1>
          </div>
          <p className="mt-1 text-sm text-text-muted">通过 API 管理后端运行配置。修改 worker 参数后，相关 worker 在下一轮循环读取新值。</p>
        </div>
        <Button type="submit" disabled={saveDisabled}>
          <Save className="w-4 h-4" />
          {saving ? '保存中' : '保存设置'}
        </Button>
      </div>

      {children}
    </form>
  )
}

function SettingsForm({ settings }: { settings: AppSettingsResponse }) {
  const updateSettings = useUpdateSystemSettings()
  const [form, setForm] = useState<SettingsFormState>(() => toFormState(settings))

  const saveDisabled = updateSettings.isPending
  const secretStatus = useMemo(() => {
    return settings.artifact_r2_secret_access_key_configured ? 'Secret Access Key 已配置' : 'Secret Access Key 未配置'
  }, [settings])

  const updateField = (key: keyof SettingsFormState, value: string | number | boolean) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    updateSettings.mutate(buildPatchBody(form), {
      onSuccess: (response) => {
        setForm(toFormState(response.data))
      },
    })
  }

  return (
    <SettingsShell onSubmit={handleSubmit} saveDisabled={saveDisabled} saving={updateSettings.isPending}>
      <div className="grid gap-4 lg:grid-cols-2">
        {SECTIONS.map((section) => (
          <Card key={section.title} role="region" aria-label={section.title} className="rounded-lg">
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.fields.map((field) => (
                <div key={field.key} className="grid gap-2 md:grid-cols-[220px_1fr] md:items-start">
                  <div>
                    <Label htmlFor={`setting-${field.key}`} className="text-sm text-text-primary">{field.label}</Label>
                    <p className="mt-1 text-xs leading-relaxed text-text-muted">{field.description}</p>
                    {field.type === 'secret' && (
                      <p className="mt-1 text-xs text-emerald-300">{secretStatus}</p>
                    )}
                  </div>
                  <Input
                    id={`setting-${field.key}`}
                    aria-label={field.label}
                    type={field.type === 'number' ? 'number' : field.type === 'secret' ? 'password' : 'text'}
                    value={fieldValue(form, field.key)}
                    placeholder={field.type === 'secret' ? '留空表示不修改' : undefined}
                    onChange={(event) => {
                      const next = field.type === 'number' ? Number(event.target.value) : event.target.value
                      updateField(field.key, next)
                    }}
                    className="bg-background/95"
                  />
                </div>
              ))}
              {section.switches?.map((item) => (
                <div key={item.key} className="grid gap-2 rounded-lg border border-border/70 p-3 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="text-sm font-medium text-text-primary">{item.label}</div>
                    <div className="mt-1 text-xs leading-relaxed text-text-muted">{item.description}</div>
                  </div>
                  <ToggleSwitch
                    aria-label={item.label}
                    checked={Boolean(form[item.key])}
                    onChange={(checked) => updateField(item.key, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {updateSettings.isError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">保存失败，请检查参数范围和后端日志。</div>
      )}
      {updateSettings.isSuccess && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">设置已保存。</div>
      )}
    </SettingsShell>
  )
}
