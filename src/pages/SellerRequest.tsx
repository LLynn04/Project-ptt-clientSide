"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { 
  User, 
  Store, 
  CreditCard, 
  MapPin, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ChevronRight,
  ShieldCheck
} from "lucide-react"

const API_BASE_URL = "http://127.0.0.1:8000/api"

export default function SellerRequest() {
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  // New state to hold specific field errors from Laravel
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [successMessage, setSuccessMessage] = useState("")
  
  const [sellerRequestData, setSellerRequestData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    shop_name: "",
    bank_name: "",
    account_name: "",
    account_number: "",
    iban: "",
    swift_code: "",
    address: "",
    description: "",
  })

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      window.location.href = "/sign-in"
      return
    }
    setLoading(false)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setSellerRequestData((prev) => ({ ...prev, [name]: value }))
    // Clear field error when user starts typing again
    if (fieldErrors[name]) {
      const newErrors = { ...fieldErrors }
      delete newErrors[name]
      setFieldErrors(newErrors)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setFieldErrors({}) // Reset specific errors
    setSuccessMessage("")
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("token")

      const response = await fetch(`${API_BASE_URL}/seller_requests`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(sellerRequestData),
      })

      const data = await response.json()

      if (!response.ok || data.result === false) {
        // Handle the specific Postman sample structure you provided
        if (data.data && typeof data.data === 'object') {
          setFieldErrors(data.data)
          throw new Error(data.message || "Invalid input data")
        }
        throw new Error(data.message || "Failed to submit seller request")
      }

      setSuccessMessage("Application submitted! We will review your shop details shortly.")

      setSellerRequestData({
        first_name: "", last_name: "", phone: "", shop_name: "",
        bank_name: "", account_name: "", account_number: "",
        iban: "", swift_code: "", address: "", description: "",
      })

      setTimeout(() => {
        window.location.href = "/profile"
      }, 2500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-white">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Verifying Session</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => (window.location.href = "/profile")}
            className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-all font-bold text-sm"
          >
            <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-slate-50 transition-colors">
               <ArrowLeft size={18} />
            </div>
            Back to Dashboard
          </button>
          
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-full border border-orange-100">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Identity Secured</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Grow your business <br/> with our <span className="text-orange-500">Marketplace</span>
          </h1>
          <p className="text-slate-500 max-w-lg mx-auto font-medium">
            Join thousands of successful sellers. Complete your business application to get started.
          </p>
        </div>

        {/* Notification Toasts */}
        <div className="space-y-4 mb-8">
          {error && (
            <div className="p-4 bg-white border-l-4 border-red-500 rounded-2xl shadow-xl flex items-center gap-4 animate-in slide-in-from-top-4">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center shrink-0">
                <AlertCircle className="text-red-500" size={20} />
              </div>
              <p className="text-red-800 text-sm font-bold">{error}</p>
            </div>
          )}
          {successMessage && (
            <div className="p-6 bg-slate-900 text-white rounded-3xl shadow-2xl flex flex-col items-center text-center gap-4 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Application Received!</h3>
                <p className="text-slate-400 text-sm">{successMessage}</p>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 animate-[progress_2.5s_linear]" style={{ width: '100%' }}></div>
              </div>
            </div>
          )}
        </div>

        {!successMessage && (
          <form onSubmit={handleSubmit} className="space-y-8 pb-20">
            
            {/* Step 1: Owner Profile */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
                  <User size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Personal Profile</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Business Owner Details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                  <input name="first_name" value={sellerRequestData.first_name} onChange={handleInputChange} required className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-orange-200 focus:bg-white rounded-2xl outline-none font-semibold transition-all" placeholder="John" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                  <input name="last_name" value={sellerRequestData.last_name} onChange={handleInputChange} required className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-orange-200 focus:bg-white rounded-2xl outline-none font-semibold transition-all" placeholder="Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Phone</label>
                  <input name="phone" value={sellerRequestData.phone} onChange={handleInputChange} required className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl outline-none font-semibold transition-all ${fieldErrors.phone ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-orange-200 focus:bg-white'}`} placeholder="012345678" />
                  {fieldErrors.phone && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 uppercase">{fieldErrors.phone[0]}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Shop Name</label>
                  <input name="shop_name" value={sellerRequestData.shop_name} onChange={handleInputChange} required className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl outline-none font-semibold transition-all ${fieldErrors.shop_name ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-orange-200 focus:bg-white text-orange-600'}`} placeholder="Acme Store Co." />
                  {fieldErrors.shop_name && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 uppercase">{fieldErrors.shop_name[0]}</p>}
                </div>
              </div>
            </div>

            {/* Step 2: Financial Setup */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100 relative overflow-hidden">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                  <CreditCard size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Payout Account</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Where you'll receive earnings</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bank Name</label>
                  <input name="bank_name" value={sellerRequestData.bank_name} onChange={handleInputChange} required className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-200 focus:bg-white rounded-2xl outline-none font-semibold transition-all" placeholder="Global Reserve Bank" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Holder Name</label>
                  <input name="account_name" value={sellerRequestData.account_name} onChange={handleInputChange} required className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-200 focus:bg-white rounded-2xl outline-none font-semibold transition-all" placeholder="FULL LEGAL NAME" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Number</label>
                  <input name="account_number" value={sellerRequestData.account_number} onChange={handleInputChange} required className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-200 focus:bg-white rounded-2xl outline-none font-semibold transition-all" placeholder="0000 0000 0000" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">IBAN (Optional)</label>
                  <input name="iban" value={sellerRequestData.iban} onChange={handleInputChange} className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-200 focus:bg-white rounded-2xl outline-none font-semibold transition-all" placeholder="International Format" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SWIFT / BIC (Optional)</label>
                  <input name="swift_code" value={sellerRequestData.swift_code} onChange={handleInputChange} className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-200 focus:bg-white rounded-2xl outline-none font-semibold transition-all" placeholder="Bank SWIFT Code" />
                </div>
              </div>
            </div>

            {/* Step 3: Business Identity */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                  <Store size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Business Verification</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Office & Story</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Physical Business Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input name="address" value={sellerRequestData.address} onChange={handleInputChange} required className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-200 focus:bg-white rounded-2xl outline-none font-semibold transition-all" placeholder="123 Business St, Suite 100..." />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Shop Description & Mission</label>
                  <textarea name="description" value={sellerRequestData.description} onChange={handleInputChange} required rows={5} className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-200 focus:bg-white rounded-[2rem] outline-none font-semibold transition-all resize-none" placeholder="What will you sell? Tell us your story..." />
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col md:flex-row gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] flex items-center justify-center gap-3 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-slate-200 hover:bg-orange-500 transition-all disabled:bg-slate-300 disabled:scale-100 active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Processing Application...
                  </>
                ) : (
                  <>
                    Apply for Seller Access
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => (window.location.href = "/profile")}
                className="flex-1 py-5 bg-white text-slate-400 border border-slate-100 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-50 hover:text-slate-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
      
      <div className="fixed top-0 right-0 -z-10 p-20 opacity-[0.03] pointer-events-none">
        <Store size={400} />
      </div>
    </div>
  )
}