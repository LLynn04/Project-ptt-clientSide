"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ChevronLeft, Star, Heart, ShoppingCart, Plus, Minus, Share2 } from "lucide-react"

interface Product {
  id: number
  name: string
  description: string
  product_thumbnail: string
  product_images: Array<{ id: number; image_url: string }>
  qty_in_stock: number
  stock_status: string
  shop_name: string
  rating: number
  review_count: number
  price: {
    original: number
    discounted_price: number
    has_discount: boolean
    discount_rate: number
  }
  is_favorite: boolean
  category_name: string
  unit_name: string
}

interface RelatedProduct {
  id: number
  name: string
  product_thumbnail: string
  rating: number
  price: {
    original: number
    discounted_price: number
    has_discount: boolean
    discount_rate: number
  }
  unit_name: string
}

interface Review {
  id: number
  user_name?: string
  rating: number
  comment?: string
  created_at?: string
}

const ProductsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState<string>("")
  const [isFavorite, setIsFavorite] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewRating, setReviewRating] = useState<number>(5)
  const [reviewText, setReviewText] = useState<string>("")
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem("token")

        const response = await fetch(`http://127.0.0.1:8000/api/products/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) throw new Error("Failed to fetch product")
        const data = await response.json()

        if (data.result) {
          const prod = data.data.product
          setProduct({
            ...prod,
            shop_name: prod.shop?.name || "",
            unit_name: prod.product_units?.name || "",
            rating: prod.rating?.average || 0,
            review_count: prod.rating?.count || 0,
            is_favorite: prod.is_favorited,
          })
          setSelectedImage(prod.product_thumbnail)
          setIsFavorite(prod.is_favorited)
          if (prod.shop?.name) fetchRelatedProducts(prod.shop.name)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchProduct()
  }, [id])

  // Fetch related products
  const fetchRelatedProducts = async (shopName: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://127.0.0.1:8000/api/products?shop=${shopName}&limit=5`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.result && data.data) {
          setRelatedProducts(
            data.data
              .filter((p: RelatedProduct) => p.id !== Number(id))
              .map((p: any) => ({
                ...p,
                unit_name: p.product_units?.name || "",
                rating: p.rating?.average || 0,
              }))
          )
        }
      }
    } catch (err) {
      console.error("Error fetching related products:", err)
    }
  }

  // Reviews: fetch by product id
  useEffect(() => {
    if (!id) return
    fetchReviews()
  }, [id])

  const fetchReviews = async () => {
    setReviewsLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`http://127.0.0.1:8000/api/products/${id}/reviews`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          Accept: "application/json",
        },
      })
      if (!res.ok) {
        setReviews([])
        return
      }
      const data = await res.json()
      if (data && data.data && Array.isArray(data.data)) {
        setReviews(
          data.data.map((r: any) => ({
            id: r.id,
            user_name: r.user?.name || r.user_name || "Anonymous",
            rating: Number(r.rating) || 0,
            comment: r.comment || r.body || "",
            created_at: r.created_at,
          }))
        )
      } else {
        setReviews([])
      }
    } catch (err) {
      console.error("Failed to fetch reviews:", err)
      setReviews([])
    } finally {
      setReviewsLoading(false)
    }
  }

  const handleSubmitReview = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!id) return
    setReviewError(null)
    if (reviewRating < 1 || reviewRating > 5) {
      setReviewError("Rating must be between 1 and 5")
      return
    }
    setSubmittingReview(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`http://127.0.0.1:8000/api/products/${id}/reviews`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewText,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setReviewError(data?.message || "Failed to submit review")
        return
      }

      const newReview: Review = {
        id: data?.data?.id || Date.now(),
        user_name: data?.data?.user?.name || "You",
        rating: reviewRating,
        comment: reviewText,
        created_at: data?.data?.created_at || new Date().toISOString(),
      }
      setReviews((prev) => [newReview, ...prev])
      setReviewText("")
      setReviewRating(5)
      if (product) {
        const newCount = (product.review_count || 0) + 1
        const newAvg = ((product.rating || 0) * (product.review_count || 0) + reviewRating) / newCount
        setProduct({ ...product, review_count: newCount, rating: Number(newAvg.toFixed(1)) })
      }
    } catch (err) {
      console.error("Error submitting review:", err)
      setReviewError("Failed to submit review")
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleAddToCart = async () => {
    if (addingToCart) return
    try {
      setAddingToCart(true)
      const token = localStorage.getItem("token")

      const response = await fetch("http://127.0.0.1:8000/api/cart", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: Number(id),
          qty: quantity,
        }),
      })

      const data = await response.json()
      if (response.ok) alert("Added to cart successfully!")
      else alert(data.message || "Failed to add to cart")
    } catch (err) {
      console.error("Error adding to cart:", err)
    } finally {
      setAddingToCart(false)
    }
  }

  const handleToggleFavorite = async () => {
    try {
      const token = localStorage.getItem("token")

      const response = await fetch("http://127.0.0.1:8000/api/favorites/toggle", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product_id: Number(id) }),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.message || "Failed to update favorites")
        return
      }

      setIsFavorite(!isFavorite)
    } catch (err) {
      console.error("Error toggling favorite:", err)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]"><div className="w-12 h-12 border-4 border-[#C19A6B] border-t-transparent rounded-full animate-spin"></div></div>
  if (error) return <div className="p-8 text-center text-red-500 font-medium">{error}</div>
  if (!product) return <div className="p-8 text-center text-gray-500">Product not found</div>

  const price = product.price || { original: 0, discounted_price: 0, has_discount: false, discount_rate: 0 }

  const renderStars = (value: number, interactive = false, onChange?: (v: number) => void) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      const filled = i <= Math.round(value)
      stars.push(
        <Star
          key={i}
          size={18}
          onClick={() => interactive && onChange && onChange(i)}
          className={`${filled ? "fill-[#C19A6B] text-[#C19A6B]" : "text-gray-300"} ${interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
        />
      )
    }
    return <div className="flex items-center gap-1">{stars}</div>
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-20">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Navigation / Breadcrumb */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 mb-8 text-gray-500 hover:text-black transition-colors group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm uppercase tracking-widest font-bold">Back to Gallery</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* LEFT: Image Section */}
          <div className="space-y-6">
            <div className="bg-white p-2 rounded-xl shadow-sm overflow-hidden group">
              <img
                src={selectedImage || "/placeholder.svg"}
                alt={product.name}
                className="w-full aspect-square object-cover rounded-lg group-hover:scale-105 transition-transform duration-700"
              />
            </div>

            {/* Thumbnails Gallery */}
            {product.product_images?.length > 0 && (
              <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {[product.product_thumbnail, ...product.product_images.map((i) => i.image_url)].map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === img ? "border-[#C19A6B] ring-2 ring-[#C19A6B]/20 shadow-md" : "border-white hover:border-gray-200"
                    }`}
                  >
                    <img src={img} alt="thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Detail Section */}
          <div className="flex flex-col">
            <div className="border-b border-gray-200 pb-6 mb-8">
               <span className="text-[10px] uppercase tracking-[4px] text-[#C19A6B] font-bold mb-4 block">
                  {product.category_name || "Modern Collection"}
               </span>
               <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
               
               <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                    {renderStars(product.rating || 0)}
                    <span className="text-xs font-bold text-gray-400">({product.review_count || 0})</span>
                 </div>
                 <span className="h-4 w-[1px] bg-gray-300"></span>
                 <p className="text-sm font-medium text-gray-500">
                    Vendor: <span className="text-black">{product.shop_name}</span>
                 </p>
               </div>
            </div>

            {/* Pricing Card */}
            <div className="mb-8">
                <div className="flex items-baseline gap-4 mb-2">
                  <span className="text-3xl font-bold text-[#C19A6B]">
                    USD {price.has_discount ? price.discounted_price : price.original}.00
                  </span>
                  {price.has_discount && (
                    <span className="text-lg text-gray-400 line-through">USD {price.original}.00</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 uppercase tracking-widest">Price per {product.unit_name}</p>
            </div>

            <p className="text-gray-600 leading-relaxed mb-10 text-lg">
              {product.description}
            </p>

            {/* Controls */}
            <div className="space-y-6 mt-auto">
              <div className="flex items-center gap-6">
                <div className="flex items-center bg-white border border-gray-200 rounded-full px-4 py-2">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                    className="p-2 text-gray-400 hover:text-black transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(product.qty_in_stock, quantity + 1))} 
                    className="p-2 text-gray-400 hover:text-black transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
                  {product.qty_in_stock} items left in stock
                </span>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="flex-1 bg-black text-white h-14 rounded-full flex items-center justify-center gap-3 font-bold uppercase tracking-[2px] text-sm hover:bg-[#C19A6B] transition-all active:scale-95 disabled:opacity-50"
                >
                  {addingToCart ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ShoppingCart size={20} />}
                  Add To Bag
                </button>

                <button
                  onClick={handleToggleFavorite}
                  className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all ${
                    isFavorite ? "bg-red-50 border-red-500 text-red-500" : "bg-white border-gray-200 text-gray-400 hover:border-black hover:text-black"
                  }`}
                >
                  <Heart size={24} className={isFavorite ? "fill-current" : ""} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RELATED PRODUCTS SECTION */}
        {relatedProducts.length > 0 && (
          <div className="mt-32">
             <div className="flex items-end justify-between mb-10">
                <div>
                   <span className="text-[10px] uppercase tracking-[3px] text-[#C19A6B] font-bold">Recommended</span>
                   <h3 className="text-2xl font-bold mt-2">People also liked</h3>
                </div>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {relatedProducts.slice(0, 4).map((rel) => (
                  <div 
                    key={rel.id} 
                    onClick={() => {navigate(`/products/${rel.id}`); window.scrollTo(0,0);}}
                    className="group cursor-pointer"
                  >
                    <div className="aspect-[4/5] bg-white rounded-xl overflow-hidden mb-4 shadow-sm group-hover:shadow-md transition-all">
                      <img src={rel.product_thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    </div>
                    <h4 className="font-bold text-sm uppercase tracking-tight mb-1 truncate">{rel.name}</h4>
                    <p className="text-[#C19A6B] font-bold text-xs">USD {rel.price.has_discount ? rel.price.discounted_price : rel.price.original}.00</p>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* REVIEWS SECTION */}
        <div className="mt-32 border-t border-gray-200 pt-16">
          <div className="max-w-3xl">
            <h3 className="text-3xl font-bold mb-4">Customer Experience</h3>
            <div className="flex items-center gap-4 mb-12">
               {renderStars(product.rating || 0)}
               <span className="text-sm font-bold">Based on {reviews.length} reviews</span>
            </div>

            {/* Review Form */}
            <div className="bg-white rounded-2xl p-8 shadow-sm mb-16">
              <h4 className="font-bold text-lg mb-6">Leave a Review</h4>
              <form onSubmit={handleSubmitReview} className="space-y-6">
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">Your Rating</p>
                  {renderStars(reviewRating, true, (v) => setReviewRating(v))}
                </div>
                <div>
                   <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">Your Thoughts</p>
                   <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={4}
                    className="w-full bg-[#FAF7F2] border-none rounded-xl p-4 focus:ring-2 focus:ring-[#C19A6B] transition-all outline-none"
                    placeholder="Tell us what you liked about this piece..."
                  />
                </div>
                {reviewError && <p className="text-red-500 text-sm italic">{reviewError}</p>}
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-black text-white px-10 py-4 rounded-full text-xs font-bold uppercase tracking-[2px] hover:bg-[#C19A6B] transition-all disabled:opacity-50"
                >
                  {submittingReview ? "Posting..." : "Post Review"}
                </button>
              </form>
            </div>

            {/* Review List */}
            <div className="space-y-8">
              {reviewsLoading ? (
                <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-[#C19A6B] border-t-transparent rounded-full animate-spin"></div></div>
              ) : reviews.length === 0 ? (
                <p className="text-gray-400 italic">No stories shared yet. Be the first to review!</p>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className="border-b border-gray-100 pb-8">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-bold text-lg">{r.user_name}</p>
                        <div className="mt-1">{renderStars(r.rating)}</div>
                      </div>
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                        {r.created_at?.split("T")[0]}
                      </span>
                    </div>
                    {r.comment && <p className="text-gray-600 leading-relaxed italic">"{r.comment}"</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductsDetail