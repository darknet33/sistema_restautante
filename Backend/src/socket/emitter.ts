import { Server } from 'socket.io'

let io: Server

export function setSocketIO(socketIO: Server) {
  io = socketIO
}

export function emitOrderCreated(order: any) {
  io.to('kitchen').to('waiter').to('admin').emit('order_created', order)
}

export function emitOrderStatusChanged(order: any) {
  io.to('kitchen').to('waiter').to('admin').emit('order_status_changed', order)
}

export function emitStockLow(supply: any) {
  io.to('admin').emit('stock_low', supply)
}

export function emitMenuUpdated() {
  io.to('waiter').to('admin').emit('menu_updated')
}

export function emitCajaOpened(session: any) {
  io.to('admin').to('cajero').emit('caja_opened', session)
}

export function emitCajaClosed(session: any) {
  io.to('admin').to('cajero').emit('caja_closed', session)
}

export function emitTableLayoutUpdated(tables: any) {
  io.to('kitchen').to('waiter').to('admin').to('cajero').emit('table_layout_updated', tables)
}
