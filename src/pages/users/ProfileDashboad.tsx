"use client"

import { useState, useEffect } from "react"
import type React from "react"

const API_BASE_URL = "http://127.0.0.1:8000/api"

interface User {
  id: number
  name: string
  email: string
  phone?: string
  gender?: string
  avatar?: string
  history?: string
  roles?: Array<{ id: number; name: string }>
}

interface Address {
  id: number
  name: string
  email: string
  phone: string
  house_number: string
  street_number: string
  province: string | { id: number; name: string }
  district: string | { id: number; name: string }
  commune: string | { id: number; name: string }
  village: string | { id: number; name: string }
}

interface Province {
  id: number
  name: string
}

interface District {
  id: number
  name: string
}

interface Commune {
  id: number
  name: string
}

interface Village {
  id: number
  name: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    gender: "",
    history: "",
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>("")
  const [successMessage, setSuccessMessage] = useState("")
  const [activeTab, setActiveTab] = useState<"profile" | "address">("profile")

  // Address states
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isAddingAddress, setIsAddingAddress] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null)
  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [communes, setCommunes] = useState<Commune[]>([])
  const [villages, setVillages] = useState<Village[]>([])
  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    house_number: "",
    street_number: "",
    province_id: "",
    district_id: "",
    commune_id: "",
    village_id: "",
  })

  useEffect(() => {
    fetchUserProfile()
    fetchAddresses()
    fetchProvinces()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        window.location.href = "/sign-in"
        return
      }

      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch profile")
      }

      const userData = data.data.user
      setUser(userData)
      setFormData({
        name: userData.name || "",
        phone: userData.phone || "",
        gender: userData.gender || "",
        history: userData.history || "",
      })
      setAvatarPreview(userData.avatar || "")

      localStorage.setItem("user", JSON.stringify(userData))
      window.dispatchEvent(new CustomEvent("profileUpdated"))
    } catch (err: any) {
      setError(err.message)
      if (err.message.includes("Unauthenticated")) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        window.location.href = "/sign-in"
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/addresses`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })

      const data = await response.json()
      console.log("Addresses response:", data)
      if (response.ok && data.data) {
        setAddresses(Array.isArray(data.data) ? data.data : [data.data])
      } else if (response.status === 404) {
        // No addresses found, that's okay
        setAddresses([])
      }
    } catch (err: any) {
      console.error("Failed to fetch addresses:", err)
      setAddresses([])
    }
  }

  const fetchProvinces = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/provinces`, {
        headers: {
          Accept: "application/json",
        },
      })
      const data = await response.json()
      console.log("Provinces response:", data)
      if (response.ok) {
        // Handle both wrapped and unwrapped responses
        const provinceData = data.data || data
        setProvinces(Array.isArray(provinceData) ? provinceData : [])
      }
    } catch (err: any) {
      console.error("Failed to fetch provinces:", err)
    }
  }

  const fetchDistricts = async (provinceId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/districts/${provinceId}`, {
        headers: {
          Accept: "application/json",
        },
      })
      const data = await response.json()
      console.log("[v0] Districts response:", data)
      if (response.ok) {
        const districtData = data.data || data
        setDistricts(Array.isArray(districtData) ? districtData : [])
      }
    } catch (err: any) {
      console.error("Failed to fetch districts:", err)
    }
  }

  const fetchCommunes = async (districtId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/communes/${districtId}`, {
        headers: {
          Accept: "application/json",
        },
      })
      const data = await response.json()
      console.log("[v0] Communes response:", data)
      if (response.ok) {
        const communeData = data.data || data
        setCommunes(Array.isArray(communeData) ? communeData : [])
      }
    } catch (err: any) {
      console.error("Failed to fetch communes:", err)
    }
  }

  const fetchVillages = async (communeId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/villages/${communeId}`, {
        headers: {
          Accept: "application/json",
        },
      })
      const data = await response.json()
      console.log("[v0] Villages response:", data)
      if (response.ok) {
        const villageData = data.data || data
        setVillages(Array.isArray(villageData) ? villageData : [])
      }
    } catch (err: any) {
      console.error("Failed to fetch villages:", err)
    }
  }

  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    if (name === "province_id" && value) {
      console.log("Province selected:", value)
      setAddressForm((prev) => ({
        ...prev,
        province_id: value,
        district_id: "",
        commune_id: "",
        village_id: "",
      }))
      setDistricts([])
      setCommunes([])
      setVillages([])
      fetchDistricts(value)
    } else if (name === "district_id" && value) {
      console.log("District selected:", value)
      setAddressForm((prev) => ({
        ...prev,
        district_id: value,
        commune_id: "",
        village_id: "",
      }))
      setCommunes([])
      setVillages([])
      fetchCommunes(value)
    } else if (name === "commune_id" && value) {
      console.log("Commune selected:", value)
      setAddressForm((prev) => ({
        ...prev,
        commune_id: value,
        village_id: "",
      }))
      setVillages([])
      fetchVillages(value)
    } else {
      setAddressForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")

    if (!addressForm.phone || addressForm.phone.trim() === "") {
      setError("Phone number is required")
      return
    }

    try {
      const token = localStorage.getItem("token")
      const endpoint = editingAddressId ? `${API_BASE_URL}/address` : `${API_BASE_URL}/addresses`
      const method = "POST"

      console.log("[v0] Submitting address form:", addressForm)

      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(addressForm),
      })

      const data = await response.json()

      console.log("[v0] Server response:", data)

      if (!response.ok) {
        if (data.data && typeof data.data === "object") {
          const errorMessages = Object.entries(data.data)
            .map(([field, messages]) => {
              const msgArray = Array.isArray(messages) ? messages : [messages]
              return `${field}: ${msgArray.join(", ")}`
            })
            .join("\n")
          throw new Error(errorMessages || data.message)
        }
        throw new Error(data.message || "Failed to save address")
      }

      setSuccessMessage(editingAddressId ? "Address updated successfully!" : "Address added successfully!")
      setIsAddingAddress(false)
      setEditingAddressId(null)
      setAddressForm({
        name: "",
        phone: "",
        house_number: "",
        street_number: "",
        province_id: "",
        district_id: "",
        commune_id: "",
        village_id: "",
      })
      fetchAddresses()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteAddress = async () => {
    setError("")
    setSuccessMessage("")

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/address`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete address")
      }

      setSuccessMessage("Address deleted successfully!")
      fetchAddresses()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")

    try {
      const token = localStorage.getItem("token")

      // Only send non-empty fields
      const updateData: any = {}
      if (formData.name) updateData.name = formData.name
      if (formData.phone) updateData.phone = formData.phone
      if (formData.gender) updateData.gender = formData.gender
      if (formData.history !== undefined) updateData.history = formData.history

      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      if (!response.ok) {
        // Show detailed error message
        const errorMsg = data.message || "Failed to update profile"
        const errors = data.errors ? Object.values(data.errors).flat().join(", ") : ""
        throw new Error(errors || errorMsg)
      }

      setSuccessMessage("Profile updated successfully!")
      setIsEditing(false)
      fetchUserProfile()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleUpdateAvatar = async () => {
    if (!avatarFile) return

    setError("")
    setSuccessMessage("")

    try {
      const token = localStorage.getItem("token")
      const formData = new FormData()
      formData.append("avatar", avatarFile)

      const response = await fetch(`${API_BASE_URL}/profile/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to update avatar")
      }

      setSuccessMessage("Avatar updated successfully!")
      setAvatarFile(null)
      fetchUserProfile()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteAvatar = async () => {
    setError("")
    setSuccessMessage("")

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/profile/avatar`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete avatar")
      }

      setSuccessMessage("Avatar deleted successfully!")
      setAvatarPreview("")
      fetchUserProfile()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.dispatchEvent(new Event("storage"))
    window.location.href = "/"
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleBecomeSellerClick = () => {
    window.location.href = "/seller-request"
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-400 border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <p className="text-gray-600 mb-4">Failed to load profile</p>
          <button
            onClick={() => (window.location.href = "/sign-in")}
            className="text-orange-500 hover:text-orange-600 font-semibold"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg shadow-sm animate-pulse">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg shadow-sm animate-pulse">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              {successMessage}
            </div>
          </div>
        )}

        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 h-32"></div>
          <div className="px-8 pb-8">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16">
              <div className="relative">
                {avatarPreview && !avatarPreview.includes("no_photo.jpg") ? (
                  <>
                    <img
                      src={avatarPreview || "/placeholder.svg"}
                      alt={user.name}
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                        const fallback = e.currentTarget.nextElementSibling
                        if (fallback) {
                          fallback.classList.remove("hidden")
                        }
                      }}
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                    />
                    <div className="hidden w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-xl">
                      {getInitials(user.name)}
                    </div>
                  </>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-xl">
                    {getInitials(user.name)}
                  </div>
                )}
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 transition-all hover:scale-110"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5 text-orange-500"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                    />
                  </svg>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.name}</h1>
                <p className="text-gray-600 mb-3">{user.email}</p>
                {user.roles && user.roles.length > 0 && (
                  <div className="flex gap-2 justify-center md:justify-start flex-wrap">
                    {user.roles.map((role) => (
                      <span
                        key={role.id}
                        className="px-4 py-1.5 bg-gradient-to-r from-orange-400 to-pink-400 text-white text-sm rounded-full font-medium shadow-md"
                      >
                        {role.name.replace("role_", "").replace("_", " ")}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="px-6 py-2.5 text-gray-700 hover:text-gray-900 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-medium hover:shadow-md"
              >
                Logout
              </button>
            </div>

            {avatarFile && (
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleUpdateAvatar}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                >
                  Upload Avatar
                </button>
                <button
                  onClick={() => {
                    setAvatarFile(null)
                    setAvatarPreview(user.avatar || "")
                  }}
                  className="px-6 py-2.5 text-gray-600 border-2 border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            )}

            {user.avatar && user.avatar !== "avatars/no_photo.jpg" && !avatarFile && (
              <button
                onClick={handleDeleteAvatar}
                className="mt-4 text-red-500 hover:text-red-600 text-sm font-medium hover:underline"
              >
                Remove Avatar
              </button>
            )}
          </div>
        </div>

        {/* Become a Seller Card */}
        <div className="bg-gradient-to-r from-orange-400 via-pink-400 to-purple-500 rounded-3xl shadow-2xl p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Ready to Start Selling?</h2>
              <p className="text-white/90">
                Join our marketplace and start earning by selling your products to thousands of customers worldwide.
              </p>
            </div>
            <button
              onClick={handleBecomeSellerClick}
              className="px-8 py-3 bg-white text-orange-500 rounded-xl font-bold hover:shadow-2xl transition-all hover:scale-105 whitespace-nowrap"
            >
              Become a Seller →
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-t-3xl shadow-lg">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-all ${
                activeTab === "profile"
                  ? "text-orange-500 border-b-4 border-orange-500 bg-orange-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab("address")}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-all ${
                activeTab === "address"
                  ? "text-orange-500 border-b-4 border-orange-500 bg-orange-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Address
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-3xl shadow-2xl p-8">
          {activeTab === "profile" && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Profile Details</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  {isEditing ? "Cancel" : "Edit Profile"}
                </button>
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-400 transition-all"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                    <textarea
                      name="history"
                      value={formData.history}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-400 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg transition-all hover:scale-[1.02]"
                  >
                    Save Changes
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-orange-50 to-pink-50 p-6 rounded-2xl">
                      <label className="block text-sm font-semibold text-gray-500 mb-2">Phone</label>
                      <p className="text-lg text-gray-900 font-medium">{user.phone || "Not provided"}</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-pink-50 p-6 rounded-2xl">
                      <label className="block text-sm font-semibold text-gray-500 mb-2">Gender</label>
                      <p className="text-lg text-gray-900 font-medium capitalize">{user.gender || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-pink-50 p-6 rounded-2xl">
                    <label className="block text-sm font-semibold text-gray-500 mb-2">Bio</label>
                    <p className="text-lg text-gray-900">{user.history || "No bio provided"}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "address" && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">My Addresses</h2>
                <button
                  onClick={() => {
                    setIsAddingAddress(true)
                    setEditingAddressId(null)
                    setAddressForm({
                      name: user?.name || "",
                      phone: user?.phone || "",
                      house_number: "",
                      street_number: "",
                      province_id: "",
                      district_id: "",
                      commune_id: "",
                      village_id: "",
                    })
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  + Add Address
                </button>
              </div>

              {isAddingAddress && (
                <div className="mb-8 p-6 bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl border-2 border-orange-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    {editingAddressId ? "Edit Address" : "Add New Address"}
                  </h3>
                  <form onSubmit={handleSaveAddress} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                        <input
                          type="text"
                          name="name"
                          value={addressForm.name}
                          onChange={handleAddressInputChange}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-400 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Phone <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={addressForm.phone}
                          onChange={handleAddressInputChange}
                          required
                          placeholder="e.g., 0123456789"
                          pattern="[0-9]{8,15}"
                          title="Please enter a valid phone number (8-15 digits)"
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-400 transition-all"
                        />
                        <p className="text-xs text-gray-500 mt-1">Enter 8-15 digit phone number</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">House Number</label>
                        <input
                          type="text"
                          name="house_number"
                          value={addressForm.house_number}
                          onChange={handleAddressInputChange}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-400 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Street Number</label>
                        <input
                          type="text"
                          name="street_number"
                          value={addressForm.street_number}
                          onChange={handleAddressInputChange}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-400 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Province</label>
                        <select
                          name="province_id"
                          value={addressForm.province_id}
                          onChange={handleAddressInputChange}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-400 transition-all"
                        >
                          <option value="">Select Province</option>
                          {provinces.map((province) => (
                            <option key={province.id} value={province.id}>
                              {province.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">District</label>
                        <select
                          name="district_id"
                          value={addressForm.district_id}
                          onChange={handleAddressInputChange}
                          required
                          disabled={!addressForm.province_id}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-400 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">Select District</option>
                          {districts.map((district) => (
                            <option key={district.id} value={district.id}>
                              {district.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Commune</label>
                        <select
                          name="commune_id"
                          value={addressForm.commune_id}
                          onChange={handleAddressInputChange}
                          required
                          disabled={!addressForm.district_id}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-400 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">Select Commune</option>
                          {communes.map((commune) => (
                            <option key={commune.id} value={commune.id}>
                              {commune.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Village</label>
                        <select
                          name="village_id"
                          value={addressForm.village_id}
                          onChange={handleAddressInputChange}
                          required
                          disabled={!addressForm.commune_id}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-400 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">Select Village</option>
                          {villages.map((village) => (
                            <option key={village.id} value={village.id}>
                              {village.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                      >
                        {editingAddressId ? "Update Address" : "Save Address"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingAddress(false)
                          setEditingAddressId(null)
                        }}
                        className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {addresses.length === 0 && !isAddingAddress ? (
                <div className="text-center py-12">
                  <svg
                    className="w-24 h-24 mx-auto text-gray-300 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <p className="text-gray-500 text-lg mb-4">No addresses saved yet</p>
                  <p className="text-gray-400">Add your first address to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className="bg-gradient-to-br from-orange-50 to-pink-50 p-6 rounded-2xl border-2 border-orange-200 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{address.name}</h4>
                            <p className="text-sm text-gray-600">{address.phone}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-gray-700">
                        <p>
                          <span className="font-semibold">House:</span> {address.house_number}
                        </p>
                        <p>
                          <span className="font-semibold">Street:</span> {address.street_number}
                        </p>
                        <p>
                          <span className="font-semibold">Village:</span>{" "}
                          {typeof address.village === "object" ? address.village.name : address.village}
                        </p>
                        <p>
                          <span className="font-semibold">Commune:</span>{" "}
                          {typeof address.commune === "object" ? address.commune.name : address.commune}
                        </p>
                        <p>
                          <span className="font-semibold">District:</span>{" "}
                          {typeof address.district === "object" ? address.district.name : address.district}
                        </p>
                        <p>
                          <span className="font-semibold">Province:</span>{" "}
                          {typeof address.province === "object" ? address.province.name : address.province}
                        </p>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={handleDeleteAddress}
                          className="flex-1 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
