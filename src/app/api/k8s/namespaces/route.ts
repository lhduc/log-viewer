import { NextResponse } from 'next/server'
import { listNamespaces } from '@/lib/k8s-client'
import { apiError } from '@/lib/api-error'

export async function GET(req: Request) {
  const context = new URL(req.url).searchParams.get('context') ?? ''
  if (!context) return NextResponse.json({ error: 'context required' }, { status: 400 })
  try {
    const namespaces = await listNamespaces(context)
    return NextResponse.json(namespaces)
  } catch (err) {
    return apiError(err, `GET /api/k8s/namespaces context=${context}`, 503)
  }
}
