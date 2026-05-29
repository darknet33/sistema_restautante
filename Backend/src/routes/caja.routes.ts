import { Router } from 'express'
import { getCurrent, openCaja, closeCaja, getHistory } from '../controllers/caja.controller'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

router.get('/current', authenticate, authorize('ADMIN', 'CAJERO'), getCurrent)
router.post('/open', authenticate, authorize('ADMIN', 'CAJERO'), openCaja)
router.post('/close', authenticate, authorize('ADMIN', 'CAJERO'), closeCaja)
router.get('/history', authenticate, authorize('ADMIN'), getHistory)

export default router
