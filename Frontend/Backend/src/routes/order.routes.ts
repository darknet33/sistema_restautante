import { Router } from 'express'
import { createOrder, getOrders, getOrder, updateOrderStatus } from '../controllers/order.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.post('/', authenticate, createOrder)
router.get('/', authenticate, getOrders)
router.get('/:id', authenticate, getOrder)
router.patch('/:id/status', authenticate, updateOrderStatus)

export default router
