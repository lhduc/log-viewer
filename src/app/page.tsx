'use client'

import { useState } from 'react'
import { Bookmark } from 'lucide-react'
import { useSource } from '@/contexts/source-context'
import { useBookmarks } from '@/contexts/bookmark-context'
import { ContainerTabs } from '@/components/container-tabs'
import { K8sContainerTabs } from '@/components/k8s-container-tabs'
import { SourceSwitcher } from '@/components/source-switcher'
import { SettingsMenu } from '@/components/settings-menu'
import { ThemeToggle } from '@/components/theme-toggle'
import { TimeModeToggle } from '@/components/time-mode-toggle'
import { BookmarkDialog } from '@/components/bookmark-panel'

function MainContent() {
  const { mode } = useSource()
  return mode === 'k8s' ? <K8sContainerTabs /> : <ContainerTabs />
}

function BookmarkButton() {
  const { bookmarks } = useBookmarks()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative h-6 w-6 flex items-center justify-center rounded text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 transition-colors"
        aria-label="Bookmarks"
      >
        <Bookmark size={15} />
        {bookmarks.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 flex items-center justify-center rounded-full bg-primary-foreground text-primary text-[8px] font-bold leading-none">
            {bookmarks.length > 9 ? '9+' : bookmarks.length}
          </span>
        )}
      </button>
      <BookmarkDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="shrink-0 flex items-center gap-2 px-4 h-10 border-b border-primary/20 bg-primary text-primary-foreground">
        <span className="text-sm font-semibold flex items-center gap-1.5">
          Log Viewer
        </span>
        <div className="flex-1" />
        <SourceSwitcher />
        <TimeModeToggle />
        <BookmarkButton />
        <ThemeToggle />
        <SettingsMenu />
      </header>
      <div className="flex-1 min-h-0">
        <MainContent />
      </div>
      <footer className="shrink-0 flex items-center justify-center px-4 h-7 border-t border-border bg-muted text-[10px] text-muted-foreground">
        Maintainer: Duc Le (lehongduc87@gmail.com)
      </footer>
    </div>
  )
}
