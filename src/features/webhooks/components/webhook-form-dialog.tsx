import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateWebhook, useUpdateWebhook } from '@/api/hooks/use-webhooks'
import { isReservedHeader } from '@/features/webhooks/lib/constants'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { TemplateVarRef } from './template-var-ref'
import { KeyValueEditor } from './key-value-editor'
import { createEntry, type KeyValueEntry } from '@/features/webhooks/lib/constants'
import type { WebhookResponse } from '@/api/generated/types.gen'

interface WebhookFormDialogProps {
  mode: 'create' | 'edit'
  webhook?: WebhookResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSecretReceived?: (secret: string) => void
}

function recordToEntries(record: Record<string, string> | null | undefined): KeyValueEntry[] {
  if (!record) return []
  return Object.entries(record).map(([key, value]) => createEntry(key, value))
}

function entriesToRecord(entries: KeyValueEntry[]): Record<string, string> | null {
  const filtered = entries.filter((e) => e.key.trim() !== '')
  if (filtered.length === 0) return null
  const result: Record<string, string> = {}
  for (const e of filtered) {
    result[e.key.trim()] = e.value
  }
  return result
}

export function WebhookFormDialog({ mode, webhook, open, onOpenChange, onSecretReceived }: WebhookFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        {open && (
          <WebhookFormContent
            mode={mode}
            webhook={webhook}
            onOpenChange={onOpenChange}
            onSecretReceived={onSecretReceived}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

interface WebhookFormContentProps {
  mode: 'create' | 'edit'
  webhook?: WebhookResponse | null
  onOpenChange: (open: boolean) => void
  onSecretReceived?: (secret: string) => void
}

function WebhookFormContent({ mode, webhook, onOpenChange, onSecretReceived }: WebhookFormContentProps) {
  const { t } = useTranslation()
  const createWebhook = useCreateWebhook()
  const updateWebhook = useUpdateWebhook()
  const templateRef = useRef<HTMLTextAreaElement>(null)

  const [name, setName] = useState(() =>
    mode === 'edit' && webhook ? webhook.name : ''
  )
  const [url, setUrl] = useState(() =>
    mode === 'edit' && webhook ? webhook.url : ''
  )
  const [bodyTemplate, setBodyTemplate] = useState(() =>
    mode === 'edit' && webhook ? (webhook.body_template ?? '') : ''
  )
  const [headers, setHeaders] = useState<KeyValueEntry[]>(() =>
    mode === 'edit' && webhook ? recordToEntries(webhook.custom_headers) : []
  )

  const hasReservedHeaders = headers.some((e) => e.key.trim() !== '' && isReservedHeader(e.key))
  const isPending = mode === 'create' ? createWebhook.isPending : updateWebhook.isPending
  const isError = mode === 'create' ? createWebhook.isError : updateWebhook.isError

  const handleInsertVariable = useCallback((variable: string) => {
    const textarea = templateRef.current
    if (!textarea) {
      setBodyTemplate((prev) => prev + variable)
      return
    }
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    setBodyTemplate((prev) => {
      const before = prev.slice(0, start)
      const after = prev.slice(end)
      return before + variable + after
    })
    requestAnimationFrame(() => {
      textarea.focus()
      const cursorPos = start + variable.length
      textarea.setSelectionRange(cursorPos, cursorPos)
    })
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (hasReservedHeaders) return

    const templateValue = bodyTemplate.trim() || null
    const headersValue = entriesToRecord(headers)

    if (mode === 'create') {
      createWebhook.mutate(
        { name, url, body_template: templateValue, custom_headers: headersValue },
        {
          onSuccess: (result) => {
            onOpenChange(false)
            const res = result as { secret?: string }
            if (res?.secret && onSecretReceived) {
              onSecretReceived(res.secret)
            }
          },
        },
      )
    } else if (webhook) {
      updateWebhook.mutate(
        {
          uuid: webhook.webhook_uuid,
          data: {
            name,
            url,
            body_template: templateValue,
            custom_headers: headersValue,
          },
        },
        { onSuccess: () => onOpenChange(false) },
      )
    }
  }

  const hasAdvanced = mode === 'edit' && (!!webhook?.body_template || !!webhook?.custom_headers)

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {mode === 'create' ? t('webhooks.dialogTitle') : t('webhooks.editWebhook')}
        </DialogTitle>
        <DialogDescription>
          {mode === 'create' ? t('webhooks.dialogDesc') : t('webhooks.editDialogDesc')}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        {/* Basic fields */}
        <div>
          <Label className="text-xs text-text-secondary mb-1.5">{t('common.name')}</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('webhooks.namePlaceholder')}
            required
          />
        </div>
        <div>
          <Label className="text-xs text-text-secondary mb-1.5">{t('webhooks.url')}</Label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t('webhooks.urlPlaceholder')}
            type="url"
            required
          />
        </div>

        {/* Advanced options */}
        <details className="group" open={hasAdvanced || undefined}>
          <summary className="text-xs font-medium text-text-muted cursor-pointer select-none hover:text-text-secondary transition-colors py-1">
            {t('webhooks.advancedOptions')}
          </summary>
          <div className="mt-3 space-y-4 pl-0">
            {/* Body Template */}
            <div>
              <Label className="text-xs text-text-secondary mb-1.5">{t('webhooks.bodyTemplate')}</Label>
              <Textarea
                ref={templateRef}
                value={bodyTemplate}
                onChange={(e) => setBodyTemplate(e.target.value)}
                placeholder={t('webhooks.bodyTemplatePlaceholder')}
                className="font-mono text-xs min-h-[120px]"
                rows={6}
              />
              <p className="text-[10px] text-text-dim mt-1">{t('webhooks.bodyTemplateHint')}</p>
              <TemplateVarRef onInsert={handleInsertVariable} />
            </div>

            {/* Custom Headers */}
            <div>
              <Label className="text-xs text-text-secondary mb-1.5">{t('webhooks.customHeaders')}</Label>
              <p className="text-[10px] text-text-dim mb-1">{t('webhooks.customHeadersHint')}</p>
              <p className="text-[10px] text-amber-400/80 mb-2">{t('webhooks.reservedHeadersNote')}</p>
              <KeyValueEditor value={headers} onChange={setHeaders} />
            </div>
          </div>
        </details>

        <DialogFooter>
          <Button
            type="submit"
            disabled={isPending || hasReservedHeaders}
            
          >
            {isPending
              ? (mode === 'create' ? t('common.creating') : t('webhooks.updating'))
              : (mode === 'create' ? t('webhooks.createWebhook') : t('webhooks.updateWebhook'))
            }
          </Button>
        </DialogFooter>
        {isError && (
          <p className="text-red-400 text-xs">
            {mode === 'create' ? t('webhooks.createFailed') : t('webhooks.updateFailed')}
          </p>
        )}
      </form>
    </>
  )
}
