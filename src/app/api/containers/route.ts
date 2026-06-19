import { NextResponse } from 'next/server'
import { listRunningContainers } from '@/lib/docker-client'
import { apiError } from '@/lib/api-error'

export async function GET() {
  try {
    const containers = await listRunningContainers()
    return NextResponse.json(containers)
  } catch (err) {
    return apiError(err, 'GET /api/containers', 503)
  }
}
