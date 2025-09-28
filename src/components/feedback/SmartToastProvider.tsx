import { createContext, useContext, useState, ReactNode } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Toast {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface SmartToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void
  showSuccess: (title: string, message?: string) => void
  showError: (title: string, message?: string) => void
  showWarning: (title: string, message?: string) => void
  showInfo: (title: string, message?: string) => void
}

const SmartToastContext = createContext<SmartToastContextType | null>(null)

export function useSmartToast() {
  const context = useContext(SmartToastContext)
  if (!context) {
    throw new Error('useSmartToast must be used within SmartToastProvider')
  }
  return context
}

interface SmartToastProviderProps {
  children: ReactNode
}

export function SmartToastProvider({ children }: SmartToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2)
    const newToast = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])
    
    if (toast.duration !== 0) {
      setTimeout(() => removeToast(id), toast.duration || 5000)
    }
  }

  const showSuccess = (title: string, message?: string) => {
    showToast({ type: 'success', title, message })
  }

  const showError = (title: string, message?: string) => {
    showToast({ type: 'error', title, message, duration: 7000 })
  }

  const showWarning = (title: string, message?: string) => {
    showToast({ type: 'warning', title, message, duration: 6000 })
  }

  const showInfo = (title: string, message?: string) => {
    showToast({ type: 'info', title, message })
  }

  const getToastIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success': return CheckCircle
      case 'error': return XCircle
      case 'warning': return AlertTriangle
      case 'info': return Info
    }
  }

  const getToastStyles = (type: Toast['type']) => {
    switch (type) {
      case 'success': return 'border-success/20 bg-success/5 text-success-foreground'
      case 'error': return 'border-destructive/20 bg-destructive/5 text-destructive-foreground'
      case 'warning': return 'border-warning/20 bg-warning/5 text-warning-foreground'
      case 'info': return 'border-primary/20 bg-primary/5 text-primary-foreground'
    }
  }

  const getIconColor = (type: Toast['type']) => {
    switch (type) {
      case 'success': return 'text-success'
      case 'error': return 'text-destructive'
      case 'warning': return 'text-warning'
      case 'info': return 'text-primary'
    }
  }

  return (
    <SmartToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => {
          const Icon = getToastIcon(toast.type)
          
          return (
            <div
              key={toast.id}
              className={cn(
                "p-4 rounded-lg border shadow-lg animate-fade-in backdrop-blur-sm",
                "transform transition-all duration-300 hover:scale-105",
                getToastStyles(toast.type)
              )}
            >
              <div className="flex items-start gap-3">
                <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", getIconColor(toast.type))} />
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{toast.title}</h4>
                  {toast.message && (
                    <p className="text-xs mt-1 text-muted-foreground">{toast.message}</p>
                  )}
                  
                  {toast.action && (
                    <button
                      onClick={toast.action.onClick}
                      className="mt-2 text-xs font-medium underline hover:no-underline transition-all"
                    >
                      {toast.action.label}
                    </button>
                  )}
                </div>
                
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-sm hover:bg-muted/50"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </SmartToastContext.Provider>
  )
}