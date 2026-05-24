import { Router } from 'express'
import { getDailySales, getTopDishes, closeTurno } from '../controllers/report.controller'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

router.get('/daily-sales', authenticate, authorize('ADMIN', 'CAJERO'), getDailySales)
router.get('/top-dishes', authenticate, authorize('ADMIN', 'CAJERO'), getTopDishes)
router.post('/close-turno', authenticate, authorize('ADMIN', 'CAJERO'), closeTurno)

export default router
