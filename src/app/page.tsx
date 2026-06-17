import { ContainerTabs } from '@/components/container-tabs'
import { ThemeToggle } from '@/components/theme-toggle'
import { TimeModeToggle } from '@/components/time-mode-toggle'
import { ConnectionStatusIndicator } from '@/components/connection-status-indicator'

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="shrink-0 flex items-center gap-2 px-4 h-10 border-b border-border bg-muted">
        <span className="text-sm font-semibold">Log Viewer</span>
        <div className="flex-1" />
        <ConnectionStatusIndicator />
        <TimeModeToggle />
        <ThemeToggle />
      </header>
      <div className="flex-1 min-h-0">
        <ContainerTabs />
      </div>
    </div>
  )
}
