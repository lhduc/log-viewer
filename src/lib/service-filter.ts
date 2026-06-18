// Known infrastructure / non-backend service name patterns.
// These are excluded from the main tab bar in both Docker and k8s modes.
const INFRA_NAMES = new Set([
  'redis', 'postgres', 'postgresql', 'mysql', 'mariadb', 'mongodb', 'mongo',
  'elasticsearch', 'elastic', 'opensearch', 'kafka', 'rabbitmq', 'rabbit',
  'minio', 'nginx', 'haproxy', 'traefik', 'envoy', 'memcached', 'cassandra',
  'fe', 'frontend', 'web', 'admin', 'dashboard', 'ui', 'panel',
  'db', 'cache', 'broker', 'smtp', 'mailhog', 'mailpit', 'zookeeper',
])

// Returns true if the service/container name looks like infrastructure.
export function isInfraService(name: string): boolean {
  const lower = name.toLowerCase()
  return INFRA_NAMES.has(lower)
    || [...INFRA_NAMES].some(p => lower.startsWith(p + '-') || lower.endsWith('-' + p))
}
