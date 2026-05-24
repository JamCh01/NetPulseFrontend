import {
  useAgent,
  useAgents,
  useCreateAgent,
  useDeleteAgent,
  useSetAgentEnabled,
  useUpdateAgent,
} from './admin-api'

export const useDisableAgent = useSetAgentEnabled

export {
  useAgent,
  useAgents,
  useCreateAgent,
  useDeleteAgent,
  useSetAgentEnabled,
  useUpdateAgent,
}
