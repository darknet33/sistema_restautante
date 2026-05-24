import { Router } from 'express'
import {
  getProducts, getProduct, createProduct,
  updateProduct, deleteProduct, getLowStock
} from '../controllers/product.controller'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

router.get('/', authenticate, getProducts)
router.get('/low-stock', authenticate, authorize('ADMIN', 'CAJERO'), getLowStock)
router.get('/:id', authenticate, getProduct)
router.post('/', authenticate, authorize('ADMIN', 'CAJERO'), createProduct)
router.put('/:id', authenticate, authorize('ADMIN', 'CAJERO'), updateProduct)
router.delete('/:id', authenticate, authorize('ADMIN', 'CAJERO'), deleteProduct)

export default router
