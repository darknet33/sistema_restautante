import express from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.routes'
import dishRoutes from './routes/dish.routes'
import supplyRoutes from './routes/supply.routes'
import wasteRoutes from './routes/waste.routes'
import cajaRoutes from './routes/caja.routes'
import menuRoutes from './routes/menu.routes'
import categoryRoutes from './routes/category.routes'
import tableRoutes from './routes/table.routes'
import orderRoutes from './routes/order.routes'
import reportRoutes from './routes/report.routes'

dotenv.config()

const app = express()

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',')
  : ['http://localhost:5173', 'http://localhost:3000']

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    return cb(null, true)
  }
}))
app.use(express.json())
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/dishes', dishRoutes)
app.use('/api/supplies', supplyRoutes)
app.use('/api/waste', wasteRoutes)
app.use('/api/caja', cajaRoutes)
app.use('/api/menu', menuRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/tables', tableRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/reports', reportRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ message: 'Internal server error' })
})

export default app
