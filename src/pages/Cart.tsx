"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

// --- Interfaces (Maintained as requested) ---
interface ProductUnit { id: number; name: string; }
interface Shop { id: number; name: string; }
interface Product {
  id: number;
  name: string;
  price: number;
  discounted_price: number;
  has_discount: boolean;
  discount_rate: number;
  thumbnail_url: string;
  shop?: Shop;
  product_unit?: ProductUnit;
  stock_status?: string;
}
interface CartItem { id: number; product: Product; qty: number; created_at?: string; }
interface Address {
  id: number; name: string; phone: string; house_number: string; street_number: string;
  province_id: number; district_id: number; commune_id: number; village_id: number;
}
interface OrderItem {
  id: number; order_id: number; product_id: number; product_name: string;
  qty: number; price: number; line_discount: number; line_total: number;
}
interface Order {
  id: number; order_no: string; total_amount: number; subtotal: number;
  discount_total: number; shipping_total: number; tax_total: number;
  grand_total: number; order_status: string; transaction_id: string;
  order_items: OrderItem[]; address: Address;
}
interface Toast {
  id: number; type: "success" | "error" | "info" | "warning";
  message: string; description?: string;
}

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // --- Core Logic (Maintained) ---
  const showToast = (type: Toast["type"], message: string, description?: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = { Accept: "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch("http://127.0.0.1:8000/api/cart", { headers });
      const result = await response.json();

      const normalizeCartItem = (item: any): CartItem => ({
        ...item,
        qty: typeof item.qty === "string" ? Number.parseInt(item.qty, 10) : item.qty,
      });

      if (result.result && result.data) {
        if (Array.isArray(result.data)) {
          setCartItems(result.data.map(normalizeCartItem));
        } else if (typeof result.data === "object") {
          setCartItems([normalizeCartItem(result.data)]);
        }
      } else if (Array.isArray(result)) {
        setCartItems(result.map(normalizeCartItem));
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error("Cart fetch error:", error);
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    setUpdatingId(cartItemId);
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const cartItem = cartItems.find((item) => item.id === cartItemId);
      if (!cartItem) return;

      const response = await fetch(`http://127.0.0.1:8000/api/cart/${cartItemId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ product_id: cartItem.product.id, qty: newQuantity }),
      });

      if (response.ok) {
        setCartItems((prev) => prev.map((item) => item.id === cartItemId ? { ...item, qty: newQuantity } : item));
        window.dispatchEvent(new CustomEvent("cartUpdated"));
      } else {
        showToast("error", "Failed to update quantity");
      }
    } catch (error) {
      showToast("error", "Error updating quantity");
    } finally {
      setUpdatingId(null);
    }
  };

  const removeFromCart = async (cartItemId: number) => {
    setUpdatingId(cartItemId);
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = { Accept: "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`http://127.0.0.1:8000/api/cart/${cartItemId}`, {
        method: "DELETE",
        headers,
      });

      if (response.ok) {
        setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
        window.dispatchEvent(new CustomEvent("cartUpdated"));
        showToast("success", "Item removed");
      } else {
        showToast("error", "Failed to remove item");
      }
    } catch (error) {
      showToast("error", "Error removing item");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("warning", "Authentication required", "Please login to checkout");
        navigate("/login");
        return;
      }
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };

      let savedAddressId = localStorage.getItem("address_id");
      let addressId = savedAddressId ? Number(savedAddressId) : null;

      const addrRes = await fetch("http://127.0.0.1:8000/api/addresses", { headers });
      const addrData = await addrRes.json();
      const addressList = addrData.data || [];

      if (!addressList.some((a: any) => a.id === addressId)) {
        addressId = addressList.length > 0 ? addressList[0].id : null;
        if (addressId) localStorage.setItem("address_id", addressId.toString());
      }

      if (!addressId) {
        showToast("warning", "No address found", "Please add a delivery address");
        setIsCheckingOut(false);
        return;
      }

      const items = cartItems.map((item) => ({
        product_id: item.product.id,
        product_unit_id: item.product.product_unit?.id || null,
        quantity: item.qty,
      }));

      const response = await fetch("http://127.0.0.1:8000/api/orders/checkout", {
        method: "POST",
        headers,
        body: JSON.stringify({ address_id: addressId, customer_note: null, items: items }),
      });

      const result = await response.json();
      if (response.ok && result.result && result.data) {
        setOrderSuccess(result.data);
        setCartItems([]);
        window.dispatchEvent(new CustomEvent("cartUpdated"));
      } else {
        showToast("error", result?.message || "Checkout failed");
      }
    } catch (error) {
      showToast("error", "Checkout failed");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const calculateItemTotal = (item: CartItem) => {
    const price = item.product.has_discount ? item.product.discounted_price : item.product.price;
    return price * item.qty;
  };

  const calculateSubtotal = () => cartItems.reduce((total, item) => total + calculateItemTotal(item), 0);
  const calculateTax = () => calculateSubtotal() * 0.1;
  const calculateTotal = () => calculateSubtotal() + calculateTax();
  const formatPrice = (price: number) => `${price.toLocaleString()}៛`;

  // --- Loading UI ---
  if (isLoading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">Loading your bag</p>
        </div>
      </div>
    );
  }

  // --- Success UI ---
  if (orderSuccess) {
    return (
      <div className="bg-[#FAFAFA] min-h-screen py-20 px-6">
        <div className="max-w-xl mx-auto bg-white rounded-[2rem] border border-gray-100 shadow-sm p-10">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-3xl font-light text-gray-900 tracking-tight">Order Received</h2>
            <p className="text-gray-400 text-sm mt-2 tracking-wide uppercase font-medium">No. {orderSuccess.order_no}</p>
          </div>

          <div className="space-y-6 mb-10 border-t border-b border-gray-50 py-8">
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">Total Payable</span>
              <span className="text-2xl font-black text-gray-900">{formatPrice(orderSuccess.grand_total)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">Status</span>
              <span className="text-[10px] uppercase tracking-widest font-black px-3 py-1 bg-gray-100 text-gray-600 rounded-full">{orderSuccess.order_status}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              className="w-full bg-orange-600 text-white font-black uppercase text-[11px] tracking-[0.2em] py-4 rounded-xl shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all"
              onClick={() => showToast("info", "Integration Pending")}
            >
              Complete Payment
            </button>
            <Link to="/products" className="w-full">
              <button className="w-full bg-white text-gray-400 font-bold uppercase text-[11px] tracking-[0.2em] py-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all">
                Continue Shopping
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- Main Cart UI ---
  return (
    <div className="bg-white min-h-screen">
      <header className="border-b border-gray-100">
        <div className="max-w-[1280px] mx-auto px-6 py-12">
          <nav className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mb-4">Store / Shopping Bag</nav>
          <div className="flex items-baseline gap-4">
            <h1 className="text-4xl font-extralight text-gray-900 tracking-tight">Your Bag</h1>
            <span className="text-gray-300 font-light text-xl">({cartItems.length})</span>
          </div>
        </div>
      </header>

      <div className="max-w-[1280px] mx-auto px-6 py-12">
        {cartItems.length > 0 ? (
          <div className="flex flex-col lg:flex-row gap-16">
            
            {/* Item List */}
            <div className="flex-1 space-y-8">
              {cartItems.map((item) => (
                <div key={item.id} className="group relative flex flex-col sm:flex-row gap-6 pb-8 border-b border-gray-50 last:border-0 transition-all">
                  <div className="w-full sm:w-32 aspect-[4/5] bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0">
                    <img
                      src={item.product.thumbnail_url || "/placeholder.svg"}
                      alt={item.product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1">
                            {item.product.shop?.name || "Local Seller"}
                          </p>
                          <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2">{item.product.name}</h3>
                          <div className="flex items-center gap-3 text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                            <span>Unit: {item.product.product_unit?.name.replace("_", " ") || "N/A"}</span>
                            <span className={item.product.stock_status === "In Stock" ? "text-green-500" : "text-red-400"}>
                              • {item.product.stock_status}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors p-2 -mr-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-6">
                      {/* Modern Quantity Selector */}
                      <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                        <button
                          onClick={() => updateQuantity(item.id, item.qty - 1)}
                          disabled={item.qty <= 1 || updatingId === item.id}
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 disabled:opacity-30 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                        </button>
                        <span className="w-10 text-center text-xs font-black text-gray-900">
                          {updatingId === item.id ? "..." : item.qty}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.qty + 1)}
                          disabled={updatingId === item.id}
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-black text-gray-900 leading-none">{formatPrice(calculateItemTotal(item))}</p>
                        {item.product.has_discount && (
                          <span className="text-[10px] text-green-500 font-bold tracking-tighter">
                            SAVED {item.product.discount_rate}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Sidebar */}
            <div className="lg:w-80">
              <div className="sticky top-24 bg-[#FAFAFA] rounded-[2rem] p-8 border border-gray-50">
                <h3 className="text-[11px] uppercase tracking-[0.2em] font-black text-gray-400 mb-8 text-center">Order Summary</h3>
                
                <div className="space-y-4 mb-10">
                  <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                    <span>Subtotal</span>
                    <span className="text-gray-900">{formatPrice(calculateSubtotal())}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                    <span>Tax (10%)</span>
                    <span className="text-gray-900">{formatPrice(calculateTax())}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                    <span>Shipping</span>
                    <span className="text-green-500 uppercase tracking-widest text-[10px]">Free</span>
                  </div>
                  <div className="pt-6 border-t border-gray-200/60 flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-900">Total</span>
                    <span className="text-2xl font-black text-orange-600">{formatPrice(calculateTotal())}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full bg-gray-900 text-white font-black uppercase text-[11px] tracking-[0.2em] py-5 rounded-2xl shadow-xl hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isCheckingOut ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Checkout Now"}
                </button>
                
                <Link to="/products" className="block text-center mt-6">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 hover:text-orange-500 transition-colors cursor-pointer">
                    Back to Gallery
                  </span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-100">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 11-8 0 4 4 0 018 0zM5 9h14l1 12H4L5 9z" /></svg>
            </div>
            <h3 className="text-2xl font-light text-gray-900 mb-2">Your bag is empty</h3>
            <p className="text-gray-400 text-sm mb-8 font-medium">Items you add will appear here.</p>
            <Link to="/products">
              <button className="bg-orange-600 text-white font-black uppercase text-[11px] tracking-[0.2em] px-8 py-4 rounded-xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-100">
                Explore Collection
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Modern Toast Notification Container */}
      <div className="fixed top-8 right-8 z-[100] space-y-3 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto bg-white rounded-2xl shadow-2xl p-4 flex items-start gap-4 border border-gray-100 animate-slide-in-right overflow-hidden relative ${
              toast.type === "success" ? "border-l-4 border-l-green-500" :
              toast.type === "error" ? "border-l-4 border-l-red-500" : "border-l-4 border-l-orange-500"
            }`}
          >
            <div className="flex-1">
              <p className="text-xs font-black text-gray-900 uppercase tracking-tight mb-0.5">{toast.message}</p>
              {toast.description && <p className="text-[10px] text-gray-400 font-medium leading-relaxed">{toast.description}</p>}
            </div>
            <button onClick={() => removeToast(toast.id)} className="text-gray-300 hover:text-gray-900">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right { animation: slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default Cart;