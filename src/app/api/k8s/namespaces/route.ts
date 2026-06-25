import { NextResponse } from 'next/server'
import { isContextAllowed, getNamespacesForContext } from '@/lib/k8s-allowlist'
import { apiError } from '@/lib/api-error'

export async function GET(req: Request) {
  const context = new URL(req.url).searchParams.get('context') ?? ''
  if (!context) return NextResponse.json({ error: 'context required' }, { status: 400 })
  try {
    if (!isContextAllowed(context)) return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
    return NextResponse.json(getNamespacesForContext(context))
  } catch (err) {
    return apiError(err, `GET /api/k8s/namespaces context=${context}`, 503)
  }
}
