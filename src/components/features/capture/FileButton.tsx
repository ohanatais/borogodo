'use client'

import { useRef } from 'react'
import type { LucideIcon } from 'lucide-react'

interface FileButtonProps {
  accept: string
  icon: LucideIcon
  ariaLabel: string
  onFile: (file: File) => void
}

export function FileButton({ accept, icon: Icon, ariaLabel, onFile }: FileButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) onFile(file)
    event.target.value = ''
  }

  return (
    <>
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => inputRef.current?.click()}
        className="p-2 rounded-full transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
        style={{ color: 'var(--muted-foreground)' }}
      >
        <Icon size={20} />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="sr-only"
        tabIndex={-1}
      />
    </>
  )
}
