import { readFileSync } from 'fs'
import { join } from 'path'
import { load as parseYaml } from 'js-yaml'

interface AllowedEntry {
  context: string
  namespace: string
  projects?: string[]
}

interface AllowlistFile {
  allowed: AllowedEntry[]
}

let cached: AllowlistFile | null = null

function loadAllowlist(): AllowlistFile {
  if (cached) return cached
  const filePath = process.env.K8S_ALLOWLIST_PATH ?? join(process.cwd(), 'k8s-allowlist.yaml')
  let raw: string
  try {
    raw = readFileSync(filePath, 'utf8')
  } catch {
    throw new Error(
      `k8s-allowlist.yaml not found at ${filePath}. Copy k8s-allowlist.example.yaml and edit it.`
    )
  }
  const parsed = parseYaml(raw) as AllowlistFile
  if (!Array.isArray(parsed?.allowed)) {
    throw new Error('k8s-allowlist.yaml must have an "allowed" array at the top level.')
  }
  cached = parsed
  return cached
}

export function getAllowlist(): AllowlistFile {
  return loadAllowlist()
}

export function getUniqueContexts(): string[] {
  const seen = new Set<string>()
  return loadAllowlist().allowed
    .map(e => e.context)
    .filter(c => { if (seen.has(c)) return false; seen.add(c); return true })
}

export function getNamespacesForContext(context: string): string[] {
  return loadAllowlist().allowed
    .filter(e => e.context === context)
    .map(e => e.namespace)
}

export function isContextAllowed(context: string): boolean {
  return loadAllowlist().allowed.some(e => e.context === context)
}

export function isNamespaceAllowed(context: string, namespace: string): boolean {
  return loadAllowlist().allowed.some(e => e.context === context && e.namespace === namespace)
}

// Returns pod names that pass the project prefix filter for this context+namespace.
// If the entry has no `projects` list, all pod names are returned.
export function filterAllowedPods(context: string, namespace: string, podNames: string[]): string[] {
  const entry = loadAllowlist().allowed.find(e => e.context === context && e.namespace === namespace)
  if (!entry) return []
  if (!entry.projects || entry.projects.length === 0) return podNames
  return podNames.filter(name => entry.projects!.some(p => name === p || name.startsWith(`${p}-`)))
}
