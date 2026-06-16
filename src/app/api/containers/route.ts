import { NextResponse } from 'next/server'
import { listRunningContainers } from '@/lib/docker-client'

export async function GET() {
  try {
    const containers = await listRunningContainers()
    return NextResponse.json(containers)
  } catch {
    return NextResponse.json(
      { error: 'Cannot connect to Docker daemon. Is Docker running?' },
      { status: 503 }
    )
  }
}
