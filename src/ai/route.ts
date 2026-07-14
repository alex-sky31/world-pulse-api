import { Router, type RequestHandler } from 'express'
import { errorMessage } from '../http.ts'
import { parseAiModelsResponse } from './schema.ts'
import { loadAiModels } from './service.ts'

export const aiRouter = Router()

const getModels: RequestHandler = async (_req, res) => {
  if (!process.env.OPENROUTER_API_KEY) {
    res.status(503).json({
      error: 'Set OPENROUTER_API_KEY in .env to load AI model usage',
    })
    return
  }

  try {
    const data = await loadAiModels()
    const payload = parseAiModelsResponse(data)

    if (!payload.success) {
      res.status(502).json({ error: 'Invalid AI models payload' })
      return
    }

    res.status(200).json(payload.data)
  } catch (error) {
    res.status(502).json({
      error: errorMessage(error, 'Failed to load AI model rankings'),
    })
  }
}

aiRouter
  .route('/models')
  .get(getModels)
  .post(getModels)
  .patch(getModels)
  .put(getModels)
