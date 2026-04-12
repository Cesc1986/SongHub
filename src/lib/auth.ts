export const AUTH_COOKIE_NAME = 'songhub_auth'
export const AUTH_COOKIE_VALUE = 'ok'

export const LOGIN_USERNAME = process.env.SONGHUB_LOGIN_USERNAME ?? ''
export const LOGIN_PASSWORD = process.env.SONGHUB_LOGIN_PASSWORD ?? ''

export const isValidCredentials = (username?: string, password?: string): boolean => {
  if (!LOGIN_USERNAME || !LOGIN_PASSWORD) return false
  return username === LOGIN_USERNAME && password === LOGIN_PASSWORD
}
