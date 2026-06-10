import { Router } from 'express'
import { getAll, create, update, remove } from '../controllers/category.controller'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

router.get('/', authenticate, getAll)
router.post('/', authenticate, authorize('ADMIN'), create)
router.put('/:id', authenticate, authorize('ADMIN'), update)
router.delete('/:id', authenticate, authorize('ADMIN'), remove)

export default router
