import type { NextApiRequest, NextApiResponse } from 'next'
import { isAdminRequest } from '../../../lib/auth'
import {
  listTrash,
  purgeTrashAll,
  purgeTrashById,
  restoreTrashById,
} from '../../../lib/audit'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdminRequest(req)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  if (req.method === 'GET') {
    return res.status(200).json({ items: listTrash() })
  }

  if (req.method === 'POST') {
    const { id } = req.body || {}
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'id required' })
    }

    const result = restoreTrashById(id)
    if (!result.success) {
      return res.status(400).json(result)
    }
    return res.status(200).json(result)
  }

  if (req.method === 'DELETE') {
    const id = req.query.id
    if (id && typeof id === 'string') {
      const result = purgeTrashById(id)
      return res.status(200).json(result)
    }

    const result = purgeTrashAll()
    return res.status(200).json(result)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
