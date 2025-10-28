"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

interface Product {
  id: number
  name: string
  price: {
    original: number
    discounted_price: number
    has_discount: boolean
    discount_rate: number
  }
  product_thumbnail: string
  category: { id: number; name: string }
}

interface FavoriteItem {
  id: number
  product: Product
  created_at: string
}

const Favorites: React.FC = () => {
  const navigate = useNavigate()
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [removingId, setRemovingId] = useState<number | null>(null)

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://127.0.0.1:8000/api/favorites", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      const data = await response.json()
      if (response.ok) {
        const favs = data.data?.data || data.data || []
        setFavorites(favs)
      }
    } catch (err) {
      console.error("Error fetching favorites:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const removeFromFavorites = async (favoriteId: number) => {
    setRemovingId(favoriteId)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://127.0.0.1:8000/api/favorites/${favoriteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        setFavorites(favorites.filter((f) => f.id !== favoriteId))
      }
    } catch (err) {
      console.error("Error removing favorite:", err)
    } finally {
      setRemovingId(null)
    }
  }

  const addToCart = async (productId: number) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://127.0.0.1:8000/api/cart", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product_id: productId, qty: 1 }),
      })

      if (response.ok) alert("Product added to cart!")
    } catch (err) {
      console.error("Error adding to cart:", err)
    }
  }

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Favorites</h1>
        {favorites.length === 0 ? (
          <p className="text-gray-600">No favorite items yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {favorites.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow p-4 relative">
                <button
                  onClick={() => removeFromFavorites(item.id)}
                  disabled={removingId === item.id}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-600"
                >
                  {removingId === item.id ? "..." : "♥"}
                </button>

                <img
                  src={item.product.product_thumbnail}
                  className="w-full h-40 object-cover rounded mb-3"
                  alt={item.product.name}
                />
                <p className="font-medium">{item.product.name}</p>
                <p className="text-sm text-gray-500 mb-2">
                  {item.product.price.has_discount
                    ? item.product.price.discounted_price
                    : item.product.price.original}
                </p>
                <button
                  onClick={() => addToCart(item.product.id)}
                  className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 transition"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Favorites
