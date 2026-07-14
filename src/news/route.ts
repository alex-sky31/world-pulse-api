import { Router, type RequestHandler } from 'express'
import { errorMessage } from '../http.ts'
import type { NewsCategory } from './schema.ts'
import { parseNewsArticlesResponse } from './schema.ts'
import { loadArticles } from './service.ts'

export const newsRouter = Router()

async function respondWithCategory(
  category: NewsCategory,
  res: Parameters<RequestHandler>[1],
) {
  try {
    const articles = await loadArticles(category)
    const payload = parseNewsArticlesResponse({ articles })

    if (!payload.success) {
      res.status(502).json({
        error: 'Invalid news articles payload',
      })
      return
    }

    res.status(200).json(payload.data)
  } catch (error) {
    res.status(502).json({
      error: errorMessage(error, 'Failed to load news articles'),
    })
  }
}

const getWorld: RequestHandler = async (_req, res) => {
  await respondWithCategory('world', res)
}

const getTech: RequestHandler = async (_req, res) => {
  await respondWithCategory('tech', res)
}

function registerRoute(path: string, handler: RequestHandler) {
  newsRouter.route(path).get(handler).post(handler).patch(handler).put(handler)
}

registerRoute('/world', getWorld)
registerRoute('/tech', getTech)
