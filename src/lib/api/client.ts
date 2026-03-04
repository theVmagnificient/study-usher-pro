import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosError } from 'axios'
import Session from 'supertokens-web-js/recipe/session'


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


export const isOnline = () => {
  return navigator.onLine
}


// Request interceptor: inject SuperTokens access token as Bearer header
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (!isOnline()) {
      return Promise.reject({
        type: ApiErrorType.NETWORK,
        message: 'You appear to be offline. Please check your internet connection.',
      } as ApiError)
    }

    // Get the access token from SuperTokens and attach as Authorization header
    try {
      const accessToken = await Session.getAccessToken()
      if (accessToken && config.headers) {
        config.headers['Authorization'] = `Bearer ${accessToken}`
      }
    } catch {
      // No active session — let the request proceed without auth header
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)


// Response interceptor: retry logic + error formatting
apiClient.interceptors.response.use(
  (response) => {
    const requestKey = `${response.config.method}:${response.config.url}`
    retryCountMap.delete(requestKey)
    return response
  },
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Handle 401 — attempt token refresh via SuperTokens
    if (error.response?.status === 401 && config && !config._retry) {
      config._retry = true
      try {
        const refreshed = await Session.attemptRefreshingSession()
        if (refreshed) {
          // Re-inject the new access token
          const newToken = await Session.getAccessToken()
          if (newToken && config.headers) {
            config.headers['Authorization'] = `Bearer ${newToken}`
          }
          return apiClient.request(config)
        }
      } catch {
        // Refresh failed — fall through to error handling
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

    const apiError = formatError(error)
    return Promise.reject(apiError)
  }
)


function shouldRetry(error: AxiosError, config: InternalAxiosRequestConfig & { _retry?: boolean }): boolean {
  if (config._retry) {
    return false
  }

  if (config.method && !['get', 'head', 'options'].includes(config.method.toLowerCase())) {
    return false
  }

  if (!error.response) {
    return true
  }

  if (error.response && RETRY_STATUS_CODES.includes(error.response.status)) {
    return true
  }

  return false
}


function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}


function formatError(error: AxiosError): ApiError {
  if (error.code === 'ECONNABORTED') {
    return {
      type: ApiErrorType.TIMEOUT,
      message: 'Request timed out. The server is taking too long to respond.',
      statusCode: 408,
    }
  }

  if (!error.response) {
    return {
      type: ApiErrorType.NETWORK,
      message: 'Unable to connect to the server. Please check your internet connection.',
    }
  }

  const status = error.response.status
  const data = error.response.data as any

  switch (status) {
    case 401:
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      return {
        type: ApiErrorType.UNAUTHORIZED,
        message: 'You are not authorized to perform this action. Please log in again.',
        statusCode: status,
      }

    case 404:
      return {
        type: ApiErrorType.NOT_FOUND,
        message: data?.detail || 'The requested resource was not found.',
        statusCode: status,
      }

    case 422:
      return {
        type: ApiErrorType.VALIDATION,
        message: data?.detail || 'The data provided is invalid. Please check and try again.',
        statusCode: status,
        details: data,
      }

    case 500:
    case 502:
    case 503:
    case 504:
      return {
        type: ApiErrorType.SERVER,
        message: 'The server encountered an error. Please try again later.',
        statusCode: status,
      }

    default:
      return {
        type: ApiErrorType.UNKNOWN,
        message: data?.detail || data?.message || 'An unexpected error occurred.',
        statusCode: status,
        details: data,
      }
  }
}


if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Connection restored')
  })

  window.addEventListener('offline', () => {
    console.log('Connection lost')
  })
}

export default apiClient
