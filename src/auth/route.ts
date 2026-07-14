import { Router, type RequestHandler } from 'express'
import { errorMessage } from '../http.ts'
import { parseAuthResponse, parseLoginBody, parseRegisterBody } from './schema.ts'
import { loginUser, registerUser } from './service.ts'

export const authRouter = Router()

function validationError(res: Parameters<RequestHandler>[1], details: unknown) {
  res.status(400).json({ error: 'Invalid request body', details })
}

const register: RequestHandler = async (req, res) => {
  const body = parseRegisterBody(req.body)
  if (!body.success) {
    validationError(res, body.error.flatten())
    return
  }

  try {
    const data = await registerUser(body.data)
    const payload = parseAuthResponse(data)
    if (!payload.success) {
      res.status(502).json({ error: 'Invalid auth response' })
      return
    }
    res.status(201).json(payload.data)
  } catch (error) {
    if (error instanceof Error && error.message === 'EMAIL_ALREADY_EXISTS') {
      res.status(409).json({ error: 'Email already registered' })
      return
    }
    if (error instanceof Error && error.message === 'JWT_SECRET is not configured') {
      res.status(503).json({ error: 'Authentication is not configured' })
      return
    }
    if (error instanceof Error && error.message === 'Database not configured') {
      res.status(503).json({ error: 'Database not configured' })
      return
    }
    res.status(502).json({
      error: errorMessage(error, 'Failed to register user'),
    })
  }
}

const login: RequestHandler = async (req, res) => {
  const body = parseLoginBody(req.body)
  if (!body.success) {
    validationError(res, body.error.flatten())
    return
  }

  try {
    const data = await loginUser(body.data)
    const payload = parseAuthResponse(data)
    if (!payload.success) {
      res.status(502).json({ error: 'Invalid auth response' })
      return
    }
    res.status(200).json(payload.data)
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }
    if (error instanceof Error && error.message === 'JWT_SECRET is not configured') {
      res.status(503).json({ error: 'Authentication is not configured' })
      return
    }
    if (error instanceof Error && error.message === 'Database not configured') {
      res.status(503).json({ error: 'Database not configured' })
      return
    }
    res.status(502).json({
      error: errorMessage(error, 'Failed to login'),
    })
  }
}

authRouter.post('/register', register)
authRouter.post('/login', login)
