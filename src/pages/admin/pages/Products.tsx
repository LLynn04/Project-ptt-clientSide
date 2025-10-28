"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Search } from "lucide-react"

const API_BASE_URL = "http://127.0.0.1:8000/api"

interface Product {
  id: number
  name: string
  price: number
  description?: string
  product_thumbnail?: string
  category_id: number
  created_at: string
}

const Products = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Check admin auth
  useEffect(() => {
    const checkAdmin = () => {
      const token = localStorage.getItem("token")
      const userStr = localStorage.getItem("user")

      if (!token || !userStr) {
        navigate("/login")
        return
      }

      try {
        const user = JSON.parse(userStr)
        
        // Check if user has role id 3 (admin)
        const hasAdminRole = user.roles && 
                            Array.isArray(user.roles) && 
                            user.roles.some((role: any) => role.id === 3)
        
        // Check other admin indicators
        const isAdmin = hasAdminRole || 
                       user.role === "admin" || 
                       user.is_admin === true ||
                       user.is_admin === 1 ||
                       user.email === "admin@gmail.com" ||
                       user.email === "admin@kas.com"

        if (!isAdmin) {
          navigate("/")
        }
      } catch (error) {
        console.error("Error checking admin:", error)
        navigate("/login")
      }
    }

    checkAdmin()
  }, [navigate])

  // Fetch products
  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products`)
      const data = await response.json()
      setProducts(data.data || [])
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))

  if (loading) {
    return <div className="text-center py-8">Loading products...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Products Management</h1>
        <p className="text-gray-600">Total products: {products.length}</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="aspect-square bg-gray-100 flex items-center justify-center">
              {product.product_thumbnail ? (
                <img
                  src={product.product_thumbnail || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-400">No image</div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1 truncate">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description || "No description"}</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-orange-600">${product.price.toFixed(2)}</span>
                <span className="text-xs text-gray-500">ID: {product.id}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Products