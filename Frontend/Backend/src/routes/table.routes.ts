import { Router } from 'express'
import { getTables, getTable, createTable, updateTableStatus } from '../controllers/table.controller'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

router.get('/', authenticate, getTables)
router.get('/:id', authenticate, getTable)
router.post('/', authenticate, authorize('ADMIN', 'CAJERO'), createTable)
router.patch('/:id/status', authenticate, updateTableStatus)

export default router
