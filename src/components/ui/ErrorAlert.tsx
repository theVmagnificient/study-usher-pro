import { AlertCircle, WifiOff, ServerCrash, Clock, ShieldAlert, Loader2, RefreshCw } from 'lucide-react'
import { Button } from './button'
import { ApiErrorType, type ApiError } from '@/lib/api/client'

interface Props {
  error: string | ApiError | null
  showRetry?: boolean
  retrying?: boolean
  onRetry?: () => void
}

export function ErrorAlert({ error, showRetry = true, retrying = false, onRetry }: Props) {
  if (!error) return null

  const errorType = typeof error === 'string' ? ApiErrorType.UNKNOWN : (error as ApiError).type

  const title = (() => {
    switch (errorType) {
      case ApiErrorType.NETWORK: return 'Connection Problem'
      case ApiErrorType.SERVER: return 'Server Error'
      case ApiErrorType.TIMEOUT: return 'Request Timeout'
      case ApiErrorType.UNAUTHORIZED: return 'Authorization Required'
      case ApiErrorType.NOT_FOUND: return 'Not Found'
      case ApiErrorType.VALIDATION: return 'Validation Error'
      default: return 'Error'
    }
  })()

  const Icon = (() => {
    switch (errorType) {
      case ApiErrorType.NETWORK: return WifiOff
      case ApiErrorType.SERVER: return ServerCrash
      case ApiErrorType.TIMEOUT: return Clock
      case ApiErrorType.UNAUTHORIZED: return ShieldAlert
      default: return AlertCircle
    }
  })()

  const alertClasses = (() => {
    switch (errorType) {
      case ApiErrorType.NETWORK: return 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/20'
      case ApiErrorType.UNAUTHORIZED: return 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/20'
      default: return 'border-l-destructive bg-destructive/10'
    }
  })()

  const iconClasses = (() => {
    switch (errorType) {
      case ApiErrorType.NETWORK: return 'text-amber-600 dark:text-amber-500'
      case ApiErrorType.UNAUTHORIZED: return 'text-orange-600 dark:text-orange-500'
      default: return 'text-destructive'
    }
  })()

  const titleClasses = (() => {
    switch (errorType) {
      case ApiErrorType.NETWORK: return 'text-amber-900 dark:text-amber-300'
      case ApiErrorType.UNAUTHORIZED: return 'text-orange-900 dark:text-orange-300'
      default: return 'text-destructive'
    }
  })()

  const messageClasses = (() => {
    switch (errorType) {
      case ApiErrorType.NETWORK: return 'text-amber-800 dark:text-amber-400'
      case ApiErrorType.UNAUTHORIZED: return 'text-orange-800 dark:text-orange-400'
      default: return 'text-destructive/90'
    }
  })()

  const message = typeof error === 'string' ? error : (error as ApiError).message

  return (
    <div className={`clinical-card p-4 border-l-4 ${alertClasses}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconClasses}`} />
        <div className="flex-1">
          <h4 className={`text-sm font-semibold mb-1 ${titleClasses}`}>{title}</h4>
          <p className={`text-sm ${messageClasses}`}>{message}</p>
          {showRetry && onRetry && (
            <div className="mt-3">
              <Button variant="outline" size="sm" onClick={onRetry} disabled={retrying}>
                {retrying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                {retrying ? 'Retrying...' : 'Try Again'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
