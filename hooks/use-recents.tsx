"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react"

type Recent = { id: string; when: number }

type RecentsContextValue = {
  recents: Recent[]
  markOpened: (id: string) => void
}

/* ----------  shared context ---------- */
export const RecentsContext = createContext<RecentsContextValue | undefined>(
  undefined
)

/* ----------  provider ---------- */
export function RecentsProvider({ children }: { children: React.ReactNode }): React.ReactNode {
  const [recents, setRecents] = useState<Recent[]>([])

  /** add / move an item to the top, keep max 5 */
  const markOpened = useCallback((id: string) => {
    setRecents(prev => {
      const now = Date.now()
      const without = prev.filter(r => r.id !== id)
      return [{ id, when: now }, ...without].slice(0, 5)
    })
  }, [])

  return (
    <RecentsContext.Provider value={{ recents, markOpened }}>
      {children}
    </RecentsContext.Provider>
  )
}

/* ----------  hook ---------- */
export function useRecents() {
  const ctx = useContext(RecentsContext)
  if (!ctx) {
    throw new Error("useRecents must be used inside <RecentsProvider />")
  }
  return ctx
}
