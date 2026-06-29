import { io, Socket } from 'socket.io-client'
import type { Order, Supply } from '../types'

type EventCallback<T = any> = (data: T) => void

class SocketService {
  private socket: Socket | null = null

  connect(token: string) {
    if (this.socket?.connected) return

    const SOCKET_URL = import.meta.env.VITE_API_URL || ''
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  joinRoom(room: 'kitchen' | 'waiter' | 'admin' | 'cajero') {
    this.socket?.emit(`join_${room}`)
  }

  onOrderCreated(callback: EventCallback<Order>) {
    this.socket?.on('order_created', callback)
    return () => this.socket?.off('order_created', callback)
  }

  onOrderStatusChanged(callback: EventCallback<Order>) {
    this.socket?.on('order_status_changed', callback)
    return () => this.socket?.off('order_status_changed', callback)
  }

  onStockLow(callback: EventCallback<Supply>) {
    this.socket?.on('stock_low', callback)
    return () => this.socket?.off('stock_low', callback)
  }

  onMenuUpdated(callback: EventCallback) {
    this.socket?.on('menu_updated', callback)
    return () => this.socket?.off('menu_updated', callback)
  }

  onCajaOpened(callback: EventCallback) {
    this.socket?.on('caja_opened', callback)
    return () => this.socket?.off('caja_opened', callback)
  }

  onCajaClosed(callback: EventCallback) {
    this.socket?.on('caja_closed', callback)
    return () => this.socket?.off('caja_closed', callback)
  }

  onTableLayoutUpdated(callback: EventCallback) {
    this.socket?.on('table_layout_updated', callback)
    return () => this.socket?.off('table_layout_updated', callback)
  }
}

export const socketService = new SocketService()
