"use client"

import type React from "react"
import { useState, useEffect } from "react"

const API_BASE_URL = "http://127.0.0.1:8000/api"

export default function VerifyOtpForm() {
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const savedEmail = sessionStorage.getItem("reset_email")
    if (savedEmail) {
      setEmail(savedEmail)
    }
  }, [])

  const handleChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`)
        nextInput?.focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    const otpCode = otp.join("")
    if (otpCode.length !== 6) {
      setError("Please enter all 6 digits")
      return
    }

    if (!email) {
      setError("Email is required. Please go back to forgot password.")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, otp: otpCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Invalid OTP")
      }

      sessionStorage.setItem("reset_otp", otpCode)

      setSuccess("OTP verified! Redirecting to reset password...")
      setTimeout(() => {
        window.location.href = "/reset-password"
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Invalid or expired OTP")
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
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Verify OTP</h1>
              <p className="text-sm text-gray-600">Enter the 6-digit code sent to your email</p>
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

              <div className="space-y-2">
                <label className="block text-sm text-gray-900">OTP Code</label>
                <div className="flex gap-2 justify-between">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      disabled={loading}
                      className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent disabled:bg-gray-100"
                      required
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#E57373] hover:bg-[#EF5350] text-white font-medium rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Didn't receive the code?{" "}
                <button type="button" className="text-gray-900 hover:underline font-medium">
                  Resend
                </button>
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
                <h3 className="font-semibold text-gray-900 mb-2">Secure Verification</h3>
                <p className="text-sm text-gray-600">
                  Enter the code we sent to your email to verify your identity and proceed with password reset.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
