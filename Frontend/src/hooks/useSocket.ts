import { useEffect } from 'react'
import { socketService } from '../socket'

export function useSocket(room: 'kitchen' | 'waiter' | 'admin' | 'cajero', enabled = true) {
  useEffect(() => {
    if (!enabled) return
    socketService.joinRoom(room)
  }, [room, enabled])
}

export function useOrderCreated(callback: (data: any) => void, deps: any[] = []) {
  useEffect(() => {
    const unsub = socketService.onOrderCreated(callback)
    return unsub
  }, deps)
}

export function useOrderStatusChanged(callback: (data: any) => void, deps: any[] = []) {
  useEffect(() => {
    const unsub = socketService.onOrderStatusChanged(callback)
    return unsub
  }, deps)
}

export function useStockLow(callback: (data: any) => void, deps: any[] = []) {
  useEffect(() => {
    const unsub = socketService.onStockLow(callback)
    return unsub
  }, deps)
}
