"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Grid3x3,
  Users,
  Menu,
  X,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const API_BASE_URL = "http://127.0.0.1:8000/api"

interface Role {
  id: number
  name: string
  [key: string]: any
}

interface User {
  id: number
  name: string
  email: string
  role?: string
  is_admin?: boolean | number | string
  roles?: Role[]
  [key: string]: any
}

interface Stats {
  totalUsers: number
  totalCategories: number
  pendingRequests: number
  totalOrders: number
}

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalCategories: 0,
    pendingRequests: 0,
    totalOrders: 0,
  })
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    const token = localStorage.getItem("token")
    const userStr = localStorage.getItem("user")

    console.log("=== ADMIN ACCESS CHECK START ===")
    console.log("Token exists:", !!token)
    console.log("User in localStorage:", userStr)

    if (!token) {
      console.log("No token found, redirecting to login")
      navigate("/login")
      return
    }

    try {
      let userData: User | null = null
      
      if (userStr) {
        try {
          userData = JSON.parse(userStr)
          console.log("Parsed user from localStorage:", userData)
          console.log("User roles from localStorage:", userData?.roles)
        } catch (parseError) {
          console.error("Error parsing localStorage user:", parseError)
        }
      }

      // Try to fetch fresh user data from API
      try {
        console.log("Fetching user from API...")
        const response = await fetch(`${API_BASE_URL}/user`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
        })

        console.log("API Response status:", response.status)
        const responseText = await response.text()
        console.log("API Response text:", responseText)

        if (response.ok && responseText) {
          const data = JSON.parse(responseText)
          console.log("Parsed API response:", data)
          
          userData = data.data || data.user || data
          console.log("Extracted user data:", userData)
          console.log("User roles from API:", userData?.roles)
        } else {
          console.warn("API call failed, using localStorage data")
        }
      } catch (apiError) {
        console.error("API fetch error:", apiError)
        console.log("Falling back to localStorage user data")
      }

      if (!userData) {
        console.log("No user data available, redirecting to login")
        navigate("/login")
        return
      }

      // Check admin status
      console.log("=== CHECKING ADMIN STATUS ===")
      console.log("User object keys:", Object.keys(userData))
      console.log("user.role:", userData.role)
      console.log("user.is_admin:", userData.is_admin)
      console.log("user.roles:", userData.roles)

      let hasAdminRole = false
      if (userData.roles && Array.isArray(userData.roles)) {
        console.log("Checking roles array:")
        userData.roles.forEach((role, index) => {
          console.log(`  Role ${index}:`, role)
          if (role.id === 3) {
            hasAdminRole = true
            console.log("  -> Found admin role (id: 3)!")
          }
        })
      } else {
        console.log("No roles array found or roles is not an array")
      }

      const roleIsAdmin = userData.role === "admin" || userData.role === "Admin"
      const isAdminFlag = userData.is_admin === true || 
                         userData.is_admin === 1 || 
                         userData.is_admin === "1" ||
                         userData.is_admin === "true"
      
      // Temporary: Check if email is admin email (since API doesn't return roles)
      const isAdminEmail = userData.email === "admin@gmail.com" || userData.email === "admin@kas.com"

      console.log("hasAdminRole (id 3):", hasAdminRole)
      console.log("roleIsAdmin:", roleIsAdmin)
      console.log("isAdminFlag:", isAdminFlag)
      console.log("isAdminEmail:", isAdminEmail)

      const isAdminUser = hasAdminRole || roleIsAdmin || isAdminFlag || isAdminEmail

      console.log("=== FINAL RESULT ===")
      console.log("Is admin user?", isAdminUser)

      if (!isAdminUser) {
        console.log("Access denied - not an admin")
        navigate("/")
        return
      }

      console.log("Admin access granted!")
      
      // Store role in localStorage for ProtectedRoute
      if (hasAdminRole || roleIsAdmin) {
        localStorage.setItem("role", "admin")
      }
      
      setUser(userData)
      setIsAdmin(true)
      
      await fetchDashboardData(token)
      
    } catch (error) {
      console.error("Unexpected error in checkAdminAccess:", error)
      navigate("/login")
    }
  }

  const fetchDashboardData = async (token: string) => {
    try {
      console.log("Fetching dashboard data...")
      
      const usersRes = await fetch(`${API_BASE_URL}/users`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        },
      })
      const usersData = await usersRes.json()
      console.log("Users data:", usersData)

      const categoriesRes = await fetch(`${API_BASE_URL}/categories`, {
        headers: { "Accept": "application/json" }
      })
      const categoriesData = await categoriesRes.json()
      console.log("Categories data:", categoriesData)

      const requestsRes = await fetch(`${API_BASE_URL}/seller_requests`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        },
      })
      const requestsData = await requestsRes.json()
      console.log("Requests data:", requestsData)

      // Handle different response structures
      const usersCount = Array.isArray(usersData.data) 
        ? usersData.data.length 
        : (usersData.data?.data ? Object.keys(usersData.data.data).length : 0)
      
      const categoriesCount = Array.isArray(categoriesData.data) 
        ? categoriesData.data.length 
        : (categoriesData.data?.data ? Object.keys(categoriesData.data.data).length : 0)
      
      // Handle requests data - could be array or object
      let pendingCount = 0
      if (requestsData.data) {
        if (Array.isArray(requestsData.data)) {
          pendingCount = requestsData.data.filter((r: any) => r.request_status === "pending").length
        } else if (typeof requestsData.data === 'object') {
          const requestsArray = Object.values(requestsData.data)
          pendingCount = requestsArray.filter((r: any) => r.request_status === "pending").length
        }
      }

      setStats({
        totalUsers: usersCount,
        totalCategories: categoriesCount,
        pendingRequests: pendingCount,
        totalOrders: 0,
      })
      
      console.log("Dashboard data loaded successfully")
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.removeItem("role")
    navigate("/login")
  }

  const navItems = [
    { icon: LayoutDashboard, label: "ផ្ទាំងគ្រប់គ្រង", labelEn: "Dashboard", path: "/admin" },
    { icon: Package, label: "ផលិតផល", labelEn: "Products", path: "/admin/products" },
    { icon: ShoppingCart, label: "ការកម្ម៉ង់", labelEn: "Orders", path: "/admin/orders" },
    { icon: Grid3x3, label: "ប្រភេទផលិតផល", labelEn: "Categories", path: "/admin/categories" },
    { icon: Users, label: "អតិថិជន", labelEn: "Customers", path: "/admin/customers" },
    { icon: ShoppingBag, label: "ពាក្យសុំក្លាយជាអ្នកលក់", labelEn: "Seller Requests", path: "/admin/seller-requests" },
    { icon: ShoppingBag, label: "ការគ្រប់គ្រងហាង", labelEn: "Shops", path: "/admin/shops" },
    { icon: TrendingUp, label: "បញ្ចីFaqs", labelEn: "FAQs", path: "/admin/faqs" },
    { icon: TrendingUp, label: "ពីសារទំនាក់ទំនង", labelEn: "Contact", path: "/admin/contact" },
  ]

  const salesData = [
    { month: "Jan", actual: 1800, projected: 1600 },
    { month: "Feb", actual: 2200, projected: 1900 },
    { month: "Mar", actual: 1900, projected: 2100 },
    { month: "Apr", actual: 2500, projected: 2300 },
    { month: "May", actual: 2300, projected: 2400 },
    { month: "Jun", actual: 2800, projected: 2600 },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-800 mb-2">Loading...</div>
          <div className="text-sm text-gray-600">Checking admin permissions</div>
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors mb-2"
              title={item.labelEn}
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 w-full transition-colors"
          >
            <X size={20} />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Overview</h2>
            <p className="text-gray-600">Welcome back, {user.name}! Here's what's happening today.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="text-green-600" size={24} />
                </div>
                <TrendingUp className="text-green-500" size={20} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.totalUsers}</h3>
              <p className="text-gray-600 text-sm">Total Users</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Grid3x3 className="text-blue-600" size={24} />
                </div>
                <TrendingUp className="text-blue-500" size={20} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.totalCategories}</h3>
              <p className="text-gray-600 text-sm">Categories</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <ShoppingBag className="text-orange-600" size={24} />
                </div>
                <TrendingDown className="text-orange-500" size={20} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.pendingRequests}</h3>
              <p className="text-gray-600 text-sm">Pending Requests</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <ShoppingCart className="text-purple-600" size={24} />
                </div>
                <TrendingUp className="text-purple-500" size={20} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.totalOrders}</h3>
              <p className="text-gray-600 text-sm">Total Orders</p>
            </div>
          </div>

          {/* Sales Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Sales Overview</h3>
              <p className="text-gray-600 text-sm">Monthly sales performance comparison</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} name="Actual Sales" />
                <Line type="monotone" dataKey="projected" stroke="#10b981" strokeWidth={2} name="Projected Sales" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard