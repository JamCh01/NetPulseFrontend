export function formatDate(iso: string, language: string): string {
  return new Date(iso).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
