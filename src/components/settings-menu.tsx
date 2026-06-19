'use client'

import { useState, useRef } from 'react'
import { X } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useSettings } from '@/contexts/settings-context'

export function ExcludedUrlsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { excludedUrls, addExcludedUrl, removeExcludedUrl } = useSettings()
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAdd = () => {
    if (!input.trim()) return
    addExcludedUrl(input.trim())
    setInput('')
    inputRef.current?.focus()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm gap-0 p-7 rounded-2xl" showCloseButton={false}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <DialogTitle>Excluded URLs</DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        {/* Current patterns */}
        <p className="text-sm font-semibold text-foreground mb-2">Current patterns</p>
        <div className="flex flex-col gap-1.5 mb-5 max-h-44 overflow-y-auto">
          {excludedUrls.length === 0 && (
            <p className="text-sm text-muted-foreground py-3 text-center">No patterns added</p>
          )}
          {excludedUrls.map(url => (
            <div key={url} className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-muted group">
              <span className="flex-1 text-sm font-mono truncate">{url}</span>
              <button
                onClick={() => removeExcludedUrl(url)}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Remove"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* Add pattern */}
        <p className="text-sm font-semibold text-foreground mb-2">Add pattern</p>
        <Input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="/api/health"
          className="h-11 text-sm font-mono mb-4 bg-muted border-0 focus-visible:ring-0 focus-visible:border-ring"
        />
        <Button
          onClick={handleAdd}
          disabled={!input.trim()}
          className="w-full h-11 rounded-full text-sm font-semibold"
        >
          Add URL
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export function SettingsMenu() {
  return (
    <Avatar size="sm" className="opacity-80">
      <AvatarFallback className="bg-white/20 text-primary-foreground text-[10px] font-semibold">DL</AvatarFallback>
    </Avatar>
  )
}
