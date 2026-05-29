import { Router } from 'express'
import { login, createUser, getUsers, updateUser, deleteUser } from '../controllers/auth.controller'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

router.post('/login', login)
router.post('/users', authenticate, authorize('ADMIN'), createUser)
router.get('/users', authenticate, authorize('ADMIN'), getUsers)
router.put('/users/:id', authenticate, authorize('ADMIN'), updateUser)
router.delete('/users/:id', authenticate, authorize('ADMIN'), deleteUser)

export default router
