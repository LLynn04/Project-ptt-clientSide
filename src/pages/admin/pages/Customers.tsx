"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Mail, Phone } from "lucide-react"

const API_BASE_URL = "http://127.0.0.1:8000/api"

interface User {
  id: number
  name: string
  email: string
  phone?: string
  gender?: string
  role?: string
  created_at: string
}

const Customers = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
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

  // Fetch users
  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const token = localStorage.getItem("token")
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setUsers(data.data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return <div className="text-center py-8">Loading customers...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Customers Management</h1>
        <p className="text-gray-600">Total customers: {users.length}</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{user.name}</h3>
                  {user.role && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        user.role === "admin" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {user.role}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail size={16} />
                <span>{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={16} />
                  <span>{user.phone}</span>
                </div>
              )}
              {user.gender && (
                <div className="text-sm text-gray-600">
                  Gender: <span className="font-medium">{user.gender}</span>
                </div>
              )}
              <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                Joined: {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Customers