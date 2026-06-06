import type { IpFamily } from '@/api/hooks/admin-api'
import { CheckableList, type CheckableListItem } from '@/components/ui/checkable-list'
import { Label } from '@/components/ui/label'
import { QUICK_ASSOCIATE_IP_FAMILIES, type QuickAssociateTaskType } from '@/features/admin/quick-associate-options'
import { ipFamilyLabel, protocolLabel } from '@/lib/constants'

function selectedSet(values: readonly string[]): ReadonlySet<string> {
  return new Set(values)
}

function taskTypeItems(options: QuickAssociateTaskType[]): CheckableListItem[] {
  return options.map((type) => ({ id: type, label: protocolLabel(type) }))
}

function ipFamilyItems(options: IpFamily[]): CheckableListItem[] {
  return QUICK_ASSOCIATE_IP_FAMILIES
    .filter((family) => options.includes(family))
    .map((family) => ({ id: family, label: ipFamilyLabel(family) }))
}

export function QuickAssociateFields({
  taskTypesLabel,
  taskTypesDescription,
  ipFamiliesLabel,
  ipFamiliesDescription,
  emptyTaskTypesMessage,
  emptyIpFamiliesMessage,
  taskTypeOptions,
  selectedTaskTypes,
  onToggleTaskType,
  ipFamilyOptions,
  selectedIpFamilies,
  onToggleIpFamily,
}: {
  taskTypesLabel: string
  taskTypesDescription: string
  ipFamiliesLabel: string
  ipFamiliesDescription: string
  emptyTaskTypesMessage: string
  emptyIpFamiliesMessage: string
  taskTypeOptions: QuickAssociateTaskType[]
  selectedTaskTypes: QuickAssociateTaskType[]
  onToggleTaskType: (taskType: string) => void
  ipFamilyOptions: IpFamily[]
  selectedIpFamilies: IpFamily[]
  onToggleIpFamily: (ipFamily: string) => void
}) {
  return (
    <>
      <div className="space-y-2 rounded-lg border border-border bg-bg-surface-light p-3">
        <div>
          <Label className="text-xs font-medium text-text-primary">{taskTypesLabel}</Label>
          <p className="mt-1 text-[11px] leading-relaxed text-text-muted">{taskTypesDescription}</p>
        </div>
        <CheckableList
          items={taskTypeItems(taskTypeOptions)}
          selectedIds={selectedSet(selectedTaskTypes)}
          onToggle={onToggleTaskType}
          emptyMessage={emptyTaskTypesMessage}
          maxHeight="max-h-36"
        />
      </div>
      <div className="space-y-2 rounded-lg border border-border bg-bg-surface-light p-3">
        <div>
          <Label className="text-xs font-medium text-text-primary">{ipFamiliesLabel}</Label>
          <p className="mt-1 text-[11px] leading-relaxed text-text-muted">{ipFamiliesDescription}</p>
        </div>
        <CheckableList
          items={ipFamilyItems(ipFamilyOptions)}
          selectedIds={selectedSet(selectedIpFamilies)}
          onToggle={onToggleIpFamily}
          emptyMessage={emptyIpFamiliesMessage}
          maxHeight="max-h-28"
        />
      </div>
    </>
  )
}
