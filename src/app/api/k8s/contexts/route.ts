import { NextResponse } from 'next/server'
import { listContexts } from '@/lib/k8s-client'

export async function GET() {
  try {
    const contexts = listContexts()
    return NextResponse.json(contexts)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 503 })
  }
}
