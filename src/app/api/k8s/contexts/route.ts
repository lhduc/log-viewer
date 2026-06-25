import { NextResponse } from 'next/server'
import { getUniqueContexts } from '@/lib/k8s-allowlist'
import { apiError } from '@/lib/api-error'

export async function GET() {
  try {
    const contexts = getUniqueContexts()
    return NextResponse.json(contexts.map(name => ({ name, cluster: '', user: '' })))
  } catch (err) {
    return apiError(err, 'GET /api/k8s/contexts', 503)
  }
}
