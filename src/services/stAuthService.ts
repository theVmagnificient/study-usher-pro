import { signIn, signOut } from 'supertokens-web-js/recipe/emailpassword'
import Session from 'supertokens-web-js/recipe/session'

export interface SessionUser {
  id: number
  firstname: string
  lastname: string
  email: string
  role: string
}

// In-memory cache for user payload after sign-in
// (workaround for cross-origin cookie issues where front-token can't be persisted)
let cachedPayload: Record<string, any> | null = null

export const superTokensAuthService = {
  async signIn(username: string, password: string) {
    const response = await signIn({
      formFields: [{ id: 'email', value: username }, { id: 'password', value: password }],
    })

    if (response.status === 'OK') {
      // Try to cache the access token payload right after sign-in
      // while it's still in memory
      try {
        cachedPayload = await Session.getAccessTokenPayloadSecurely()
      } catch {
        // If it fails, we'll try again later
        cachedPayload = null
      }
      return
    }

    if (response.status === 'FIELD_ERROR') {
      const msg = response.formFields.map(ff => `${ff.id}: ${ff.error}`).join('\n')
      throw Error(msg)
    } else if (response.status === 'WRONG_CREDENTIALS_ERROR') {
      throw Error('Wrong credentials')
    } else {
      throw Error('Sign In operation failed')
    }
  },

  async user(): Promise<SessionUser> {
    // Use cached payload if available (for cross-origin scenarios)
    let payload = cachedPayload
    if (!payload) {
      try {
        payload = await Session.getAccessTokenPayloadSecurely()
      } catch {
        throw Error('No session exists')
      }
    }
    return {
      id: payload?.user_id,
      firstname: payload?.first_name,
      lastname: payload?.last_name,
      email: payload?.email,
      role: payload?.role,
    }
  },

  async signOut() {
    cachedPayload = null
    try {
      await signOut()
      await Session.signOut()
    } catch {
      // Ignore errors during sign-out (session may already be invalid)
    }
  },

  async refresh() {
    await Session.attemptRefreshingSession()
  },

  async expired() {
    // First check if we have a cached payload (from recent sign-in)
    if (cachedPayload) return false
    // Then try the SDK method, but catch errors from cookie issues
    try {
      return !await Session.doesSessionExist()
    } catch {
      return true
    }
  },
}
