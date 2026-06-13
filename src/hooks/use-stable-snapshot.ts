import { useEffect, useSyncExternalStore } from 'react'

interface StableSnapshotOptions<T> {
  scope: string
  value: T
  hasValue: boolean
  isUpdating?: boolean
}

interface StableSnapshot<T> {
  value: T
  hasValue: boolean
}

const snapshots = new Map<string, StableSnapshot<unknown>>()
const listeners = new Set<() => void>()
let snapshotVersion = 0

function subscribeSnapshots(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshotVersion(): number {
  return snapshotVersion
}

function publishSnapshot<T>(scope: string, snapshot: StableSnapshot<T>): void {
  const current = snapshots.get(scope)
  if (current?.value === snapshot.value && current.hasValue === snapshot.hasValue) return
  snapshots.set(scope, snapshot)
  snapshotVersion += 1
  for (const listener of listeners) listener()
}

function deleteSnapshot(scope: string): void {
  if (!snapshots.delete(scope)) return
  snapshotVersion += 1
  for (const listener of listeners) listener()
}

export function useStableSnapshot<T>({
  scope,
  value,
  hasValue,
  isUpdating = false,
}: StableSnapshotOptions<T>): T {
  useSyncExternalStore(subscribeSnapshots, getSnapshotVersion, getSnapshotVersion)

  const snapshot = snapshots.get(scope) as StableSnapshot<T> | undefined

  useEffect(() => {
    if (!isUpdating && hasValue) {
      publishSnapshot(scope, { value, hasValue })
    }
  }, [hasValue, isUpdating, scope, value])

  useEffect(() => {
    return () => {
      deleteSnapshot(scope)
    }
  }, [scope])

  if (isUpdating && !hasValue && snapshot?.hasValue) {
    return snapshot.value
  }

  return value
}
