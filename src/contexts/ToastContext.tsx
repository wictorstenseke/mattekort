import { createContext } from 'preact'
import { useContext, useState, useCallback } from 'preact/hooks'

export interface Toast {
  id: number
  message: string
}

type ToastContextValue = {
  toasts: Toast[]
  addToast: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TOAST_DURATION_MS = 2500
let nextId = 0

export function ToastProvider({ children }: { children: preact.ComponentChildren }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string) => {
    const id = ++nextId
    setToasts((prev) => [...prev, { id, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, TOAST_DURATION_MS)
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

function ToastContainer() {
  const ctx = useContext(ToastContext)
  if (!ctx) return null
  const { toasts } = ctx
  if (toasts.length === 0) return null

  return (
    <div class="toast-stack" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} class="toast-notification">
          <span class="toast-notification-icon" aria-hidden="true">ℹ️</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
