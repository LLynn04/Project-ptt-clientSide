"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Heart, Eye, ShoppingCart } from "lucide-react"

interface ProductCardProps {
  product: {
    id: number
    name: string
    description: string
    product_thumbnail: string
    qty_in_stock: number // Added this to interface
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
  const navigate = useNavigate()
  const { id, name, product_thumbnail, price, promotions, shop, rating, stock_status, qty_in_stock } = product

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
        let favorites: any[] = []
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
    navigate(`/products/${id}`)
  }

  const addToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // UPDATED: Check qty instead of string
    if (qty_in_stock <= 0) {
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
    e.stopPropagation()
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
      className="bg-[#FAF7F2] rounded-none overflow-hidden group cursor-pointer flex flex-col h-full transition-all duration-300 snap-start"
    >
      {/* 🖼️ Image Section - NO PADDING, FULL FIT */}
      <div className="relative w-full aspect-square bg-gray-200 overflow-hidden">
        <img
          src={product_thumbnail || "/placeholder.svg"}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
        />

        {/* Dynamic Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {isOnSale && (
            <span className="bg-[#C19A6B] text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full shadow-sm">
              {promotions[0].name}
            </span>
          )}
          {price?.has_discount && (
            <span className="bg-[#D4A373] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
              {price.discount_rate}% OFF
            </span>
          )}
        </div>

        {/* Action Overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/10 z-10">
          <button 
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#C19A6B] hover:text-white transition-all transform hover:scale-110"
            title="Quick View"
          >
            <Eye size={18} />
          </button>
          
          <button 
            onClick={toggleFavorite}
            disabled={isAddingToFav}
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-110 ${
              isFavorite ? "bg-[#C19A6B] text-white" : "bg-white text-gray-700 hover:bg-[#C19A6B] hover:text-white"
            }`}
          >
            {isAddingToFav ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Heart size={18} className={isFavorite ? "fill-current" : ""} />
            )}
          </button>

          <button 
            onClick={addToCart}
            // UPDATED: Check qty instead of string
            disabled={isAddingToCart || qty_in_stock <= 0}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#C19A6B] hover:text-white transition-all transform hover:scale-110"
          >
             {isAddingToCart ? (
                <div className="w-4 h-4 border-2 border-[#C19A6B] border-t-transparent rounded-full animate-spin" />
             ) : (
                <ShoppingCart size={18} />
             )}
          </button>
        </div>

        {/* Sold Out Overlay */}
        {/* UPDATED: Check qty instead of string */}
        {qty_in_stock <= 0 && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-20">
            <span className="border-2 border-gray-800 text-gray-800 text-xs font-bold uppercase tracking-widest px-4 py-2">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* 📝 Product Details */}
      <div className="pt-5 pb-4 px-2 flex flex-col items-center text-center">
        <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate w-full uppercase tracking-tight">
          {name}
        </h3>
        
        {/* Rating Stars */}
        <div className="flex text-[#E6B17A] text-[10px] mb-2">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="mx-0.5">
              {i < Math.round(rating?.average || 0) ? "★" : "☆"}
            </span>
          ))}
        </div>

        {/* Price */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-[#C19A6B]">
            USD {price?.discounted_price || price?.original || 0}.00
          </span>
          {price?.has_discount && (
            <span className="text-xs text-gray-400 line-through">
              USD {price?.original || 0}.00
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductCard