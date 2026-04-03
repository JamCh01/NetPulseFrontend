export default function WebhooksPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Webhooks</h1>
        <button className="text-sm font-medium bg-emerald-500/90 hover:bg-emerald-400 text-gray-950 px-4 py-2 rounded-lg transition-colors">
          Create Webhook
        </button>
      </div>
      <div className="glass-light rounded-xl p-6">
        <p className="text-text-muted text-sm">Webhook list will be implemented here.</p>
      </div>
    </div>
  )
}
