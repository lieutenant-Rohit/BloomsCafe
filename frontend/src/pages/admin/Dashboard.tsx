import { useEffect, useState } from 'react'
import { fetchAllOrders } from '../../api/orderApi'
import { fetchProducts } from '../../api/productApi'
import { fetchUsers } from '../../api/userApi'
import type { Order, Product, User } from '../../types'

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    fetchAllOrders().then(setOrders).catch(() => {})
    fetchProducts(0, 100).then((d) => setProducts(d.content)).catch(() => {})
    fetchUsers().then(setUsers).catch(() => {})
  }, [])

  const revenue = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.totalPrice, 0)

  const stats = [
    { label: 'Total Orders', value: orders.length, color: 'bg-blue-500' },
    { label: 'Revenue', value: `$${revenue.toFixed(2)}`, color: 'bg-green-500' },
    { label: 'Products', value: products.length, color: 'bg-primary-500' },
    { label: 'Users', value: users.length, color: 'bg-purple-500' },
  ]

  const pendingOrders = orders.filter((o) => o.status === 'PLACED').length

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>
      {pendingOrders > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800 text-sm">
          <strong>{pendingOrders}</strong> order{pendingOrders !== 1 ? 's' : ''} pending
          &mdash; <a href="/admin/orders" className="underline">view orders</a>
        </div>
      )}
    </div>
  )
}
