import { NextResponse } from 'next/server'
import { listRunningContainers, isLocalDockerEnabled } from '@/lib/docker-client'
import { apiError } from '@/lib/api-error'

export async function GET() {
  if (!isLocalDockerEnabled()) {
    return NextResponse.json({ error: 'Local Docker disabled' }, { status: 403 })
  }
  try {
    const containers = await listRunningContainers()
    return NextResponse.json(containers)
  } catch (err) {
    return apiError(err, 'GET /api/containers', 503)
  }
}
