'use client'

import { useState } from 'react'
import { Bookmark } from 'lucide-react'
import { useSource } from '@/contexts/source-context'
import { useBookmarks } from '@/contexts/bookmark-context'
import { ContainerTabs } from '@/components/container-tabs'
import { K8sContainerTabs } from '@/components/k8s-container-tabs'
import { BookmarkView } from '@/components/bookmark-panel'
import { SourceSwitcher } from '@/components/source-switcher'
import { SettingsMenu } from '@/components/settings-menu'
import { ThemeToggle } from '@/components/theme-toggle'
import { TimeModeToggle } from '@/components/time-mode-toggle'
import { cn } from '@/lib/utils'

function LogContent() {
  const { mode } = useSource()
  return mode === 'k8s' ? <K8sContainerTabs /> : <ContainerTabs />
}

export default function Home() {
  const { records: bookmarks } = useBookmarks()
  const [showBookmarks, setShowBookmarks] = useState(false)

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 h-10 border-b border-primary/20 bg-primary text-primary-foreground">
        <span className="text-sm font-semibold hidden sm:flex items-center gap-1.5">
          Log Viewer
        </span>
        <div className="sm:ml-auto">
          <SourceSwitcher />
        </div>
        <TimeModeToggle />
        <button
          onClick={() => setShowBookmarks(v => !v)}
          className={cn(
            'relative h-6 w-6 flex items-center justify-center rounded transition-colors',
            showBookmarks
              ? 'text-primary-foreground bg-white/20'
              : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10'
          )}
          aria-label="Bookmarks"
        >
          <Bookmark size={15} />
          {bookmarks.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 flex items-center justify-center rounded-full bg-primary-foreground text-primary text-[8px] font-bold leading-none">
              {bookmarks.length > 9 ? '9+' : bookmarks.length}
            </span>
          )}
        </button>
        <ThemeToggle />
        <SettingsMenu />
      </header>

      <div className="flex-1 min-h-0">
        {showBookmarks
          ? <BookmarkView onClose={() => setShowBookmarks(false)} />
          : <LogContent />
        }
      </div>

      <footer className="shrink-0 flex items-center justify-center px-4 h-7 border-t border-border bg-muted text-[10px] text-muted-foreground">
        Maintainer: Duc Le (lehongduc87@gmail.com)
      </footer>
    </div>
  )
}
