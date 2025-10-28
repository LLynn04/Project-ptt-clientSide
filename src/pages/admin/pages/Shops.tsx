"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Store, MapPin, Phone, Mail, Eye, Ban, CheckCircle } from "lucide-react"

const API_BASE_URL = "http://127.0.0.1:8000/api"

interface Shop {
  id: number
  user_id: number
  shop_name: string
  shop_description?: string
  shop_address?: string
  shop_phone?: string
  shop_email?: string
  shop_logo?: string
  status?: "active" | "inactive" | "suspended"
  created_at: string
  user?: {
    name: string
    email: string
  }
}

const Shops = () => {
  const navigate = useNavigate()
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

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
        
        const hasAdminRole = user.roles && 
                            Array.isArray(user.roles) && 
                            user.roles.some((role: any) => role.id === 3)
        
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

  useEffect(() => {
    fetchShops()
  }, [])

  const fetchShops = async () => {
    const token = localStorage.getItem("token")
    try {
      const response = await fetch(`${API_BASE_URL}/shops`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        },
      })
      const data = await response.json()
      
      // Handle different response structures
      let shopsData = []
      if (Array.isArray(data.data)) {
        shopsData = data.data
      } else if (typeof data.data === 'object' && data.data !== null) {
        shopsData = Object.values(data.data)
      }
      
      setShops(shopsData)
    } catch (error) {
      console.error("Error fetching shops:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (id: number, status: string) => {
    const token = localStorage.getItem("token")
    try {
      await fetch(`${API_BASE_URL}/shops/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        },
        body: JSON.stringify({ status }),
      })
      fetchShops()
    } catch (error) {
      console.error("Error updating shop:", error)
    }
  }

  const filteredShops = shops.filter((shop) => {
    const matchesSearch = 
      shop.shop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.shop_email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || shop.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700"
      case "inactive":
        return "bg-gray-100 text-gray-700"
      case "suspended":
        return "bg-red-100 text-red-700"
      default:
        return "bg-blue-100 text-blue-700"
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading shops...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Shops Management</h1>
        <p className="text-gray-600">Total shops: {shops.length}</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search shops..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Shops Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredShops.map((shop) => (
          <div
            key={shop.id}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Shop Header */}
            <div className="h-32 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
              {shop.shop_logo ? (
                <img src={shop.shop_logo} alt={shop.shop_name} className="h-20 w-20 rounded-full bg-white p-2" />
              ) : (
                <Store size={48} className="text-white" />
              )}
            </div>

            {/* Shop Info */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-lg text-gray-900">{shop.shop_name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(shop.status)}`}>
                  {shop.status || "active"}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {shop.shop_description || "No description"}
              </p>

              <div className="space-y-2 mb-4">
                {shop.shop_address && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={16} />
                    <span className="truncate">{shop.shop_address}</span>
                  </div>
                )}
                {shop.shop_phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={16} />
                    <span>{shop.shop_phone}</span>
                  </div>
                )}
                {shop.shop_email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={16} />
                    <span className="truncate">{shop.shop_email}</span>
                  </div>
                )}
              </div>

              {shop.user && (
                <div className="text-xs text-gray-500 border-t border-gray-100 pt-3 mb-3">
                  Owner: {shop.user.name}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {shop.status !== "active" && (
                  <button
                    onClick={() => handleStatusUpdate(shop.id, "active")}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-sm"
                  >
                    <CheckCircle size={16} />
                    Activate
                  </button>
                )}
                {shop.status === "active" && (
                  <button
                    onClick={() => handleStatusUpdate(shop.id, "suspended")}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm"
                  >
                    <Ban size={16} />
                    Suspend
                  </button>
                )}
                <button
                  onClick={() => navigate(`/shop/${shop.id}`)}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  <Eye size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredShops.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No shops found
        </div>
      )}
    </div>
  )
}

export default Shops