export interface TemplateVariable {
  name: string
  descKey: string
}

export interface TemplateVariableGroup {
  category: string
  vars: TemplateVariable[]
}

export const TEMPLATE_VARIABLES: readonly TemplateVariableGroup[] = [
  {
    category: 'event',
    vars: [
      { name: 'event_id', descKey: 'webhooks.varEventId' },
      { name: 'event_type', descKey: 'webhooks.varEventType' },
      { name: 'status', descKey: 'webhooks.varStatus' },
      { name: 'timestamp', descKey: 'webhooks.varTimestamp' },
      { name: 'api_version', descKey: 'webhooks.varApiVersion' },
    ],
  },
  {
    category: 'rule',
    vars: [
      { name: 'rule_uuid', descKey: 'webhooks.varRuleUuid' },
      { name: 'rule_name', descKey: 'webhooks.varRuleName' },
      { name: 'metric_type', descKey: 'webhooks.varMetricType' },
      { name: 'threshold', descKey: 'webhooks.varThreshold' },
      { name: 'operator', descKey: 'webhooks.varOperator' },
      { name: 'triggered_value', descKey: 'webhooks.varTriggeredValue' },
    ],
  },
  {
    category: 'task',
    vars: [
      { name: 'task_uuid', descKey: 'webhooks.varTaskUuid' },
      { name: 'task_name', descKey: 'webhooks.varTaskName' },
      { name: 'task_target', descKey: 'webhooks.varTaskTarget' },
      { name: 'task_protocol', descKey: 'webhooks.varTaskProtocol' },
    ],
  },
  {
    category: 'agent',
    vars: [
      { name: 'agent_uuid', descKey: 'webhooks.varAgentUuid' },
      { name: 'agent_name', descKey: 'webhooks.varAgentName' },
    ],
  },
  {
    category: 'webhook',
    vars: [
      { name: 'webhook_name', descKey: 'webhooks.varWebhookName' },
      { name: 'webhook_uuid', descKey: 'webhooks.varWebhookUuid' },
    ],
  },
]

const RESERVED_HEADERS_LOWER = [
  'content-type',
  'x-netpulse-event',
  'x-netpulse-signature',
  'x-netpulse-delivery',
] as const

export const RESERVED_HEADERS: readonly string[] = RESERVED_HEADERS_LOWER

export function isReservedHeader(key: string): boolean {
  return RESERVED_HEADERS_LOWER.includes(key.toLowerCase().trim() as typeof RESERVED_HEADERS_LOWER[number])
}

export interface KeyValueEntry {
  id: string
  key: string
  value: string
}

let nextId = 0
export function createEntry(key = '', value = ''): KeyValueEntry {
  return { id: `kv-${++nextId}`, key, value }
}
