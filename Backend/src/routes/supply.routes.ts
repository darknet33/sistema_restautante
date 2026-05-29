import { Router } from 'express'
import { getAll, getById, getLowStock, create, update, remove, addStock } from '../controllers/supply.controller'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

router.get('/', authenticate, getAll)
router.get('/low-stock', authenticate, authorize('ADMIN', 'CAJERO'), getLowStock)
router.get('/:id', authenticate, getById)
router.post('/', authenticate, authorize('ADMIN'), create)
router.put('/:id', authenticate, authorize('ADMIN'), update)
router.delete('/:id', authenticate, authorize('ADMIN'), remove)
router.post('/:id/stock', authenticate, authorize('ADMIN', 'CAJERO'), addStock)

export default router
