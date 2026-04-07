import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { monitoringKeys } from './keys'
import type { MonitoringDataPoint, MonitoringResponse } from '@/api/generated/types.gen'

interface WsPushMessage {
  task_uuid: string
  agent_uuid: string | null
  timestamp: number
  data: MonitoringDataPoint[]
}

interface UseMonitoringWsProps {
  taskUuid: string
  agentUuid?: string
  enabled?: boolean
}

export function useMonitoringWebSocket({ taskUuid, agentUuid, enabled = true }: UseMonitoringWsProps) {
  const queryClient = useQueryClient()
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled || !taskUuid) return

    const connect = () => {
      let wsUrl = ''
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        wsUrl = `${protocol}//localhost:8000/api/v1/monitoring/ws`
      } else {
        wsUrl = `${protocol}//${window.location.host}/api/v1/monitoring/ws`
      }
      
      const ws = new WebSocket(wsUrl)
      socketRef.current = ws

      ws.onopen = () => {
        ws.send(JSON.stringify({
          task_uuid: taskUuid,
          agent_uuid: agentUuid || null
        }))
      }

      ws.onmessage = (event) => {
        try {
          const message: WsPushMessage = JSON.parse(event.data)
          console.debug('[WS] Received message:', { taskUuid: message.task_uuid, agentUuid: message.agent_uuid, points: message.data?.length })

          if (message.data && message.data.length > 0) {
            let updatedCount = 0
            queryClient.setQueriesData<MonitoringResponse>(
              {
                queryKey: monitoringKeys.all,
                predicate: (query) => {
                  const key = query.queryKey as any[]
                  const isMonitoring = key[0] === 'monitoring' && key[1] === 'query'
                  if (!isMonitoring) return false

                  const filters = key[2] || {}
                  if (filters.task_uuid !== taskUuid) return false

                  if (message.agent_uuid) {
                    return filters.agent_uuid === message.agent_uuid
                  } else {
                    return !filters.agent_uuid || filters.agent_uuid === null
                  }
                }
              },
              (oldData) => {
                if (!oldData || !oldData.data) {
                  console.debug('[WS] No existing data, creating new')
                  return { ...oldData, data: message.data } as MonitoringResponse
                }

                const existingTimestamps = new Set(oldData.data.map((p: MonitoringDataPoint) => p.timestamp))
                const newUniquePoints = message.data.filter((p: MonitoringDataPoint) => !existingTimestamps.has(p.timestamp))
                const updatedPoints = message.data.filter((p: MonitoringDataPoint) => existingTimestamps.has(p.timestamp))

                if (newUniquePoints.length === 0 && updatedPoints.length === 0) {
                  console.debug('[WS] No new or updated points')
                  return oldData
                }

                updatedCount += newUniquePoints.length + updatedPoints.length

                const mergedData = [...oldData.data]
                for (const point of message.data) {
                  const idx = mergedData.findIndex(p => p.timestamp === point.timestamp)
                  if (idx >= 0) {
                    mergedData[idx] = point
                  } else {
                    mergedData.push(point)
                  }
                }

                console.debug('[WS] Updated cache:', { added: newUniquePoints.length, updated: updatedPoints.length, total: mergedData.length })

                return {
                  ...oldData,
                  data: mergedData.sort((a, b) => a.timestamp - b.timestamp)
                }
              }
            )
            console.debug('[WS] Cache update complete, updated queries:', updatedCount)
          }
        } catch (err) {
          console.error('[WS] Cache patch failed', err)
        }
      }

      ws.onclose = (e) => {
        if (e.code !== 1000) {
          reconnectTimeoutRef.current = window.setTimeout(connect, 5000)
        }
      }
    }

    connect()

    return () => {
      if (socketRef.current) socketRef.current.close(1000)
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
    }
  }, [taskUuid, agentUuid, enabled, queryClient])

  return null
}
