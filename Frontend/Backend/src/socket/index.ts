import { Server as HttpServer } from 'http'
import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { setSocketIO } from './emitter'

interface JwtPayload {
  userId: number
  role: string
}

export function setupSocket(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })

  setSocketIO(io)

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) return next(new Error('Authentication required'))

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
      socket.data.user = decoded
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}, role: ${socket.data.user.role}`)

    socket.on('join_kitchen', () => {
      socket.join('kitchen')
    })

    socket.on('join_waiter', () => {
      socket.join('waiter')
    })

    socket.on('join_admin', () => {
      socket.join('admin')
    })

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`)
    })
  })

  return io
}
