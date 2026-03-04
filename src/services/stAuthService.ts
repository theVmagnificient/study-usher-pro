import { signIn, signOut } from 'supertokens-web-js/recipe/emailpassword'
import Session from 'supertokens-web-js/recipe/session'

export interface SessionUser {
  id: number
  firstname: string
  lastname: string
  email: string
  role: string
}

export const superTokensAuthService = {
  async signIn(username: string, password: string) {
    const response = await signIn({
      formFields: [{ id: 'email', value: username }, { id: 'password', value: password }],
    })

    if (response.status === 'OK') {
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
    return Session.getAccessTokenPayloadSecurely()
      .then(payload => ({
        id: payload?.user_id,
        firstname: payload?.first_name,
        lastname: payload?.last_name,
        email: payload?.email,
        role: payload?.role,
      }))
  },

  async signOut() {
    await signOut()
    await Session.signOut()
  },

  async refresh() {
    await Session.attemptRefreshingSession()
  },

  async expired() {
    return !await Session.doesSessionExist()
  },
}
