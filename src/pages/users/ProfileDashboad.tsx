"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { 
  User as UserIcon, 
  MapPin, 
  Camera, 
  Trash2, 
  LogOut, 
  Edit3, 
  CheckCircle, 
  AlertCircle,
  Plus,
  ArrowRight,
  ChevronRight,
  Globe
} from "lucide-react"

const API_BASE_URL = "http://127.0.0.1:8000/api"

interface User {
  id: number; name: string; email: string; phone?: string; gender?: string; avatar?: string; history?: string; roles?: Array<{ id: number; name: string }>
}
interface Address {
  id: number; name: string; email: string; phone: string; house_number: string; street_number: string;
  province: string | { id: number; name: string }; district: string | { id: number; name: string };
  commune: string | { id: number; name: string }; village: string | { id: number; name: string };
}
interface Province { id: number; name: string }
interface District { id: number; name: string }
interface Commune { id: number; name: string }
interface Village { id: number; name: string }

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({ name: "", phone: "", gender: "", history: "" })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>("")
  const [successMessage, setSuccessMessage] = useState("")
  const [activeTab, setActiveTab] = useState<"profile" | "address">("profile")
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isAddingAddress, setIsAddingAddress] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null)
  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [communes, setCommunes] = useState<Commune[]>([])
  const [villages, setVillages] = useState<Village[]>([])
  const [addressForm, setAddressForm] = useState({
    name: "", phone: "", house_number: "", street_number: "", province_id: "", district_id: "", commune_id: "", village_id: "",
  })

  useEffect(() => { 
    fetchUserProfile(); 
    fetchAddresses(); 
    fetchProvinces(); 
  }, [])

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) { window.location.href = "/sign-in"; return }
      const response = await fetch(`${API_BASE_URL}/profile`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Failed to fetch profile")
      
      const userData = data.data.user
      setUser(userData); 
      setFormData({ name: userData.name || "", phone: userData.phone || "", gender: userData.gender || "", history: userData.history || "" }); 
      setAvatarPreview(userData.avatar || "")
      
      localStorage.setItem("user", JSON.stringify(userData)); 
      window.dispatchEvent(new CustomEvent("profileUpdated"))
    } catch (err: any) { 
      setError(err.message); 
      if (err.message.includes("Unauthenticated")) { 
        localStorage.removeItem("token"); 
        localStorage.removeItem("user"); 
        window.location.href = "/sign-in" 
      } 
    } finally { setLoading(false) }
  }

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/addresses`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } })
      const data = await response.json()
      if (response.ok && data.data) setAddresses(Array.isArray(data.data) ? data.data : [data.data])
      else if (response.status === 404) setAddresses([])
    } catch (err: any) { setAddresses([]) }
  }

  const fetchProvinces = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/provinces`, { headers: { Accept: "application/json" } })
      const data = await response.json(); 
      const provinceData = data.data || data; 
      setProvinces(Array.isArray(provinceData) ? provinceData : [])
    } catch (err: any) { console.error(err) }
  }

  const fetchDistricts = async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/districts/${id}`, { headers: { Accept: "application/json" } })
    const data = await res.json(); const d = data.data || data; setDistricts(Array.isArray(d) ? d : [])
  }

  const fetchCommunes = async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/communes/${id}`, { headers: { Accept: "application/json" } })
    const data = await res.json(); const d = data.data || data; setCommunes(Array.isArray(d) ? d : [])
  }

  const fetchVillages = async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/villages/${id}`, { headers: { Accept: "application/json" } })
    const data = await res.json(); const d = data.data || data; setVillages(Array.isArray(d) ? d : [])
  }

  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === "province_id" && value) { setAddressForm(p => ({ ...p, province_id: value, district_id: "", commune_id: "", village_id: "" })); setDistricts([]); setCommunes([]); setVillages([]); fetchDistricts(value) }
    else if (name === "district_id" && value) { setAddressForm(p => ({ ...p, district_id: value, commune_id: "", village_id: "" })); setCommunes([]); setVillages([]); fetchCommunes(value) }
    else if (name === "commune_id" && value) { setAddressForm(p => ({ ...p, commune_id: value, village_id: "" })); setVillages([]); fetchVillages(value) }
    else setAddressForm(p => ({ ...p, [name]: value }))
  }

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault(); if (!addressForm.phone) { setError("Phone number is required"); return }
    try {
      const token = localStorage.getItem("token"); const endpoint = editingAddressId ? `${API_BASE_URL}/address` : `${API_BASE_URL}/addresses`
      const res = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(addressForm) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to save address")
      setSuccessMessage("Address saved!"); setIsAddingAddress(false); setEditingAddressId(null); fetchAddresses()
    } catch (err: any) { setError(err.message) }
  }

  const handleDeleteAddress = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/address`, { method: "DELETE", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } })
      if (!res.ok) throw new Error("Delete failed"); setSuccessMessage("Address deleted!"); fetchAddresses()
    } catch (err: any) { setError(err.message) }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target; setFormData(p => ({ ...p, [name]: value }))
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)) }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/profile`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(formData) })
      if (!res.ok) throw new Error("Update failed"); setSuccessMessage("Updated!"); setIsEditing(false); fetchUserProfile()
    } catch (err: any) { setError(err.message) }
  }

  const handleUpdateAvatar = async () => {
    if (!avatarFile) return
    try {
      const token = localStorage.getItem("token"); const f = new FormData(); f.append("avatar", avatarFile)
      const res = await fetch(`${API_BASE_URL}/profile/avatar`, { method: "POST", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, body: f })
      if (!res.ok) throw new Error("Avatar update failed"); setSuccessMessage("Avatar updated!"); setAvatarFile(null); fetchUserProfile()
    } catch (err: any) { setError(err.message) }
  }

  const handleDeleteAvatar = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/profile/avatar`, { method: "DELETE", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } })
      if (!res.ok) throw new Error("Delete failed"); setSuccessMessage("Avatar removed!"); fetchUserProfile()
    } catch (err: any) { setError(err.message) }
  }

  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); window.location.href = "/" }
  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  const handleBecomeSellerClick = () => { window.location.href = "/seller-request" }

  if (loading) return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading your profile...</p>
    </div>
  )

  if (!user) return <div className="p-10 text-center">User not found</div>

  // CHECK IF SELLER
  const isSeller = user.roles?.some(role => role.name.toLowerCase().includes("seller"));

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Toast Notifications */}
        <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 pointer-events-none">
          {error && (
            <div className="bg-red-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300 pointer-events-auto">
              <AlertCircle size={20} /> <span className="text-sm font-medium">{error}</span>
            </div>
          )}
          {successMessage && (
            <div className="bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300 pointer-events-auto">
              <CheckCircle size={20} /> <span className="text-sm font-medium">{successMessage}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Profile Card & Quick Actions */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-orange-400 to-pink-500"></div>
              <div className="px-6 pb-8 text-center">
                <div className="relative -mt-12 mb-4 inline-block">
                  <div className="p-1.5 bg-white rounded-full shadow-lg">
                    {avatarPreview && !avatarPreview.includes("no_photo.jpg") ? (
                      <img src={avatarPreview} alt="" className="w-28 h-28 rounded-full object-cover" />
                    ) : (
                      <div className="w-28 h-28 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-3xl font-bold">
                        {getInitials(user.name)}
                      </div>
                    )}
                  </div>
                  <label htmlFor="avatar-upload" className="absolute bottom-1 right-1 bg-white border border-slate-200 rounded-full p-2 shadow-md cursor-pointer hover:bg-slate-50 transition-colors">
                    <Camera size={18} className="text-orange-500" />
                    <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                </div>

                <h1 className="text-xl font-bold text-slate-800">{user.name}</h1>
                <p className="text-sm text-slate-500 mb-4">{user.email}</p>

                {/* Updated Role Badge Logic */}
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {user.roles?.map(role => {
                    const checkSeller = role.name.toLowerCase().includes("seller");
                    return (
                      <span key={role.id} className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full border ${
                        checkSeller 
                          ? "bg-emerald-500 text-white border-emerald-600 shadow-md" 
                          : "bg-orange-50 text-orange-600 border-orange-100"
                      }`}>
                        {role.name.replace("role_", "").replace("_", " ")}
                      </span>
                    );
                  })}
                </div>

                {avatarFile ? (
                  <div className="flex flex-col gap-2">
                    <button onClick={handleUpdateAvatar} className="w-full py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold shadow-orange-200 shadow-lg transition-transform active:scale-95">Save Photo</button>
                    <button onClick={() => { setAvatarFile(null); setAvatarPreview(user.avatar || "") }} className="text-xs text-slate-400 font-medium">Cancel</button>
                  </div>
                ) : user.avatar && !user.avatar.includes("no_photo.jpg") ? (
                  <button onClick={handleDeleteAvatar} className="text-xs text-red-400 font-medium hover:text-red-500 flex items-center justify-center gap-1 mx-auto">
                    <Trash2 size={12} /> Remove Avatar
                  </button>
                ) : null}
              </div>
            </div>

            {/* Dynamic Seller Banner / Dashboard */}
            {!isSeller ? (
              <button onClick={handleBecomeSellerClick} className="w-full group bg-slate-900 rounded-[2rem] p-6 text-left relative overflow-hidden transition-all hover:bg-slate-800">
                  <div className="relative z-10">
                    <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-1">Earning Program</p>
                    <h2 className="text-white font-bold text-lg mb-4 leading-tight">Start selling your <br/> products today</h2>
                    <span className="inline-flex items-center text-white text-sm font-semibold">Learn More <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform"/></span>
                  </div>
                  <div className="absolute top-0 right-0 opacity-10 translate-x-1/4 -translate-y-1/4">
                    <UserIcon size={120} className="text-white" />
                  </div>
              </button>
            ) : (
              <div className="w-full bg-emerald-600 rounded-[2rem] p-6 text-left relative overflow-hidden shadow-xl shadow-emerald-200/50 border border-emerald-500">
                <div className="relative z-10">
                  <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Business Account</p>
                  <h2 className="text-white font-black text-xl mb-4 leading-tight">Your Store <br/> is Active</h2>
                  <button onClick={() => window.location.href = "/seller"} className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-50 transition-all">
                    Go to Shop <ArrowRight size={14} />
                  </button>
                </div>
                <div className="absolute -bottom-4 -right-4 opacity-20">
                  <CheckCircle size={140} className="text-white" />
                </div>
              </div>
            )}

            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-4 text-slate-400 hover:text-red-500 font-semibold transition-colors">
              <LogOut size={18} /> Logout Account
            </button>
          </div>

          {/* Right Column: Content */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 min-h-[600px] flex flex-col">
              
              {/* Tab Navigation */}
              <div className="flex p-2 bg-slate-50/80 rounded-t-[2.5rem] border-b border-slate-100">
                <button onClick={() => setActiveTab("profile")} className={`flex-1 py-4 rounded-[1.8rem] text-sm font-bold transition-all ${activeTab === "profile" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                  Basic Info
                </button>
                <button onClick={() => setActiveTab("address")} className={`flex-1 py-4 rounded-[1.8rem] text-sm font-bold transition-all ${activeTab === "address" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                  Shipping Address
                </button>
              </div>

              <div className="p-6 md:p-10 flex-1">
                {activeTab === "profile" && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-bold text-slate-900">Personal Details</h3>
                      <button onClick={() => setIsEditing(!isEditing)} className={`p-2 rounded-xl transition-all ${isEditing ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                        {isEditing ? <Trash2 size={20} /> : <Edit3 size={20} />}
                      </button>
                    </div>

                    {isEditing ? (
                      <form onSubmit={handleUpdateProfile} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Full Name</label>
                            <input name="name" value={formData.name} onChange={handleInputChange} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-400/20 text-slate-700 font-medium transition-all" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Phone Number</label>
                            <input name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-400/20 text-slate-700 font-medium transition-all" />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Gender</label>
                            <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-400/20 text-slate-700 font-medium transition-all">
                              <option value="">Select Gender</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">About Me</label>
                            <textarea name="history" value={formData.history} onChange={handleInputChange} rows={4} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-400/20 text-slate-700 font-medium transition-all" placeholder="Tell us about yourself..." />
                          </div>
                        </div>
                        <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all">Save Changes</button>
                      </form>
                    ) : (
                      <div className="space-y-8">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="flex items-center gap-4 group">
                             <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                               <UserIcon size={22} />
                             </div>
                             <div>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone</p>
                               <p className="text-slate-700 font-semibold">{user.phone || "Not set"}</p>
                             </div>
                           </div>
                           <div className="flex items-center gap-4 group">
                             <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                               <Globe size={22} />
                             </div>
                             <div>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gender</p>
                               <p className="text-slate-700 font-semibold capitalize">{user.gender || "Not set"}</p>
                             </div>
                           </div>
                         </div>
                         <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Bio / History</p>
                           <p className="text-slate-600 leading-relaxed italic">"{user.history || "No information shared yet."}"</p>
                         </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "address" && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-bold text-slate-900">Your Locations</h3>
                      <button onClick={() => { setIsAddingAddress(true); setEditingAddressId(null); setAddressForm({ name: user?.name || "", phone: user?.phone || "", house_number: "", street_number: "", province_id: "", district_id: "", commune_id: "", village_id: "" }) }} className="flex items-center gap-2 text-sm font-bold text-orange-600 hover:text-orange-700">
                        <Plus size={18} /> New Address
                      </button>
                    </div>

                    {isAddingAddress ? (
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <form onSubmit={handleSaveAddress} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input placeholder="Full Name" name="name" value={addressForm.name} onChange={handleAddressInputChange} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-400/20 outline-none" />
                            <input placeholder="Phone" name="phone" value={addressForm.phone} onChange={handleAddressInputChange} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-400/20 outline-none" />
                            <input placeholder="House No." name="house_number" value={addressForm.house_number} onChange={handleAddressInputChange} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-400/20 outline-none" />
                            <input placeholder="Street No." name="street_number" value={addressForm.street_number} onChange={handleAddressInputChange} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-400/20 outline-none" />
                            <select name="province_id" value={addressForm.province_id} onChange={handleAddressInputChange} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none">
                              <option value="">Province</option>
                              {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <select name="district_id" value={addressForm.district_id} onChange={handleAddressInputChange} disabled={!addressForm.province_id} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none disabled:bg-slate-100">
                              <option value="">District</option>
                              {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                            <select name="commune_id" value={addressForm.commune_id} onChange={handleAddressInputChange} disabled={!addressForm.district_id} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none disabled:bg-slate-100">
                              <option value="">Commune</option>
                              {communes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select name="village_id" value={addressForm.village_id} onChange={handleAddressInputChange} disabled={!addressForm.commune_id} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none disabled:bg-slate-100">
                              <option value="">Village</option>
                              {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                          </div>
                          <div className="flex gap-3 mt-4">
                            <button type="submit" className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold">Save</button>
                            <button type="button" onClick={() => setIsAddingAddress(false)} className="flex-1 py-3 bg-slate-200 text-slate-600 rounded-xl font-bold">Cancel</button>
                          </div>
                        </form>
                      </div>
                    ) : addresses.length === 0 ? (
                      <div className="text-center py-20 flex flex-col items-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4">
                           <MapPin size={40} />
                        </div>
                        <p className="text-slate-400 font-medium">No saved addresses found.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {addresses.map(address => (
                          <div key={address.id} className="group p-5 bg-white border border-slate-100 rounded-[2rem] hover:border-orange-200 hover:bg-orange-50/30 transition-all flex flex-col md:flex-row gap-4 items-center">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-orange-500 transition-all">
                              <MapPin size={24} />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                              <h4 className="font-bold text-slate-800">{address.name}</h4>
                              <p className="text-xs text-slate-500 font-medium">{address.house_number}, St {address.street_number}, {typeof address.province === "object" ? address.province.name : address.province}</p>
                            </div>
                            <button onClick={handleDeleteAddress} className="p-3 text-slate-300 hover:text-red-500 transition-colors">
                               <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}