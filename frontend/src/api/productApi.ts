import axiosClient from './axiosClient'
import type { Product, PaginatedResponse } from '../types'

export async function fetchProducts(
  page = 0,
  size = 8,
): Promise<PaginatedResponse<Product>> {
  const { data } = await axiosClient.get('/api/products', {
    params: { page, size },
  })
  return data
}

export async function fetchProductsByCategory(
  categoryId: number,
  page = 0,
  size = 8,
): Promise<PaginatedResponse<Product>> {
  const { data } = await axiosClient.get(`/api/products/category/${categoryId}`, {
    params: { page, size },
  })
  return data
}
