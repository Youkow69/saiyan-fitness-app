// src/hooks/useUndoStack.ts
// Simple undo stack for set logger actions

import { useState, useCallback } from 'react'

interface UndoEntry {
  type: 'delete_set'
  exerciseId: string
  setIndex: number
  setData: any
  timestamp: number
}

const MAX_UNDO = 5

export function useUndoStack() {
  const [stack, setStack] = useState<UndoEntry[]>([])

  const pushUndo = useCallback((entry: Omit<UndoEntry, 'timestamp'>) => {
    setStack(prev => [...prev.slice(-(MAX_UNDO - 1)), { ...entry, timestamp: Date.now() }])
  }, [])

  const popUndo = useCallback((): UndoEntry | null => {
    let popped: UndoEntry | null = null
    setStack(prev => {
      if (prev.length === 0) return prev
      popped = prev[prev.length - 1]
      return prev.slice(0, -1)
    })
    return popped
  }, [])

  const canUndo = stack.length > 0

  return { pushUndo, popUndo, canUndo, undoCount: stack.length }
}
