import { NextResponse } from 'next/server'
import { listContexts } from '@/lib/k8s-client'
import { apiError } from '@/lib/api-error'

export async function GET() {
  try {
    const contexts = listContexts()
    return NextResponse.json(contexts)
  } catch (err) {
    return apiError(err, 'GET /api/k8s/contexts', 503)
  }
}
