"use client"

import type React from "react"
import { useState } from "react"

const API_BASE_URL = "http://127.0.0.1:8000/api"

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Login failed")
      }

      console.log("[LoginForm] API Response:", data)

      // Store token and user data - handle different response structures
      const token = data.data?.token || data.token
      const user = data.data?.user || data.user

      if (token) {
        localStorage.setItem("token", token)
        console.log("[LoginForm] Token saved:", token)
      }

      if (user) {
        localStorage.setItem("user", JSON.stringify(user))
        console.log("[LoginForm] User saved:", user)
      } else {
        console.warn("[LoginForm] No user data in response, fetching profile...")
        // If no user in response, fetch profile immediately
        if (token) {
          try {
            const profileResponse = await fetch(`${API_BASE_URL}/profile`, {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            })
            const profileData = await profileResponse.json()
            if (profileData.data?.user) {
              localStorage.setItem("user", JSON.stringify(profileData.data.user))
              console.log("[LoginForm] User fetched from profile:", profileData.data.user)
            }
          } catch (error) {
            console.error("[LoginForm] Failed to fetch profile:", error)
          }
        }
      }

      // Dispatch custom event to notify navbar
      window.dispatchEvent(new Event("userLoggedIn"))
      window.dispatchEvent(new Event("storage"))

      // Redirect to profile
      window.location.href = "/profile"
    } catch (err: any) {
      setError(err.message || "Invalid email or password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center py-12">
      <div className="w-full max-w-5xl bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Left side - Form */}
          <div className="p-8 md:p-12">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Welcome Back</h1>
              <p className="text-sm text-gray-600">Sign in to your account to continue</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm text-gray-900">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  className="w-full h-11 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E07A5F] focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm text-gray-900">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  className="w-full h-11 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E07A5F] focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#E07A5F] hover:bg-[#D06A4F] text-white font-medium rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600">
                <a href="/forgot-password" className="text-gray-900 hover:underline font-medium">
                  Forgot password?
                </a>
              </p>
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <a href="/sign-up" className="text-gray-900 hover:underline font-medium">
                  Register
                </a>
              </p>
            </div>
          </div>

          {/* Right side - Image/Illustration section */}
          <div className="hidden md:flex bg-gray-50 p-12 items-center justify-center">
            <div className="space-y-6 max-w-sm">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-center mb-4">
                  <img
                    src="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80"
                    alt="Fresh vegetables"
                    className="w-full h-48 rounded-lg object-cover"
                  />
                </div>
                <div className="text-center">
                  <div className="flex justify-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400">
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">
                    "This platform has transformed how we manage our business. Highly recommended!"
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Start Shopping Today</h3>
                <p className="text-sm text-gray-600">
                  Get access to exclusive deals and personalized recommendations tailored just for you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}