import { Router } from 'express'
import { getTables, getTable, createTable, updateTable, removeTable, saveLayout } from '../controllers/table.controller'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

router.get('/', authenticate, getTables)
router.get('/:id', authenticate, getTable)
router.post('/', authenticate, authorize('ADMIN'), createTable)
router.patch('/:id', authenticate, updateTable)
router.delete('/:id', authenticate, authorize('ADMIN'), removeTable)
router.put('/layout', authenticate, authorize('ADMIN'), saveLayout)

export default router
