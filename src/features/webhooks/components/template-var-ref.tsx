import { useTranslation } from 'react-i18next'
import { TEMPLATE_VARIABLES } from '@/features/webhooks/lib/constants'

const CATEGORY_I18N: Record<string, string> = {
  event: 'webhooks.categoryEvent',
  rule: 'webhooks.categoryRule',
  task: 'webhooks.categoryTask',
  agent: 'webhooks.categoryAgent',
  webhook: 'webhooks.categoryWebhook',
}

interface TemplateVarRefProps {
  onInsert?: (variable: string) => void
}

export function TemplateVarRef({ onInsert }: TemplateVarRefProps) {
  const { t } = useTranslation()

  return (
    <details className="mt-2 group">
      <summary className="text-[11px] text-text-muted cursor-pointer select-none hover:text-text-secondary transition-colors">
        {t('webhooks.templateVariables')}
      </summary>
      <p className="text-[10px] text-text-dim mt-1.5 mb-2">{t('webhooks.templateVariablesHint')}</p>
      <div className="space-y-3">
        {TEMPLATE_VARIABLES.map((group) => (
          <div key={group.category}>
            <span className="text-[10px] text-text-dim uppercase tracking-wider font-medium">
              {t(CATEGORY_I18N[group.category] ?? group.category)}
            </span>
            <div className="mt-1 space-y-0.5">
              {group.vars.map((v) => (
                <div key={v.name} className="flex items-center gap-2 group/row">
                  <button
                    type="button"
                    onClick={() => onInsert?.(`\${${v.name}}`)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-colors font-mono shrink-0 min-w-[140px] text-left"
                  >
                    {'${' + v.name + '}'}
                  </button>
                  <span className="text-[10px] text-text-dim">{t(v.descKey)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </details>
  )
}
