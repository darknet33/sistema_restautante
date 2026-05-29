import { Router } from 'express'
import { getAll, getById, create, update, remove, uploadImage } from '../controllers/dish.controller'
import { authenticate, authorize } from '../middleware/auth'
import { upload } from '../config/multer'

const router = Router()

router.get('/', authenticate, getAll)
router.get('/:id', authenticate, getById)
router.post('/', authenticate, authorize('ADMIN'), upload.single('image'), create)
router.put('/:id', authenticate, authorize('ADMIN'), upload.single('image'), update)
router.delete('/:id', authenticate, authorize('ADMIN'), remove)
router.patch('/:id/image', authenticate, authorize('ADMIN'), upload.single('image'), uploadImage)

export default router
