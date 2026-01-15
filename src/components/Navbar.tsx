"use client"

import { Link } from "react-router-dom"
import { useState, useEffect } from "react"

const Navbar = () => {
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cartCount, setCartCount] = useState(0)
  const [favCount, setFavCount] = useState(0)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const checkUserStatus = () => {
    const userData = localStorage.getItem("user")
    const token = localStorage.getItem("token")

    console.log("[Navbar] Checking user status:", {
      hasUserData: !!userData,
      hasToken: !!token,
      userDataLength: userData?.length,
      tokenPreview: token?.substring(0, 20) + "...",
    })

    if (userData && token) {
      try {
        const parsedUser = JSON.parse(userData)
        if (parsedUser.avatar && !parsedUser.avatar.startsWith("http")) {
          parsedUser.avatar = `http://127.0.0.1:8000/${parsedUser.avatar}`
        }
        setUser(parsedUser)
        console.log("[Navbar] User is logged in:", parsedUser)
        fetchCounts()
      } catch (e) {
        console.error("[Navbar] Error parsing user data:", e)
        console.error("[Navbar] Raw userData:", userData)
        setUser(null)
      }
    } else if (token && !userData) {
      console.warn("[Navbar] Token exists but no user data - fetching profile")
      fetchUserData(token)
    } else {
      console.log("[Navbar] No complete auth data in localStorage")
      setUser(null)
      fetchCounts()
    }
    setIsLoading(false)
  }

  const fetchUserData = async (token: string) => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch user data")
      }

      const data = await response.json()
      const userData = data.data?.user || data.user

      if (userData) {
        console.log("[Navbar] Avatar URL from API:", userData.avatar)
        if (userData.avatar && !userData.avatar.startsWith("http")) {
          userData.avatar = `http://127.0.0.1:8000/${userData.avatar}`
        }
        localStorage.setItem("user", JSON.stringify(userData))
        setUser(userData)
        console.log("[Navbar] User data fetched and saved:", userData)
        fetchCounts()
      }
    } catch (error) {
      console.error("[Navbar] Failed to fetch user data:", error)
      localStorage.removeItem("token")
      setUser(null)
    }
  }

  const fetchCounts = async () => {
    try {
      console.log("[Navbar] Fetching cart and favorites counts...")

      const token = localStorage.getItem("token")
      const headers: HeadersInit = {
        Accept: "application/json",
      }

      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const cartRes = await fetch("http://127.0.0.1:8000/api/cart", { headers })
      const cartData = await cartRes.json()
      console.log("[Navbar] Cart response:", cartData)

      if (cartRes.ok) {
        const cartItems = Array.isArray(cartData) ? cartData : cartData.data || []
        const newCartCount = cartItems.length
        console.log("[Navbar] Cart count:", newCartCount)
        setCartCount(newCartCount)
      }

      const favRes = await fetch("http://127.0.0.1:8000/api/favorites", { headers })
      const favData = await favRes.json()
      console.log("[Navbar] Favorites response:", favData)

      if (favRes.ok) {
        let favItems = []
        if (Array.isArray(favData)) {
          favItems = favData
        } else if (Array.isArray(favData.data)) {
          favItems = favData.data
        } else if (favData.data && typeof favData.data === "object") {
          favItems = favData.data.favorites || favData.data.items || Object.values(favData.data)
        }

        favItems = Array.isArray(favItems) ? favItems : []
        const newFavCount = favItems.length
        console.log("[Navbar] Favorites items:", favItems)
        console.log("[Navbar] Favorites count:", newFavCount)
        setFavCount(newFavCount)
      }
    } catch (error) {
      console.error("[Navbar] Failed to fetch counts:", error)
    }
  }

  useEffect(() => {
    checkUserStatus()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user" || e.key === "token" || e.key === null) {
        console.log("[Navbar] Storage changed:", e.key)
        checkUserStatus()
      }
    }

    const handleLoginEvent = () => {
      console.log("[Navbar] Login event received")
      checkUserStatus()
    }

    const handleCartUpdate = () => {
      console.log("[Navbar] Cart/Favorites updated event received")
      fetchCounts()
    }

    const handleProfileUpdate = () => {
      console.log("[Navbar] Profile updated event received")
      checkUserStatus()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("userLoggedIn", handleLoginEvent)
    window.addEventListener("cartUpdated", handleCartUpdate)
    window.addEventListener("profileUpdated", handleProfileUpdate)

    const interval = setInterval(() => {
      fetchCounts()
    }, 30000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("userLoggedIn", handleLoginEvent)
      window.removeEventListener("cartUpdated", handleCartUpdate)
      window.removeEventListener("profileUpdated", handleProfileUpdate)
      clearInterval(interval)
    }
  }, [])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.dispatchEvent(new Event("storage"))
    window.location.href = "/"
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      {/* TOP ROW: LOGO, SEARCH, AND ACTION ICONS */}
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="flex items-center justify-between h-16 gap-6">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:shadow-orange-500/50 transition-all">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <span className="text-xl font-semibold text-gray-900 group-hover:text-orange-600 transition-colors hidden md:block">
              FreshMarket
            </span>
          </Link>

          {/* Search Input with Image Search Icon Placeholder */}
          <div className="flex-1 max-w-2xl relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-12 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
            {/* Camera Icon for future Search by Image */}
            <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-orange-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a48.323 48.323 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </button>
          </div>

          {/* Icons Group */}
          <div className="flex items-center gap-4">
            <Link
              to="/favorites"
              className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all relative"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              {favCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg">
                  {favCount > 99 ? "99+" : favCount}
                </span>
              )}
            </Link>

            <Link
              to="/cart"
              className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all relative"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            {!isLoading && (
              <>
                {user ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      className="flex items-center gap-2 p-1.5 hover:bg-orange-50 rounded-xl transition-all group"
                    >
                      {user.avatar &&
                      !user.avatar.includes("no_photo.jpg") &&
                      user.avatar !== "avatars/no_photo.jpg" ? (
                        <img
                          src={user.avatar || "/placeholder.svg"}
                          alt={user.name}
                          onError={(e) => {
                            console.error("[Navbar] Failed to load avatar:", user.avatar)
                            e.currentTarget.style.display = "none"
                            const nextEl = e.currentTarget.nextElementSibling as HTMLElement
                            if (nextEl) nextEl.classList.remove("hidden")
                          }}
                          className="w-9 h-9 rounded-xl object-cover border-2 border-transparent group-hover:border-orange-500 transition-all shadow-sm"
                        />
                      ) : null}
                      <div
                        className={`w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm font-bold border-2 border-transparent group-hover:border-orange-500 transition-all shadow-sm ${user.avatar && !user.avatar.includes("no_photo.jpg") && user.avatar !== "avatars/no_photo.jpg" ? "hidden" : ""}`}
                      >
                        {getInitials(user.name)}
                      </div>
                    </button>

                    {showProfileMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-600 mt-0.5">{user.email}</p>
                          </div>

                          <div className="py-2">
                            <Link
                              to="/profile"
                              onClick={() => setShowProfileMenu(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all mx-2 rounded-lg"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                              <span className="font-medium">View Profile</span>
                            </Link>
                            <Link
                              to="/orders"
                              onClick={() => setShowProfileMenu(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all mx-2 rounded-lg"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 11-8 0 4 4 0 018 0zM5 9h14l1 12H4L5 9z" /></svg>
                              <span className="font-medium">My Orders</span>
                            </Link>
                            <Link
                              to="/settings"
                              onClick={() => setShowProfileMenu(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all mx-2 rounded-lg"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              <span className="font-medium">Settings</span>
                            </Link>
                          </div>

                          <div className="border-t border-gray-100 pt-2 mt-2">
                            <button
                              onClick={() => {
                                setShowProfileMenu(false)
                                handleLogout()
                              }}
                              className="flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-all mx-2 rounded-lg w-[calc(100%-1rem)]"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                              <span className="font-medium">Logout</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <Link
                    to="/sign-in"
                    className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: NAVIGATION MENU WITH BACKGROUND COLOR */}
      <div className="bg-gray-50/80 border-t border-gray-100">
        <div className="max-w-[1280px] mx-auto px-6 h-12 flex items-center gap-8">
          <Link to="/" className="text-gray-600 hover:text-orange-600 transition-colors font-medium text-sm">
            Home
          </Link>
          <Link to="/products" className="text-gray-600 hover:text-orange-600 transition-colors font-medium text-sm">
            Products
          </Link>
          <Link to="/about" className="text-gray-600 hover:text-orange-600 transition-colors font-medium text-sm">
            About
          </Link>
          <Link to="/contact" className="text-gray-600 hover:text-orange-600 transition-colors font-medium text-sm">
            Contact
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar