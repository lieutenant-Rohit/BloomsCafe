import axiosClient from './axiosClient'
import type { Category, PaginatedResponse } from '../types'

export async function fetchCategories(page = 0, size = 50): Promise<Category[]> {
  const { data } = await axiosClient.get<PaginatedResponse<Category>>('/api/categories', {
    params: { page, size },
  })
  return data.content
}
