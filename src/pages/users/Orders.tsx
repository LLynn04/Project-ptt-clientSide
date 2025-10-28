"use client"

import React, { useEffect, useState } from "react"

interface OrderItem {
  id: number
  product_id: number
  product_name: string
  thumbnail: string | null
  price: number
  quantity: number
  line_total: number
  line_discount: number
}

interface Order {
  id: number
  order_no: string
  address_id: number
  transaction_id: string
  total_amount: number
  order_status: string
  customer_note: string | null
  created_at: string
  updated_at: string
  user: { id: number; name: string }
  order_items: OrderItem[]
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [cancelingOrderId, setCancelingOrderId] = useState<number | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loadingDetailsId, setLoadingDetailsId] = useState<number | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 4000)
  }

  const fetchOrders = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setOrders([])
        return
      }

      const res = await fetch("http://127.0.0.1:8000/api/orders-history", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      })
      const result = await res.json()
      if (result.result && result.data) setOrders(Array.isArray(result.data) ? result.data : [result.data])
      else setOrders([])
    } catch (error) {
      console.error(error)
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  const cancelOrder = async (orderId: number) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return
    setCancelingOrderId(orderId)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`http://127.0.0.1:8000/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" },
      })
      const result = await res.json()
      if (result.result) {
        showNotification('success', 'Order cancelled successfully')
        fetchOrders()
      } else {
        showNotification('error', result.message || 'Failed to cancel order')
      }
    } catch (error) {
      console.error(error)
      showNotification('error', 'An error occurred while cancelling the order')
    } finally {
      setCancelingOrderId(null)
    }
  }

  const viewDetails = async (orderId: number) => {
    setLoadingDetailsId(orderId)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`http://127.0.0.1:8000/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      })
      const result = await res.json()
      if (result.result && result.data) {
        setDetailOrder(result.data)
        setShowModal(true)
      } else {
        showNotification('error', 'Failed to fetch order details')
      }
    } catch (error) {
      console.error(error)
      showNotification('error', 'An error occurred while fetching order details')
    } finally {
      setLoadingDetailsId(null)
    }
  }

  const formatPrice = (price?: number | null) => {
    if (price === undefined || price === null) return "0៛"
    return price.toLocaleString() + "៛"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      pending: "bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800",
      confirmed: "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800",
      processing: "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800",
      shipped: "bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800",
      delivered: "bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800",
      cancelled: "bg-gradient-to-r from-rose-100 to-rose-200 text-rose-800"
    }
    return styles[status.toLowerCase()] || "bg-gray-100 text-gray-800"
  }

  if (isLoading) return <div className="flex justify-center items-center min-h-screen"><div className="w-12 h-12 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div></div>

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Notifications */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 duration-300">
          <div className={`flex items-center gap-3 px-5 py-3 rounded-lg shadow-lg ${
            notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}>
            <span className="font-medium">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-auto hover:opacity-70">
              ✕
            </button>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-6 text-gray-800">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No orders yet</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {orders.map(order => (
            <div key={order.id} className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition relative">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-semibold text-gray-800">{order.order_no}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(order.order_status)}`}>
                  {order.order_status}
                </span>
              </div>
              <p className="text-gray-500 text-sm">Created: {formatDate(order.created_at)}</p>
              <p className="text-gray-900 font-semibold mt-2 text-lg">Total: {formatPrice(order.total_amount)}</p>

              <div className="flex gap-2 mt-4 flex-wrap">
                <button
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition shadow"
                  onClick={() => viewDetails(order.id)}
                  disabled={loadingDetailsId === order.id}
                >
                  {loadingDetailsId === order.id ? "Loading..." : "View Details"}
                </button>

                {order.order_status.toLowerCase() === "pending" && (
                  <button
                    onClick={() => cancelOrder(order.id)}
                    disabled={cancelingOrderId === order.id}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition shadow disabled:opacity-50"
                  >
                    {cancelingOrderId === order.id ? "Cancelling..." : "Cancel Order"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && detailOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 overflow-y-auto max-h-[90vh] relative">
            <button className="absolute top-4 right-5 text-gray-600 hover:text-gray-900 text-xl" onClick={() => setShowModal(false)}>✕</button>
            <h2 className="text-2xl font-bold mb-3 text-gray-800">{detailOrder.order_no}</h2>
            <p className="text-gray-600 mb-2">Status: <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(detailOrder.order_status)}`}>{detailOrder.order_status}</span></p>
            <p className="text-gray-700 mb-2">Customer: {detailOrder.user.name}</p>
            <p className="text-gray-700 mb-2">Transaction ID: {detailOrder.transaction_id}</p>
            <p className="text-gray-700 mb-4 font-semibold">Total: {formatPrice(detailOrder.total_amount)}</p>

            <h3 className="font-semibold text-gray-800 mb-3">Items:</h3>
            <div className="space-y-3">
              {detailOrder.order_items.map(item => (
                <div key={item.id} className="flex items-center justify-between border p-3 rounded-lg shadow-sm hover:shadow-md transition">
                  <div className="flex items-center gap-3">
                    {item.thumbnail ? (
                      <img src={`http://127.0.0.1:8000/storage/${item.thumbnail}`} alt={item.product_name} className="w-12 h-12 rounded object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs">No Img</div>
                    )}
                    <div>
                      <p className="text-gray-800 font-medium">{item.product_name}</p>
                      <p className="text-gray-500 text-sm">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-gray-900 font-semibold">{formatPrice(item.line_total)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders
