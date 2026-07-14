import { Router, type RequestHandler } from 'express'
import { errorMessage } from '../http.ts'
import { parseDatacentersResponse } from './schema.ts'
import { loadDatacenters } from './service.ts'

export const infraRouter = Router()

const getDatacenters: RequestHandler = (_req, res) => {
  try {
    const data = loadDatacenters()
    const payload = parseDatacentersResponse(data)

    if (!payload.success) {
      res.status(502).json({ error: 'Invalid datacenters payload' })
      return
    }

    res.status(200).json(payload.data)
  } catch (error) {
    res.status(502).json({
      error: errorMessage(error, 'Failed to load datacenters'),
    })
  }
}

infraRouter
  .route('/datacenters')
  .get(getDatacenters)
  .post(getDatacenters)
  .patch(getDatacenters)
  .put(getDatacenters)
