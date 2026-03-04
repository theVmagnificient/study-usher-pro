/**
 * Auth service that bypasses SuperTokens SDK session management.
 *
 * The SuperTokens web SDK stores tokens in cookies internally (even with
 * tokenTransferMethod: 'header'), which fails in cross-origin iframe
 * environments like the Lovable preview.
 *
 * This service uses direct API calls, stores tokens in localStorage,
 * and decodes JWTs manually.
 */
import axios from 'axios'

export interface SessionUser {
  id: number
  firstname: string
  lastname: string
  email: string
  role: string
}

const TOKEN_KEYS = {
  access: 'st-access-token',
  refresh: 'st-refresh-token',
} as const

function getApiUrl(): string {
  const domain = import.meta.env.VITE_ST_DOMAIN || window.location.origin
  const basePath = import.meta.env.VITE_ST_API_BASE_PATH || '/api/v1/auth'
  return `${domain}${basePath}`
}

/** Decode a JWT payload without verification (client-side only) */
function decodeJwtPayload(token: string): Record<string, any> {
  const base64Url = token.split('.')[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  )
  return JSON.parse(jsonPayload)
}

function getStoredToken(key: keyof typeof TOKEN_KEYS): string | null {
  return localStorage.getItem(TOKEN_KEYS[key])
}

function setStoredToken(key: keyof typeof TOKEN_KEYS, value: string): void {
  localStorage.setItem(TOKEN_KEYS[key], value)
}

function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEYS.access)
  localStorage.removeItem(TOKEN_KEYS.refresh)
}

/** Extract and store tokens from response headers */
function extractTokensFromResponse(headers: Record<string, string>): void {
  const accessToken = headers['st-access-token']
  const refreshToken = headers['st-refresh-token']
  if (accessToken) setStoredToken('access', accessToken)
  if (refreshToken) setStoredToken('refresh', refreshToken)
}

/** Check if access token is expired */
function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeJwtPayload(token)
    // exp is in seconds, Date.now() is in milliseconds
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

export const superTokensAuthService = {
  async signIn(username: string, password: string): Promise<void> {
    const url = `${getApiUrl()}/signin`
    const response = await axios.post(
      url,
      {
        formFields: [
          { id: 'email', value: username },
          { id: 'password', value: password },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'rid': 'emailpassword',
          'st-auth-mode': 'header',
        },
      }
    )

    // Extract tokens from response headers
    extractTokensFromResponse(response.headers as Record<string, string>)

    const data = response.data
    if (data.status === 'OK') {
      return
    }
    if (data.status === 'FIELD_ERROR') {
      const msg = data.formFields.map((ff: any) => `${ff.id}: ${ff.error}`).join('\n')
      throw Error(msg)
    } else if (data.status === 'WRONG_CREDENTIALS_ERROR') {
      throw Error('Wrong credentials')
    } else {
      throw Error('Sign In operation failed')
    }
  },

  user(): SessionUser {
    const token = getStoredToken('access')
    if (!token) {
      throw Error('No access token found')
    }
    const payload = decodeJwtPayload(token)
    return {
      id: payload.user_id ?? payload.sub,
      firstname: payload.first_name ?? '',
      lastname: payload.last_name ?? '',
      email: payload.email ?? '',
      role: payload.role ?? '',
    }
  },

  async signOut(): Promise<void> {
    const accessToken = getStoredToken('access')
    if (accessToken) {
      try {
        const url = `${getApiUrl()}/signout`
        await axios.post(url, null, {
          headers: {
            'rid': 'session',
            'Authorization': `Bearer ${accessToken}`,
            'st-auth-mode': 'header',
          },
        })
      } catch {
        // Best-effort sign out
      }
    }
    clearTokens()
  },

  async refresh(): Promise<boolean> {
    const refreshToken = getStoredToken('refresh')
    if (!refreshToken) return false

    try {
      const url = `${getApiUrl()}/session/refresh`
      const response = await axios.post(url, null, {
        headers: {
          'rid': 'session',
          'Authorization': `Bearer ${refreshToken}`,
          'st-auth-mode': 'header',
        },
      })
      extractTokensFromResponse(response.headers as Record<string, string>)
      return true
    } catch {
      clearTokens()
      return false
    }
  },

  expired(): boolean {
    const token = getStoredToken('access')
    if (!token) return true
    return isTokenExpired(token)
  },

  /** Get the current access token, refreshing if expired */
  async getAccessToken(): Promise<string | null> {
    const token = getStoredToken('access')
    if (!token) return null

    if (!isTokenExpired(token)) return token

    // Try to refresh
    const refreshed = await this.refresh()
    if (refreshed) {
      return getStoredToken('access')
    }
    return null
  },
}
