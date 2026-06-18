import { NextResponse } from 'next/server'
import { listNamespaces } from '@/lib/k8s-client'

export async function GET(req: Request) {
  const context = new URL(req.url).searchParams.get('context') ?? ''
  if (!context) return NextResponse.json({ error: 'context required' }, { status: 400 })
  try {
    const namespaces = await listNamespaces(context)
    return NextResponse.json(namespaces)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 503 })
  }
}
