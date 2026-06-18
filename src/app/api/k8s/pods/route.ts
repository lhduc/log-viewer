import { NextResponse } from 'next/server'
import { listPods } from '@/lib/k8s-client'

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams
  const context = params.get('context') ?? ''
  const namespace = params.get('namespace') ?? ''
  if (!context || !namespace) return NextResponse.json({ error: 'context and namespace required' }, { status: 400 })
  try {
    const pods = await listPods(context, namespace)
    return NextResponse.json(pods)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 503 })
  }
}
