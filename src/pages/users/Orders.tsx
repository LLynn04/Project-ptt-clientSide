"use client";

import React, { useEffect, useState } from "react";
import {
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  ExternalLink,
  ShoppingBag,
  Calendar,
  CreditCard,
  AlertCircle,
} from "lucide-react";

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  thumbnail: string | null;
  price: number;
  quantity: number;
  line_total: number;
  line_discount: number;
}

interface Order {
  id: number;
  order_no: string;
  address_id: number;
  transaction_id: string;
  total_amount: number;
  order_status: string;
  customer_note: string | null;
  created_at: string;
  updated_at: string;
  user: { id: number; name: string };
  order_items: OrderItem[];
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelingOrderId, setCancelingOrderId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingDetailsId, setLoadingDetailsId] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("http://127.0.0.1:8000/api/orders-history", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const result = await res.json();
      if (result.result && result.data)
        setOrders(Array.isArray(result.data) ? result.data : [result.data]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelOrder = async (orderId: number) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setCancelingOrderId(orderId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://127.0.0.1:8000/api/orders/${orderId}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      const result = await res.json();
      if (result.result) {
        showNotification("success", "Order cancelled successfully");
        fetchOrders();
      } else {
        showNotification("error", result.message || "Failed to cancel order");
      }
    } catch (error) {
      showNotification("error", "An error occurred");
    } finally {
      setCancelingOrderId(null);
    }
  };

  const viewDetails = async (orderId: number) => {
    setLoadingDetailsId(orderId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://127.0.0.1:8000/api/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const result = await res.json();
      if (result.result && result.data) {
        setDetailOrder(result.data);
        setShowModal(true);
      }
    } finally {
      setLoadingDetailsId(null);
    }
  };

  const formatPrice = (price?: number | null) => {
    return (price || 0).toLocaleString() + "៛";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusUI = (status: string) => {
    const s = status.toLowerCase();
    if (s === "delivered")
      return {
        icon: <CheckCircle2 size={16} />,
        color: "bg-emerald-50 text-emerald-700 border-emerald-100",
      };
    if (s === "cancelled")
      return {
        icon: <XCircle size={16} />,
        color: "bg-rose-50 text-rose-700 border-rose-100",
      };
    if (s === "pending")
      return {
        icon: <Clock size={16} />,
        color: "bg-amber-50 text-amber-700 border-amber-100",
      };
    if (s === "shipped")
      return {
        icon: <Truck size={16} />,
        color: "bg-blue-50 text-blue-700 border-blue-100",
      };
    return {
      icon: <Package size={16} />,
      color: "bg-slate-50 text-slate-700 border-slate-100",
    };
  };

  if (isLoading)
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">Loading orders...</p>
      </div>
    );

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-10 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Order History
            </h1>
            <p className="text-slate-500 mt-1 font-medium">
              Track and manage your recent purchases
            </p>
          </div>
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex gap-2">
            <div className="px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-sm font-bold">
              Total: {orders.length} Orders
            </div>
          </div>
        </div>

        {/* Notifications */}
        {notification && (
          <div className="fixed bottom-10 right-10 z-50 animate-in fade-in slide-in-from-bottom-5">
            <div
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white font-bold ${
                notification.type === "success"
                  ? "bg-emerald-500"
                  : "bg-rose-500"
              }`}
            >
              {notification.type === "success" ? (
                <CheckCircle2 />
              ) : (
                <AlertCircle />
              )}
              {notification.message}
            </div>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-300">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
              <ShoppingBag size={40} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              No orders found
            </h3>
            <p className="text-slate-500">
              Looks like you haven't made any purchases yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = getStatusUI(order.order_status);
              return (
                <div
                  key={order.id}
                  className="bg-white border border-slate-100 rounded-[2rem] p-5 md:p-6 transition-all hover:shadow-md group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                        <Package size={28} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="font-bold text-slate-900 tracking-tight">
                            {order.order_no}
                          </h2>
                          <span
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${status.color}`}
                          >
                            {status.icon} {order.order_status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />{" "}
                            {formatDate(order.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <CreditCard size={14} />{" "}
                            {formatPrice(order.total_amount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => viewDetails(order.id)}
                        className="flex-1 md:flex-none px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                      >
                        {loadingDetailsId === order.id ? "..." : "View Details"}{" "}
                        <ChevronRight size={16} />
                      </button>

                      {order.order_status.toLowerCase() === "pending" && (
                        <button
                          onClick={() => cancelOrder(order.id)}
                          disabled={cancelingOrderId === order.id}
                          className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-50"
                        >
                          <XCircle size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Improved Modal */}
        {showModal && detailOrder && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Order Details
                  </p>
                  <h2 className="text-xl font-black text-slate-900">
                    {detailOrder.order_no}
                  </h2>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
                >
                  <XCircle className="text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Summary Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Status
                    </p>
                    <p className="text-sm font-bold text-slate-700 capitalize">
                      {detailOrder.order_status}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Total Paid
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {formatPrice(detailOrder.total_amount)}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4">
                    Order Items
                  </h3>
                  <div className="space-y-3">
                    {detailOrder.order_items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-2xl border border-slate-100"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100">
                            {item.thumbnail ? (
                              <img
                                src={item.thumbnail} // No need to add the IP address here anymore!
                                alt={item.product_name}
                                className="w-16 h-16 rounded-xl object-cover"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300">
                                <Package size={24} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              {item.product_name}
                            </p>
                            <p className="text-xs text-slate-500 font-medium">
                              Qty: {item.quantity} × {formatPrice(item.price)}
                            </p>
                          </div>
                        </div>
                        <div className="text-sm font-black text-slate-900">
                          {formatPrice(item.line_total)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Logistics */}
                <div className="p-6 bg-slate-900 rounded-[2rem] text-white">
                  <div className="flex items-center gap-2 mb-4 text-orange-400">
                    <ExternalLink size={18} />
                    <span className="text-xs font-black uppercase tracking-widest">
                      Transaction Info
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-1 font-medium">
                    Transaction ID
                  </p>
                  <p className="text-sm font-mono text-slate-200 break-all">
                    {detailOrder.transaction_id || "N/A"}
                  </p>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-100 transition-all"
                >
                  Close History
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
