import { io, Socket } from 'socket.io-client'
import type { Order, Product } from '../types'

type EventCallback<T = any> = (data: T) => void

class SocketService {
  private socket: Socket | null = null

  connect(token: string) {
    if (this.socket?.connected) return

    this.socket = io({
      auth: { token },
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

  joinRoom(room: 'kitchen' | 'waiter' | 'admin') {
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

  onStockLow(callback: EventCallback<Product>) {
    this.socket?.on('stock_low', callback)
    return () => this.socket?.off('stock_low', callback)
  }

  onMenuUpdated(callback: EventCallback) {
    this.socket?.on('menu_updated', callback)
    return () => this.socket?.off('menu_updated', callback)
  }
}

export const socketService = new SocketService()
