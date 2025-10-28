"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"


interface ProductUnit {
  id: number
  name: string
}

interface Shop {
  id: number
  name: string
}

interface Product {
  id: number
  name: string
  price: number
  discounted_price: number
  has_discount: boolean
  discount_rate: number
  thumbnail_url: string
  shop?: Shop
  product_unit?: ProductUnit
  stock_status?: string
}

interface CartItem {
  id: number
  product: Product
  qty: number
  created_at?: string
}

interface Address {
  id: number
  name: string
  phone: string
  house_number: string
  street_number: string
  province_id: number
  district_id: number
  commune_id: number
  village_id: number
}

interface OrderItem {
  id: number
  order_id: number
  product_id: number
  product_name: string
  qty: number
  price: number
  line_discount: number
  line_total: number
}

interface Order {
  id: number
  order_no: string
  total_amount: number
  subtotal: number
  discount_total: number
  shipping_total: number
  tax_total: number
  grand_total: number
  order_status: string
  transaction_id: string
  order_items: OrderItem[]
  address: Address
}

const Cart: React.FC = () => {
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null)

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      const headers: HeadersInit = { Accept: "application/json" }

      if (token) headers["Authorization"] = `Bearer ${token}`

      const response = await fetch("http://127.0.0.1:8000/api/cart", { headers })
      const result = await response.json()

      console.log("[v0] Cart fetch response:", result)

      const normalizeCartItem = (item: any): CartItem => ({
        ...item,
        qty: typeof item.qty === "string" ? Number.parseInt(item.qty, 10) : item.qty,
      })

      if (result.result && result.data) {
        if (Array.isArray(result.data)) {
          setCartItems(result.data.map(normalizeCartItem))
        } else if (typeof result.data === "object") {
          setCartItems([normalizeCartItem(result.data)])
        }
      } else if (Array.isArray(result)) {
        setCartItems(result.map(normalizeCartItem))
      } else {
        setCartItems([])
      }
    } catch (error) {
      console.error("[v0] Cart fetch error:", error)
      setCartItems([])
    } finally {
      setIsLoading(false)
    }
  }

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
        body: JSON.stringify({
          product_id: cartItem.product.id,
          qty: newQuantity,
        }),
      });

      if (response.ok) {
        setCartItems((prev) =>
          prev.map((item) =>
            item.id === cartItemId ? { ...item, qty: newQuantity } : item
          )
        );
        window.dispatchEvent(new CustomEvent("cartUpdated"));
      } else {
        console.error("Failed to update quantity");
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const removeFromCart = async (cartItemId: number) => {
    setUpdatingId(cartItemId)
    try {
      const token = localStorage.getItem("token")
      const headers: HeadersInit = { Accept: "application/json" }

      if (token) headers["Authorization"] = `Bearer ${token}`

      const response = await fetch(`http://127.0.0.1:8000/api/cart/${cartItemId}`, {
        method: "DELETE",
        headers,
      })

      if (response.ok) {
        setCartItems((prev) => prev.filter((item) => item.id !== cartItemId))
        window.dispatchEvent(new CustomEvent("cartUpdated"))
      } else {
        console.error("Failed to remove from cart")
      }
    } catch (error) {
      console.error("Error removing from cart:", error)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleCheckout = async () => {
    setIsCheckingOut(true)
    try {
      const token = localStorage.getItem("token")
      
      if (!token) {
        alert("Please login to checkout")
        navigate("/login")
        return
      }

      // Prepare items array from cart items
      const items = cartItems.map(item => ({
        product_id: item.product.id,
        product_unit_id: item.product.product_unit?.id || null,
        quantity: item.qty
      }))

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }

      const response = await fetch("http://127.0.0.1:8000/api/orders/checkout", {
        method: "POST",
        headers,
        body: JSON.stringify({
          address_id: "4", // You may want to let user select address
          customer_note: null,
          items: items
        })
      })

      const result = await response.json()
      console.log("[v0] Order response:", result)

      if (result.result && result.data) {
        setOrderSuccess(result.data)
        setCartItems([]) // Clear cart items
        window.dispatchEvent(new CustomEvent("cartUpdated"))
        
        // Show success message
        alert(`Order created successfully!\nOrder No: ${result.data.order_no}\nStatus: ${result.data.order_status}\n${result.message}`)
        
        // Optional: Navigate to order details or orders page
        // navigate(`/orders/${result.data.id}`)
      } else {
        alert(result.message || "Failed to create order")
      }
    } catch (error) {
      console.error("Checkout error:", error)
      alert("An error occurred during checkout. Please try again.")
    } finally {
      setIsCheckingOut(false)
    }
  }

  const calculateItemTotal = (item: CartItem) => {
    const price = item.product.has_discount ? item.product.discounted_price : item.product.price
    return price * item.qty
  }

  const calculateSubtotal = () => cartItems.reduce((total, item) => total + calculateItemTotal(item), 0)

  const calculateTax = () => calculateSubtotal() * 0.1

  const calculateTotal = () => calculateSubtotal() + calculateTax()

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()}៛`
  }

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-[#E07A5F] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    )
  }

  // Order Success View
  if (orderSuccess) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Created Successfully!</h2>
              <p className="text-gray-600">Please proceed to payment</p>
            </div>

            <div className="border-t border-b py-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Order Number</p>
                  <p className="font-semibold text-gray-900">{orderSuccess.order_no}</p>
                </div>
                <div>
                  <p className="text-gray-600">Transaction ID</p>
                  <p className="font-semibold text-gray-900">{orderSuccess.transaction_id}</p>
                </div>
                <div>
                  <p className="text-gray-600">Status</p>
                  <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                    {orderSuccess.order_status}
                  </span>
                </div>
                <div>
                  <p className="text-gray-600">Total Amount</p>
                  <p className="font-semibold text-[#E07A5F] text-lg">{formatPrice(orderSuccess.grand_total)}</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Items</h3>
              <div className="space-y-3">
                {orderSuccess.order_items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.product_name}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.qty}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatPrice(item.line_total)}</p>
                      {item.line_discount > 0 && (
                        <p className="text-xs text-green-600">Saved {formatPrice(item.line_discount)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(orderSuccess.subtotal)}</span>
                </div>
                {orderSuccess.discount_total > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(orderSuccess.discount_total)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">{formatPrice(orderSuccess.tax_total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <div className="flex justify-between pt-2 border-t text-base">
                  <span className="font-semibold text-gray-900">Grand Total</span>
                  <span className="font-bold text-[#E07A5F] text-lg">{formatPrice(orderSuccess.grand_total)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                className="w-full bg-gradient-to-r from-[#E07A5F] to-[#F4A261] text-white font-medium py-3 rounded-lg hover:opacity-90 transition-opacity"
                onClick={() => alert("Payment integration coming soon!")}
              >
                Proceed to Payment
              </button>
              <Link to="/products">
                <button className="w-full border border-gray-300 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50 transition-colors">
                  Continue Shopping
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-sm text-gray-600 mt-2">
            {cartItems.length} {cartItems.length === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm p-4 flex gap-4">
                  <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={item.product.thumbnail_url || "/placeholder.svg"}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0 pr-4">
                        {item.product.shop && <p className="text-xs text-gray-500 mb-1">{item.product.shop.name}</p>}
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{item.product.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {item.product.product_unit && (
                            <span className="text-xs text-gray-500">
                              Unit: {item.product.product_unit.name.replace("_", " ")}
                            </span>
                          )}
                          {item.product.stock_status && (
                            <span
                              className={`text-xs font-medium ${
                                item.product.stock_status === "In Stock" ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              • {item.product.stock_status}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        disabled={updatingId === item.id}
                        className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                        title="Remove from cart"
                      >
                        {updatingId === item.id ? (
                          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.qty - 1)}
                          disabled={item.qty <= 1 || updatingId === item.id}
                          className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="w-12 text-center font-medium text-gray-900">{item.qty}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.qty + 1)}
                          disabled={updatingId === item.id}
                          className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>

                      <div className="text-right">
                        {item.product.has_discount ? (
                          <div>
                            <span className="text-lg font-bold text-[#E07A5F]">
                              {formatPrice(calculateItemTotal(item))}
                            </span>
                            <div className="text-xs text-gray-400 line-through">
                              {formatPrice(item.product.price * item.qty)}
                            </div>
                            <div className="text-xs text-green-600">Save {item.product.discount_rate}%</div>
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-gray-900">
                            {formatPrice(calculateItemTotal(item))}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">{formatPrice(calculateSubtotal())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (10%)</span>
                    <span className="font-medium text-gray-900">{formatPrice(calculateTax())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-green-600">Free</span>
                  </div>
                </div>

                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-semibold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-[#E07A5F]">{formatPrice(calculateTotal())}</span>
                  </div>
                </div>

                <button
                  className="w-full bg-gradient-to-r from-[#E07A5F] to-[#F4A261] text-white font-medium py-3 rounded-lg hover:opacity-90 transition-opacity mb-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                >
                  {isCheckingOut ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    "Proceed to Checkout"
                  )}
                </button>

                <Link to="/products">
                  <button className="w-full border border-gray-300 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50 transition-colors">
                    Continue Shopping
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-sm text-gray-500 mb-6">Add some products to your cart to see them here</p>
            <Link to="/products">
              <button className="bg-gradient-to-r from-[#E07A5F] to-[#F4A261] text-white px-6 py-2 rounded-md hover:opacity-90 transition-opacity">
                Browse Products
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default Cart