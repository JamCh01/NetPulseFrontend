import {
  useCreateTask,
  useDeleteTask,
  useSetTaskEnabled,
  useTask,
  useTasks,
  useUpdateTask,
} from './admin-api'

export const useDisableTask = useDeleteTask

export {
  useCreateTask,
  useDeleteTask,
  useSetTaskEnabled,
  useTask,
  useTasks,
  useUpdateTask,
}
