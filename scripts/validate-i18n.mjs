import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname

function readJson(path) {
  return JSON.parse(readFileSync(join(root, path), 'utf8'))
}

function flatten(value, prefix = '') {
  return Object.entries(value).flatMap(([key, child]) => {
    const next = prefix ? `${prefix}.${key}` : key
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      return flatten(child, next)
    }
    return [[next, child]]
  })
}

function fail(message) {
  console.error(message)
  process.exitCode = 1
}

const zh = new Map(flatten(readJson('src/i18n/locales/zh.json')))
const en = new Map(flatten(readJson('src/i18n/locales/en.json')))

const missingEn = [...zh.keys()].filter((key) => !en.has(key))
const missingZh = [...en.keys()].filter((key) => !zh.has(key))

if (missingEn.length > 0) fail(`Missing English i18n keys:\n${missingEn.join('\n')}`)
if (missingZh.length > 0) fail(`Missing Chinese i18n keys:\n${missingZh.join('\n')}`)

const declaration = readFileSync(join(root, 'src/i18n/i18next.d.ts'), 'utf8')
for (const required of ['CustomTypeOptions', 'resources', 'defaultNS']) {
  if (!declaration.includes(required)) fail(`src/i18n/i18next.d.ts is missing ${required}`)
}

const checkedFiles = [
  'src/api/hooks/use-auth.ts',
  'src/components/ui/error-boundary.tsx',
  'src/features/agents/pages/agents-page.tsx',
  'src/features/agents/pages/releases-page.tsx',
  'src/features/admin/geo-input.tsx',
  'src/features/admin/tag-input.tsx',
  'src/features/admin/pages/geo-management-page.tsx',
  'src/features/admin/pages/settings-page.tsx',
  'src/features/dashboard/pages/dashboard-page.tsx',
  'src/features/monitoring/components/iperf3/iperf3-result-views.tsx',
  'src/features/monitoring/components/mtr/mtr-detail-table.tsx',
  'src/features/monitoring/components/mtr/mtr-result-views.tsx',
  'src/features/monitoring/components/target/target-monitoring-panel.tsx',
  'src/features/monitoring/components/time-range/time-range-selector.tsx',
  'src/features/monitoring/lib/agent-filter.ts',
  'src/features/monitoring/lib/monitoring-models.ts',
  'src/features/monitoring/pages/monitoring-detail-page.tsx',
  'src/features/monitoring/pages/monitoring-index-page.tsx',
  'src/features/monitoring/pages/mtr-detail-page.tsx',
  'src/features/tasks/pages/tasks-page.tsx',
  'src/features/targets/pages/targets-page.tsx',
  'src/features/results/pages/result-ingestion-events-page.tsx',
  'src/features/system/pages/not-found-page.tsx',
]

const allowedHan = [
  /name_zh/,
]

for (const path of checkedFiles) {
  const text = readFileSync(join(root, path), 'utf8')
  const lines = text.split('\n')
  lines.forEach((line, index) => {
    if (!/[\u3400-\u9fff]/.test(line)) return
    if (allowedHan.some((pattern) => pattern.test(line))) return
    fail(`${path}:${index + 1}: hard-coded Chinese UI text should use i18n`)
  })
}
