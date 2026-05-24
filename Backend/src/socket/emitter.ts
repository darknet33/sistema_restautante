import { Server } from 'socket.io'

let io: Server | null = null

export function setSocketIO(socketIO: Server) {
  io = socketIO
}

export function emitOrderCreated(order: any) {
  if (io) {
    io.to('kitchen').to('waiter').to('admin').emit('order_created', order)
  }
}

export function emitOrderStatusChanged(order: any) {
  if (io) {
    io.to('kitchen').to('waiter').to('admin').emit('order_status_changed', order)
  }
}

export function emitStockLow(product: any) {
  if (io) {
    io.to('admin').emit('stock_low', product)
  }
}

export function emitMenuUpdated() {
  if (io) {
    io.to('kitchen').to('waiter').to('admin').emit('menu_updated')
  }
}
