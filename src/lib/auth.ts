export const AUTH_COOKIE_NAME = 'songhub_auth'
export const AUTH_COOKIE_VALUE = 'ok'

export const LOGIN_USERNAME = 'admin'
export const LOGIN_PASSWORD = 'geheim'

export const isValidCredentials = (username?: string, password?: string): boolean => {
  return username === LOGIN_USERNAME && password === LOGIN_PASSWORD
}
