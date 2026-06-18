// Only stream logs for services whose names contain these keywords.
// Everything else (redis, fe, admin, nginx, etc.) is excluded.
const PROJECT_KEYWORDS = ['api', 'worker']

export function isProjectService(name: string): boolean {
  const lower = name.toLowerCase()
  return PROJECT_KEYWORDS.some(k => lower.includes(k))
}
