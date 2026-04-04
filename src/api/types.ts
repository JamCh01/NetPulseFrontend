export interface DashboardStats {
  agents: { online: number; offline: number; disabled: number; total: number }
  tasks: { active: number; inactive: number; total: number }
}
