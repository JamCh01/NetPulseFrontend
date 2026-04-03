export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Dashboard</h1>

      {/* Stats cards placeholder */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {['Online', 'Offline', 'Active Tasks', 'Alerts'].map((label) => (
          <div key={label} className="glass-light rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">{label}</span>
            </div>
            <div className="text-2xl font-bold text-text-primary font-mono">--</div>
            <div className="text-[10px] text-text-dim mt-0.5">Loading...</div>
          </div>
        ))}
      </div>

      {/* Mini chart grid placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="glass-light rounded-xl p-4 h-40 animate-pulse" />
        ))}
      </div>
    </div>
  )
}
