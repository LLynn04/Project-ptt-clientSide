"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Heart } from "lucide-react"

interface ProductCardProps {
  product: {
    id: number
    name: string
    description: string
    product_thumbnail: string
    price: {
      original: number
      discounted_price: number
      has_discount: boolean
      discount_rate: number
    }
    stock_status: string
    shop: { id: number; name: string }
    promotions: {
      id: number
      name: string
      discount_rate: string
    }[]
    rating: {
      average: number
      count: number
    }
  }
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate() // ✅ for navigation
  const { id, name, product_thumbnail, price, promotions, shop, rating, stock_status } = product

  const [isFavorite, setIsFavorite] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isAddingToFav, setIsAddingToFav] = useState(false)

  const isOnSale = promotions && promotions.length > 0

  useEffect(() => {
    checkIfFavorite()
  }, [id])

  const checkIfFavorite = async () => {
    try {
      const token = localStorage.getItem("token")
      const headers: HeadersInit = { Accept: "application/json" }

      if (token) headers["Authorization"] = `Bearer ${token}`

      const response = await fetch("http://127.0.0.1:8000/api/favorites", { headers })
      if (response.ok) {
        const data = await response.json()
        let favorites = []
        if (Array.isArray(data)) favorites = data
        else if (data.data && Array.isArray(data.data)) favorites = data.data
        else if (data.data && typeof data.data === "object")
          favorites = Object.values(data.data).filter((item) => typeof item === "object")

        const isFav = favorites.some((fav: any) => fav.product?.id === id || fav.product_id === id)
        setIsFavorite(isFav)
      }
    } catch (error) {
      console.error("Error checking favorite:", error)
    }
  }

  const handleCardClick = () => {
    navigate(`/products/${id}`) // ✅ Go to detail page
  }

  const addToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation() // ✅ prevent triggering card click

    if (stock_status !== "In Stock") {
      showToast("This product is out of stock!", "bg-red-500")
      return
    }

    setIsAddingToCart(true)
    try {
      const token = localStorage.getItem("token")
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        Accept: "application/json",
      }

      if (token) headers["Authorization"] = `Bearer ${token}`

      const response = await fetch("http://127.0.0.1:8000/api/cart", {
        method: "POST",
        headers,
        body: JSON.stringify({ product_id: id, qty: 1 }),
      })

      const result = await response.json()
      if (response.ok) {
        window.dispatchEvent(new CustomEvent("cartUpdated"))
        showToast("Added to cart!", "bg-green-500")
      } else {
        showToast(result.message || "Failed to add to cart", "bg-red-500")
      }
    } catch (error) {
      showToast("Failed to add to cart", "bg-red-500")
    } finally {
      setIsAddingToCart(false)
    }
  }

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation() // ✅ prevent triggering card click

    setIsAddingToFav(true)
    try {
      const token = localStorage.getItem("token")
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        Accept: "application/json",
      }
      if (token) headers["Authorization"] = `Bearer ${token}`

      if (isFavorite) {
        const response = await fetch(`http://127.0.0.1:8000/api/favorites/remove`, {
          method: "POST",
          headers,
          body: JSON.stringify({ product_id: id }),
        })
        if (response.ok) {
          setIsFavorite(false)
          showToast("Removed from favorites", "bg-gray-600")
        }
      } else {
        const response = await fetch("http://127.0.0.1:8000/api/favorites", {
          method: "POST",
          headers,
          body: JSON.stringify({ product_id: id }),
        })
        if (response.ok) {
          setIsFavorite(true)
          showToast("Added to favorites!", "bg-red-500")
        }
      }
    } catch (error) {
      showToast("Error updating favorites", "bg-red-500")
    } finally {
      setIsAddingToFav(false)
    }
  }

  const showToast = (message: string, bgColor: string) => {
    const toast = document.createElement("div")
    toast.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-[9999] animate-fade-in`
    toast.textContent = message
    document.body.appendChild(toast)
    setTimeout(() => {
      toast.style.opacity = "0"
      toast.style.transform = "translateY(-20px)"
      setTimeout(() => toast.remove(), 300)
    }, 2000)
  }

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-2xl shadow hover:shadow-lg transition-all duration-300 overflow-hidden group relative cursor-pointer"
    >
      {/* ❤️ Favorite Button */}
      <button
        onClick={toggleFavorite}
        disabled={isAddingToFav}
        className={`absolute top-3 right-3 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-lg ${
          isFavorite
            ? "bg-red-500 text-white scale-110"
            : "bg-white text-gray-600 hover:bg-red-50 hover:text-red-500 hover:scale-110"
        }`}
      >
        {isAddingToFav ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <Heart size={18} className={isFavorite ? "fill-current" : ""} strokeWidth={2} />
        )}
      </button>

      {/* 🖼️ Image */}
      <div className="relative w-full h-52 overflow-hidden bg-gray-100">
        <img
          src={product_thumbnail || "/placeholder.svg"}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {isOnSale && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-lg shadow-md z-10">
            {promotions[0].name}
          </div>
        )}
        {stock_status !== "In Stock" && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
            <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold shadow-lg">Out of Stock</span>
          </div>
        )}
      </div>

      {/* 🛒 Product Info */}
      <div className="p-4 flex flex-col gap-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">{shop?.name || "Unknown Shop"}</p>
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2">{name}</h3>

          <div className="flex items-center gap-1 mb-2">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i < Math.round(rating?.average || 0) ? "text-yellow-400" : "text-gray-300"}>
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs text-gray-500">({rating?.count || 0})</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">${price?.discounted_price || price?.original || 0}</span>
            {price?.has_discount && (
              <span className="text-sm text-gray-400 line-through">${price?.original || 0}</span>
            )}
          </div>
        </div>

        {/* 🛒 Add to Cart */}
        <button
          onClick={addToCart}
          disabled={isAddingToCart || stock_status !== "In Stock"}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
            stock_status !== "In Stock"
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : isAddingToCart
              ? "bg-gray-400 text-white"
              : "bg-gradient-to-r from-[#E07A5F] to-[#F4A261] text-white hover:opacity-90"
          }`}
        >
          {isAddingToCart ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Adding...
            </div>
          ) : (
            "Add to Cart"
          )}
        </button>
      </div>
    </div>
  )
}

export default ProductCard
