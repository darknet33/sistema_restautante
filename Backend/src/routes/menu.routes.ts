import { Router } from 'express'
import { getMenu, generateQR } from '../controllers/menu.controller'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

router.get('/', getMenu)
router.get('/qr', authenticate, authorize('ADMIN'), generateQR)

export default router
