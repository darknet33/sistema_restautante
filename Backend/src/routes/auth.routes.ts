import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { login, createUser, getUsers, updateUser, deleteUser } from '../controllers/auth.controller'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
})

router.post('/login', loginLimiter, login)
router.post('/users', authenticate, authorize('ADMIN'), createUser)
router.get('/users', authenticate, authorize('ADMIN'), getUsers)
router.put('/users/:id', authenticate, authorize('ADMIN'), updateUser)
router.delete('/users/:id', authenticate, authorize('ADMIN'), deleteUser)

export default router
