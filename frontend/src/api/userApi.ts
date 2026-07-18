import axiosClient from './axiosClient'
import type { User } from '../types'

export async function fetchUsers(): Promise<User[]> {
  const { data } = await axiosClient.get('/api/users')
  return data
}

export async function deleteUser(id: number): Promise<void> {
  await axiosClient.delete(`/api/users/${id}`)
}
