import { Router } from 'express'
import { createOrder, getOrders, getOrder, updateOrderStatus, serveItem, getKitchenTicket, getCustomerReceipt } from '../controllers/order.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.post('/', authenticate, createOrder)
router.get('/', authenticate, getOrders)
router.get('/:id', authenticate, getOrder)
router.get('/:id/ticket', authenticate, getKitchenTicket)
router.get('/:id/receipt', authenticate, getCustomerReceipt)
router.patch('/:id/status', authenticate, updateOrderStatus)
router.patch('/:orderId/items/:itemId/serve', authenticate, serveItem)

export default router
