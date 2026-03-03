import axios from 'axios'

export interface SessionUser {
  id: number
  firstname: string
  lastname: string
  email: string
  role: string
}

const ST_DOMAIN = import.meta.env.VITE_ST_DOMAIN?.replace(/\/$/, '') || ''
const ST_BASE_PATH = import.meta.env.VITE_ST_API_BASE_PATH || '/auth'

// Storage keys
const ACCESS_TOKEN_KEY = 'st-access-token'
const REFRESH_TOKEN_KEY = 'st-refresh-token'

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

function saveTokensFromResponse(headers: Record<string, string>) {
  const accessToken = headers['st-access-token']
  const refreshToken = headers['st-refresh-token']
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

function clearStoredTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem('st-last-access-token-update')
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeJwtPayload(token)
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

export const superTokensAuthService = {
  async signIn(username: string, password: string) {
    // Make sign-in call directly to capture response headers with tokens
    const response = await axios.post(
      `${ST_DOMAIN}${ST_BASE_PATH}/signin`,
      {
        formFields: [
          { id: 'email', value: username },
          { id: 'password', value: password },
        ],
      },
      {
        headers: { 'Content-Type': 'application/json', rid: 'emailpassword' },
        withCredentials: true,
      }
    )

    const data = response.data

    if (data.status === 'OK') {
      // Save tokens from response headers
      saveTokensFromResponse(response.headers as Record<string, string>)
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

  async user(): Promise<SessionUser> {
    const token = getStoredAccessToken()
    if (!token) throw Error('No session exists')

    const payload = decodeJwtPayload(token)
    return {
      id: payload?.user_id,
      firstname: payload?.first_name,
      lastname: payload?.last_name,
      email: payload?.email,
      role: payload?.role,
    }
  },

  async signOut() {
    clearStoredTokens()
  },

  async refresh() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (!refreshToken) return

    try {
      const response = await axios.post(
        `${ST_DOMAIN}${ST_BASE_PATH}/session/refresh`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${refreshToken}`,
          },
          withCredentials: true,
        }
      )
      saveTokensFromResponse(response.headers as Record<string, string>)
    } catch {
      clearStoredTokens()
    }
  },

  async expired() {
    const token = getStoredAccessToken()
    if (!token) return true
    return isTokenExpired(token)
  },

  getAccessToken(): string | null {
    return getStoredAccessToken()
  },
}
