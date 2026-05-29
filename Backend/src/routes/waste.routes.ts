import { Router } from 'express'
import { getAll, create } from '../controllers/waste.controller'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

router.get('/', authenticate, authorize('ADMIN'), getAll)
router.post('/', authenticate, authorize('ADMIN'), create)

export default router
