import { useEffect, useState } from 'react'
import type { Order, OrderStatus } from '../../types'
import { fetchAllOrders, updateOrderStatus } from '../../api/orderApi'

const statusFlow: OrderStatus[] = ['PLACED', 'PREPARING', 'READY', 'COMPLETED']
const statusColors: Record<OrderStatus, string> = {
  PLACED: 'bg-blue-100 text-blue-700',
  PREPARING: 'bg-yellow-100 text-yellow-700',
  READY: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    fetchAllOrders().then(setOrders).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleStatus(order: Order) {
    if (order.status === 'CANCELLED') return
    const currentIdx = statusFlow.indexOf(order.status)
    const nextStatus = currentIdx < statusFlow.length - 1 ? statusFlow[currentIdx + 1] : null
    if (!nextStatus) return
    await updateOrderStatus(order.id, nextStatus)
    load()
  }

  async function handleCancel(order: Order) {
    if (!window.confirm(`Cancel order #${order.id}?`)) return
    await updateOrderStatus(order.id, 'CANCELLED')
    load()
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 h-24" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-6">Orders</h1>
      {orders.length === 0 ? (
        <p className="text-gray-500 text-center py-16">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-500">
                    Order #{order.id} &middot; {order.user.name} ({order.user.email})
                  </p>
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[order.status]}`}>
                  {order.status}
                </span>
              </div>
              <div className="divide-y divide-gray-100 text-sm">
                {order.orderItems.map((item) => (
                  <div key={item.id ?? item.product.id} className="flex items-center gap-3 py-1.5">
                    {item.product.imageUrl && (
                      <img src={item.product.imageUrl} alt={item.product.name} className="w-8 h-6 rounded object-cover" />
                    )}
                    <span className="text-gray-700 flex-1">{item.product.name} x{item.quantity}</span>
                    <span className="text-gray-900">${(item.priceAtPurchase * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <span className="font-bold text-gray-900">${order.totalPrice.toFixed(2)}</span>
                <div className="flex gap-2">
                  {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleCancel(order)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Cancel
                    </button>
                  )}
                  {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleStatus(order)}
                      className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                    >
                      {order.status === 'PLACED' ? 'Start Preparing' :
                       order.status === 'PREPARING' ? 'Mark Ready' :
                       order.status === 'READY' ? 'Complete' : ''}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
