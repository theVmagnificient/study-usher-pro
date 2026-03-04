import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosError } from 'axios'
import { superTokensAuthService } from '@/services/stAuthService'


export enum ApiErrorType {
  NETWORK = 'NETWORK',
  SERVER = 'SERVER',
  TIMEOUT = 'TIMEOUT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION = 'VALIDATION',
  UNKNOWN = 'UNKNOWN',
}

export interface ApiError {
  type: ApiErrorType
  message: string
  statusCode?: number
  details?: any
}


const MAX_RETRIES = 3
const RETRY_DELAY = 1000
const RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504]
const retryCountMap = new Map<string, number>()


export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})


export const isOnline = () => navigator.onLine


// Request interceptor: inject access token as Bearer header + st-auth-mode
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (!isOnline()) {
      return Promise.reject({
        type: ApiErrorType.NETWORK,
        message: 'You appear to be offline. Please check your internet connection.',
      } as ApiError)
    }

    const token = await superTokensAuthService.getAccessToken()
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`
      config.headers['st-auth-mode'] = 'header'
    }

    return config
  },
  (error) => Promise.reject(error)
)


// Response interceptor: handle 401 refresh + retries + error formatting
apiClient.interceptors.response.use(
  (response) => {
    const requestKey = `${response.config.method}:${response.config.url}`
    retryCountMap.delete(requestKey)
    return response
  },
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { _retryAuth?: boolean; _retry?: boolean }

    // 401 → attempt token refresh once
    if (error.response?.status === 401 && config && !config._retryAuth) {
      config._retryAuth = true
      const refreshed = await superTokensAuthService.refresh()
      if (refreshed) {
        const newToken = await superTokensAuthService.getAccessToken()
        if (newToken && config.headers) {
          config.headers['Authorization'] = `Bearer ${newToken}`
        }
        return apiClient.request(config)
      }
    }

    // Retry logic for idempotent requests
    if (config && shouldRetry(error, config)) {
      const requestKey = `${config.method}:${config.url}`
      const retryCount = retryCountMap.get(requestKey) || 0

      if (retryCount < MAX_RETRIES) {
        retryCountMap.set(requestKey, retryCount + 1)
        const delay = RETRY_DELAY * Math.pow(2, retryCount)
        await sleep(delay)
        config._retry = true
        console.log(`Retrying request (${retryCount + 1}/${MAX_RETRIES}): ${config.url}`)
        return apiClient.request(config)
      } else {
        retryCountMap.delete(requestKey)
      }
    }

    return Promise.reject(formatError(error))
  }
)


function shouldRetry(error: AxiosError, config: InternalAxiosRequestConfig & { _retry?: boolean }): boolean {
  if (config._retry) return false
  if (config.method && !['get', 'head', 'options'].includes(config.method.toLowerCase())) return false
  if (!error.response) return true
  if (RETRY_STATUS_CODES.includes(error.response.status)) return true
  return false
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function formatError(error: AxiosError): ApiError {
  if (error.code === 'ECONNABORTED') {
    return { type: ApiErrorType.TIMEOUT, message: 'Request timed out.', statusCode: 408 }
  }

  if (!error.response) {
    return { type: ApiErrorType.NETWORK, message: 'Unable to connect to the server.' }
  }

  const status = error.response.status
  const data = error.response.data as any

  switch (status) {
    case 401:
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      return { type: ApiErrorType.UNAUTHORIZED, message: 'Not authorized. Please log in again.', statusCode: status }
    case 404:
      return { type: ApiErrorType.NOT_FOUND, message: data?.detail || 'Resource not found.', statusCode: status }
    case 422:
      return { type: ApiErrorType.VALIDATION, message: data?.detail || 'Invalid data.', statusCode: status, details: data }
    case 500: case 502: case 503: case 504:
      return { type: ApiErrorType.SERVER, message: 'Server error. Please try again later.', statusCode: status }
    default:
      return { type: ApiErrorType.UNKNOWN, message: data?.detail || data?.message || 'Unexpected error.', statusCode: status, details: data }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => console.log('Connection restored'))
  window.addEventListener('offline', () => console.log('Connection lost'))
}

export default apiClient
