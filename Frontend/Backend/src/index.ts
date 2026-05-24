import dotenv from 'dotenv'
import app from './app'
import { setupSocket } from './socket'
import prisma from './utils/prisma'

dotenv.config()

const PORT = process.env.PORT || 3000

async function main() {
  try {
    await prisma.$connect()
    console.log('Database connected successfully')

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })

    setupSocket(server)
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

main()

process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})
