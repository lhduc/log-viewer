import { ContainerTabs } from '@/components/container-tabs'
import { ThemeToggle } from '@/components/theme-toggle'
import { TimeModeToggle } from '@/components/time-mode-toggle'
import { ConnectionStatusIndicator } from '@/components/connection-status-indicator'

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="shrink-0 flex items-center gap-2 px-4 h-10 border-b border-primary/20 bg-primary text-primary-foreground">
        <span className="text-sm font-semibold flex items-center gap-1.5">
          <span className="text-base leading-none">≡</span>
          Log Viewer
        </span>
        <div className="flex-1" />
        <ConnectionStatusIndicator />
        <TimeModeToggle />
        <ThemeToggle />
      </header>
      <div className="flex-1 min-h-0">
        <ContainerTabs />
      </div>
      <footer className="shrink-0 flex items-center justify-center px-4 h-7 border-t border-border bg-muted text-[10px] text-muted-foreground">
        Maintainer: Duc Le (lehongduc87@gmail.com)
      </footer>
    </div>
  )
}
