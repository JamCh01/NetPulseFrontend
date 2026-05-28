import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
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

type SettingsTranslationKey =
  | 'settings.victoriametricsDesc'
  | 'settings.vmWriteUrl'
  | 'settings.vmWriteUrlDesc'
  | 'settings.vmQueryUrl'
  | 'settings.vmQueryUrlDesc'
  | 'settings.resultWorkerDesc'
  | 'settings.fetchBatchSize'
  | 'settings.resultFetchBatchSizeDesc'
  | 'settings.fetchTimeout'
  | 'settings.resultFetchTimeoutDesc'
  | 'settings.processingConcurrency'
  | 'settings.processingConcurrencyDesc'
  | 'settings.agentStateWorkerDesc'
  | 'settings.agentStateFetchBatchSizeDesc'
  | 'settings.agentStateFetchTimeoutDesc'
  | 'settings.agentOfflineAfter'
  | 'settings.agentOfflineAfterDesc'
  | 'settings.agentStatusWorkerDesc'
  | 'settings.sweepInterval'
  | 'settings.agentStatusSweepIntervalDesc'
  | 'settings.singletonLock'
  | 'settings.agentStatusSingletonDesc'
  | 'settings.asnEnrichmentWorkerDesc'
  | 'settings.asnSweepIntervalDesc'
  | 'settings.claimBatchSize'
  | 'settings.asnBatchSizeDesc'
  | 'settings.claimStaleSeconds'
  | 'settings.asnClaimStaleDesc'
  | 'settings.asnSingletonDesc'
  | 'settings.resultIngestionEventsDesc'
  | 'settings.retentionDays'
  | 'settings.retentionDaysDesc'
  | 'settings.cloudflareR2Desc'
  | 'settings.storageProvider'
  | 'settings.storageProviderDesc'
  | 'settings.r2Endpoint'
  | 'settings.r2EndpointDesc'
  | 'settings.r2AccessKeyId'
  | 'settings.r2AccessKeyDesc'
  | 'settings.r2SecretAccessKey'
  | 'settings.r2SecretDesc'
  | 'settings.r2Bucket'
  | 'settings.r2BucketDesc'
  | 'settings.publicBaseUrl'
  | 'settings.publicBaseUrlDesc'
  | 'settings.downloadUrlTtl'
  | 'settings.downloadUrlTtlDesc'
  | 'settings.uploadMaxBytes'
  | 'settings.uploadMaxBytesDesc'

interface FieldConfig {
  key: keyof SettingsFormState
  labelKey: SettingsTranslationKey
  descriptionKey: SettingsTranslationKey
  type: 'text' | 'number' | 'secret'
}

interface SwitchConfig {
  key: keyof SettingsFormState
  labelKey: SettingsTranslationKey
  descriptionKey: SettingsTranslationKey
}

interface SectionConfig {
  title: string
  descriptionKey: SettingsTranslationKey
  fields: FieldConfig[]
  switches?: SwitchConfig[]
}

const SECTIONS: SectionConfig[] = [
  {
    title: 'VictoriaMetrics',
    descriptionKey: 'settings.victoriametricsDesc',
    fields: [
      { key: 'victoriametrics_write_url', labelKey: 'settings.vmWriteUrl', descriptionKey: 'settings.vmWriteUrlDesc', type: 'text' },
      { key: 'victoriametrics_query_url', labelKey: 'settings.vmQueryUrl', descriptionKey: 'settings.vmQueryUrlDesc', type: 'text' },
    ],
  },
  {
    title: 'Result Worker',
    descriptionKey: 'settings.resultWorkerDesc',
    fields: [
      { key: 'worker_fetch_batch_size', labelKey: 'settings.fetchBatchSize', descriptionKey: 'settings.resultFetchBatchSizeDesc', type: 'number' },
      { key: 'worker_fetch_timeout_sec', labelKey: 'settings.fetchTimeout', descriptionKey: 'settings.resultFetchTimeoutDesc', type: 'number' },
      { key: 'worker_processing_concurrency', labelKey: 'settings.processingConcurrency', descriptionKey: 'settings.processingConcurrencyDesc', type: 'number' },
    ],
  },
  {
    title: 'Agent State Worker',
    descriptionKey: 'settings.agentStateWorkerDesc',
    fields: [
      { key: 'agent_state_worker_fetch_batch_size', labelKey: 'settings.fetchBatchSize', descriptionKey: 'settings.agentStateFetchBatchSizeDesc', type: 'number' },
      { key: 'agent_state_worker_fetch_timeout_sec', labelKey: 'settings.fetchTimeout', descriptionKey: 'settings.agentStateFetchTimeoutDesc', type: 'number' },
      { key: 'agent_offline_after_sec', labelKey: 'settings.agentOfflineAfter', descriptionKey: 'settings.agentOfflineAfterDesc', type: 'number' },
    ],
  },
  {
    title: 'Agent Status Worker',
    descriptionKey: 'settings.agentStatusWorkerDesc',
    fields: [
      { key: 'agent_status_sweep_interval_sec', labelKey: 'settings.sweepInterval', descriptionKey: 'settings.agentStatusSweepIntervalDesc', type: 'number' },
    ],
    switches: [
      { key: 'agent_status_singleton_lock_enabled', labelKey: 'settings.singletonLock', descriptionKey: 'settings.agentStatusSingletonDesc' },
    ],
  },
  {
    title: 'ASN Enrichment Worker',
    descriptionKey: 'settings.asnEnrichmentWorkerDesc',
    fields: [
      { key: 'asn_enrichment_sweep_interval_sec', labelKey: 'settings.sweepInterval', descriptionKey: 'settings.asnSweepIntervalDesc', type: 'number' },
      { key: 'asn_enrichment_batch_size', labelKey: 'settings.claimBatchSize', descriptionKey: 'settings.asnBatchSizeDesc', type: 'number' },
      { key: 'asn_enrichment_claim_stale_after_sec', labelKey: 'settings.claimStaleSeconds', descriptionKey: 'settings.asnClaimStaleDesc', type: 'number' },
    ],
    switches: [
      { key: 'asn_enrichment_singleton_lock_enabled', labelKey: 'settings.singletonLock', descriptionKey: 'settings.asnSingletonDesc' },
    ],
  },
  {
    title: 'Result Ingestion Events',
    descriptionKey: 'settings.resultIngestionEventsDesc',
    fields: [
      { key: 'result_ingestion_event_retention_days', labelKey: 'settings.retentionDays', descriptionKey: 'settings.retentionDaysDesc', type: 'number' },
    ],
  },
  {
    title: 'Cloudflare R2 Artifact Storage',
    descriptionKey: 'settings.cloudflareR2Desc',
    fields: [
      { key: 'artifact_storage_provider', labelKey: 'settings.storageProvider', descriptionKey: 'settings.storageProviderDesc', type: 'text' },
      { key: 'artifact_r2_endpoint_url', labelKey: 'settings.r2Endpoint', descriptionKey: 'settings.r2EndpointDesc', type: 'text' },
      { key: 'artifact_r2_access_key_id', labelKey: 'settings.r2AccessKeyId', descriptionKey: 'settings.r2AccessKeyDesc', type: 'text' },
      { key: 'artifact_r2_secret_access_key', labelKey: 'settings.r2SecretAccessKey', descriptionKey: 'settings.r2SecretDesc', type: 'secret' },
      { key: 'artifact_r2_bucket', labelKey: 'settings.r2Bucket', descriptionKey: 'settings.r2BucketDesc', type: 'text' },
      { key: 'artifact_r2_public_base_url', labelKey: 'settings.publicBaseUrl', descriptionKey: 'settings.publicBaseUrlDesc', type: 'text' },
      { key: 'artifact_download_url_ttl_sec', labelKey: 'settings.downloadUrlTtl', descriptionKey: 'settings.downloadUrlTtlDesc', type: 'number' },
      { key: 'artifact_upload_max_bytes', labelKey: 'settings.uploadMaxBytes', descriptionKey: 'settings.uploadMaxBytesDesc', type: 'number' },
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
  const { t } = useTranslation()
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
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">{t('settings.loadFailed')}</div>
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
  const { t } = useTranslation()
  return (
    <form onSubmit={onSubmit} className="p-6 space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-text-primary">
            <Settings className="w-5 h-5" />
            <h1 className="text-2xl font-semibold">{t('settings.title')}</h1>
          </div>
          <p className="mt-1 text-sm text-text-muted">{t('settings.description')}</p>
        </div>
        <Button type="submit" disabled={saveDisabled}>
          <Save className="w-4 h-4" />
          {saving ? t('settings.saving') : t('settings.saveSettings')}
        </Button>
      </div>

      {children}
    </form>
  )
}

function SettingsForm({ settings }: { settings: AppSettingsResponse }) {
  const { t } = useTranslation()
  const updateSettings = useUpdateSystemSettings()
  const [form, setForm] = useState<SettingsFormState>(() => toFormState(settings))

  const saveDisabled = updateSettings.isPending
  const secretStatus = useMemo(() => {
    return settings.artifact_r2_secret_access_key_configured
      ? { label: t('settings.secretConfigured'), className: 'font-medium text-emerald-400' }
      : { label: t('settings.secretMissing'), className: 'font-medium text-red-400' }
  }, [settings, t])

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
              <CardDescription>{t(section.descriptionKey)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.fields.map((field) => (
                <div key={field.key} className="grid gap-2 md:grid-cols-[220px_1fr] md:items-start">
                  <div>
                    <Label htmlFor={`setting-${field.key}`} className="text-sm text-text-primary">{t(field.labelKey)}</Label>
                    <p className="mt-1 text-xs leading-relaxed text-text-muted">{t(field.descriptionKey)}</p>
                    {field.type === 'secret' && (
                      <p className={`mt-1 text-xs ${secretStatus.className}`}>{secretStatus.label}</p>
                    )}
                  </div>
                  <Input
                    id={`setting-${field.key}`}
                    aria-label={t(field.labelKey)}
                    type={field.type === 'number' ? 'number' : field.type === 'secret' ? 'password' : 'text'}
                    value={fieldValue(form, field.key)}
                    placeholder={field.type === 'secret' ? t('settings.secretPlaceholder') : undefined}
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
                    <div className="text-sm font-medium text-text-primary">{t(item.labelKey)}</div>
                    <div className="mt-1 text-xs leading-relaxed text-text-muted">{t(item.descriptionKey)}</div>
                  </div>
                  <ToggleSwitch
                    aria-label={t(item.labelKey)}
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
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{t('settings.saveFailed')}</div>
      )}
      {updateSettings.isSuccess && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">{t('settings.saveSuccess')}</div>
      )}
    </SettingsShell>
  )
}
