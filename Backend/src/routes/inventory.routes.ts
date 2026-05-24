import { Router } from 'express'
import { getMovements, createMovement } from '../controllers/inventory.controller'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

router.get('/movements', authenticate, authorize('ADMIN', 'CAJERO'), getMovements)
router.post('/movements', authenticate, authorize('ADMIN', 'CAJERO'), createMovement)

export default router
