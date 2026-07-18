import { create } from 'zustand'
import type { Product } from '../types'
import * as cartApi from '../api/cartApi'
import useAuthStore from './authStore'

export interface CartItem {
  product: Product
  quantity: number
}

interface CartState {
  items: CartItem[]
  cartId: number | null
  backendReady: boolean

  loadFromBackend: () => Promise<void>
  addItem: (product: Product, quantity?: number) => Promise<void>
  removeItem: (productId: number) => Promise<void>
  updateQuantity: (productId: number, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  totalItems: () => number
  totalAmount: () => number
}

const useCartStore = create<CartState>((set, get) => ({
  items: [],
  cartId: null,
  backendReady: false,

  loadFromBackend: async () => {
    try {
      const cart = await cartApi.fetchCart()
      set({
        items: cart.items.map((i) => ({ product: i.product, quantity: i.quantity })),
        cartId: cart.cartId,
        backendReady: true,
      })
    } catch {
      set({ backendReady: false })
    }
  },

  addItem: async (product, quantity = 1) => {
    const { isAuthenticated } = useAuthStore.getState()
    if (isAuthenticated) {
      try {
        const cart = await cartApi.addToCart(product.id, quantity)
        set({
          items: cart.items.map((i) => ({ product: i.product, quantity: i.quantity })),
          cartId: cart.cartId,
        })
        return
      } catch { /* fall through to local */ }
    }
    set((state) => {
      const existing = state.items.find((i) => i.product.id === product.id)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: i.quantity + quantity }
              : i,
          ),
        }
      }
      return { items: [...state.items, { product, quantity }] }
    })
  },

  removeItem: async (productId) => {
    const { isAuthenticated } = useAuthStore.getState()
    if (isAuthenticated) {
      try {
        const cart = await cartApi.removeFromCart(productId)
        set({
          items: cart.items.map((i) => ({ product: i.product, quantity: i.quantity })),
          cartId: cart.cartId,
        })
        return
      } catch { /* fall through */ }
    }
    set((state) => ({
      items: state.items.filter((i) => i.product.id !== productId),
    }))
  },

  updateQuantity: async (productId, quantity) => {
    if (quantity <= 0) {
      return get().removeItem(productId)
    }
    const { isAuthenticated } = useAuthStore.getState()
    if (isAuthenticated) {
      try {
        const cart = await cartApi.updateCartItem(productId, quantity)
        set({
          items: cart.items.map((i) => ({ product: i.product, quantity: i.quantity })),
          cartId: cart.cartId,
        })
        return
      } catch { /* fall through */ }
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i,
      ),
    }))
  },

  clearCart: async () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (isAuthenticated) {
      try {
        await cartApi.clearCart()
      } catch { /* ignore */ }
    }
    set({ items: [], cartId: null })
  },

  totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  totalAmount: () =>
    get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
}))

export default useCartStore
