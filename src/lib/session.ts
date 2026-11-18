export type UserRole = 'user' | 'admin'
export const SESSION_AGE = 7 * 86400
const MAX_TOKEN_LENGTH = 2048
const bytes = new TextEncoder()
const encode = (a: Uint8Array) => btoa(String.fromCharCode(...a)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const decode = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
const hmac = (secret: string) => crypto.subtle.importKey('raw', bytes.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
const now = () => Math.floor(Date.now() / 1000)

export async function issueSession(username: string, role: UserRole, secret: string, time = now()) {
  if (secret.length < 32) throw new Error('Missing session signing key')
  const data = bytes.encode(JSON.stringify({ username, role, exp: time + SESSION_AGE }))
  if (Math.ceil(data.length * 4 / 3) + 44 > MAX_TOKEN_LENGTH) throw new Error('Session identity is too large')
  const payload = encode(data)
  const signature = await crypto.subtle.sign('HMAC', await hmac(secret), bytes.encode(payload))
  return `${payload}.${encode(new Uint8Array(signature))}`
}

export async function verifySession(token: string | undefined, secret: string, time = now()): Promise<{ username: string; role: UserRole } | null> {
  if (!token || secret.length < 32 || token.length > MAX_TOKEN_LENGTH || !/^[\w-]+\.[\w-]{43}$/.test(token)) return null
  try {
    const [payload, signature] = token.split('.')
    if (!await crypto.subtle.verify('HMAC', await hmac(secret), decode(signature), bytes.encode(payload))) return null
    const { username, role, exp } = JSON.parse(new TextDecoder().decode(decode(payload)))
    if (!Number.isSafeInteger(exp) || exp <= time || typeof username !== 'string' || !username || (role !== 'user' && role !== 'admin')) return null
    return { username, role }
  } catch {
    return null
  }
}
