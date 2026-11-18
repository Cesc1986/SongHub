import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { issueSession, verifySession, SESSION_AGE } from '../src/lib/session.ts'

const key = randomBytes(32).toString('hex')

test('signed sessions preserve identity and role until expiry', async () => {
  for (const role of ['user', 'admin']) {
    const token = await issueSession('Müller', role, key, 100)
    assert.deepEqual(await verifySession(token, key, 99 + SESSION_AGE), { username: 'Müller', role })
    assert.equal(await verifySession(token, key, 100 + SESSION_AGE), null)
    assert.equal(await verifySession(token, randomBytes(32).toString('hex'), 100), null)
  }
})

test('invalid sessions and unconfigured signers are rejected', async () => {
  assert.equal(await verifySession(undefined, key), null)
  assert.equal(await verifySession('invalid', key), null)
  assert.equal(await verifySession(await issueSession('test-user', 'user', key), ''), null)
  await assert.rejects(issueSession('test-user', 'user', ''), /Missing session signing key/)
  await assert.rejects(issueSession('a'.repeat(2048), 'user', key), /Session identity is too large/)
})
