import axiosClient from './axiosClient'
import type { Order, OrderPayload, OrderStatus } from '../types'

export async function placeOrder(payload: OrderPayload): Promise<Order> {
  const { data } = await axiosClient.post('/api/orders', payload)
  return data
}

export async function fetchMyOrders(): Promise<Order[]> {
  const { data } = await axiosClient.get('/api/orders/my-orders')
  return data
}

export async function fetchAllOrders(): Promise<Order[]> {
  const { data } = await axiosClient.get('/api/orders')
  return data
}

export async function updateOrderStatus(id: number, status: OrderStatus): Promise<Order> {
  const { data } = await axiosClient.put(`/api/orders/${id}/status?status=${status}`)
  return data
}
