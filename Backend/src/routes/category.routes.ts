import { Router } from 'express'
import { getAll, create } from '../controllers/category.controller'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

router.get('/', authenticate, getAll)
router.post('/', authenticate, authorize('ADMIN'), create)

export default router
