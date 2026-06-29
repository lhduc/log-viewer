import { NextResponse } from 'next/server'
import { listPods } from '@/lib/k8s-client'
import { isNamespaceAllowed, filterAllowedPods } from '@/lib/k8s-allowlist'
import { apiError } from '@/lib/api-error'

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams
  const context = params.get('context') ?? ''
  const namespace = params.get('namespace') ?? ''
  if (!context || !namespace) return NextResponse.json({ error: 'context and namespace required' }, { status: 400 })
  try {
    if (!isNamespaceAllowed(context, namespace)) return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
    const pods = await listPods(context, namespace)
    return NextResponse.json(pods)
  } catch (err) {
    return apiError(err, `GET /api/k8s/pods context=${context} namespace=${namespace}`, 503)
  }
}
