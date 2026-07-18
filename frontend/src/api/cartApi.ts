import axiosClient from './axiosClient'
import type { Product } from '../types'

export interface CartItemResponse {
  id: number
  product: Product
  quantity: number
}

export interface CartResponse {
  cartId: number
  items: CartItemResponse[]
}

export async function fetchCart(): Promise<CartResponse> {
  const { data } = await axiosClient.get('/api/cart')
  return data
}

export async function addToCart(productId: number, quantity: number): Promise<CartResponse> {
  const { data } = await axiosClient.post('/api/cart/items', { productId, quantity })
  return data
}

export async function updateCartItem(productId: number, quantity: number): Promise<CartResponse> {
  const { data } = await axiosClient.put(`/api/cart/items/${productId}`, { quantity })
  return data
}

export async function removeFromCart(productId: number): Promise<CartResponse> {
  const { data } = await axiosClient.delete(`/api/cart/items/${productId}`)
  return data
}

export async function clearCart(): Promise<void> {
  await axiosClient.delete('/api/cart')
}

export async function placeOrderFromCart() {
  const { data } = await axiosClient.post('/api/orders')
  return data
}
