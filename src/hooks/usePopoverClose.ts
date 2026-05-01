import { useEffect, useRef } from 'react'

export function usePopoverClose(
  open: boolean,
  onClose: () => void,
  ignoreSelector?: string,
) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return
      if (ignoreSelector) {
        const target = event.target as HTMLElement
        if (target.closest(ignoreSelector)) return
      }
      onClose()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, onClose, ignoreSelector])

  return rootRef
}
