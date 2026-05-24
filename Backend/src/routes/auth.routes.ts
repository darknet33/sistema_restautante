import { Router } from 'express'
import { login, createUser } from '../controllers/auth.controller'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

router.post('/login', login)
router.post('/users', authenticate, authorize('ADMIN', 'CAJERO'), createUser)

export default router
