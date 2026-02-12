import { signIn, signOut } from 'supertokens-web-js/recipe/emailpassword'
import Session from 'supertokens-web-js/recipe/session'

export const superTokensAuthService = {
  async signIn(username: string, password: string): Promise<void> {
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

  async signOut(): Promise<void> {
    await signOut()
    await Session.signOut()
  },

  async refresh(): Promise<void> {
    await Session.attemptRefreshingSession()
  },

  async expired(): Promise<boolean> {
    return !await Session.doesSessionExist()
  },
}
