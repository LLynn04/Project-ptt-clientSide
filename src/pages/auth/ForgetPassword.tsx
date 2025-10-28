"use client"

import type React from "react"
import { useState } from "react"

const API_BASE_URL = "http://127.0.0.1:8000/api"

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP")
      }

      // Store email for next steps
      sessionStorage.setItem("reset_email", email)

      setSuccess("OTP sent! Check your email and enter the code.")
      // Redirect to OTP verification after 2 seconds
      setTimeout(() => {
        window.location.href = "/verify-otp"
      }, 2000)
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.")
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
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Forgot Password</h1>
              <p className="text-sm text-gray-600">Enter your email to receive a reset link</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">{error}</div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
                {success}
              </div>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full h-11 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#E57373] hover:bg-[#EF5350] text-white font-medium rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Remember your password?{" "}
                <a href="/login" className="text-gray-900 hover:underline font-medium">
                  Sign in
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
                <h3 className="font-semibold text-gray-900 mb-2">Secure Password Reset</h3>
                <p className="text-sm text-gray-600">
                  We'll send you a secure link to reset your password and regain access to your account.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
