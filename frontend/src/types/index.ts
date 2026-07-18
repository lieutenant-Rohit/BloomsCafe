export interface User {
  id: number
  name: string
  email: string
  role: 'CUSTOMER' | 'ADMIN'
  address: string
  createdAt: string
}

export interface Category {
  id: number
  name: string
}

export interface Product {
  id: number
  name: string
  price: number
  stockQuantity: number
  imageUrl?: string
  category: Category
}

export type OrderStatus = 'PLACED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'

export interface OrderItem {
  id?: number
  product: Product
  quantity: number
  priceAtPurchase: number
}

export interface Order {
  id: number
  status: OrderStatus
  totalPrice: number
  createdAt: string
  user: User
  orderItems: OrderItem[]
}

export interface OrderPayload {
  orderItems: { productId: number; quantity: number }[]
}

export interface ProductPayload {
  name: string
  price: number
  stockQuantity: number
  imageUrl?: string
  category: { id: number }
}

export interface PaginatedResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  last: boolean
  first: boolean
  size: number
  number: number
}

export interface AuthResponse {
  token: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  address: string
  role: 'CUSTOMER' | 'ADMIN'
}

export interface JwtPayload {
  sub: string
  role: string
  userId: number
  iat: number
  exp: number
}
