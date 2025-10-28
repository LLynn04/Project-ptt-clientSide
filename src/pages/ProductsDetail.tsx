"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Submit review
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

  // Add to cart
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

  // Toggle favorite
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

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>
  if (!product) return <div className="p-8 text-center">Product not found</div>

  const price = product.price || { original: 0, discounted_price: 0, has_discount: false, discount_rate: 0 }

  const renderStars = (value: number, interactive = false, onChange?: (v: number) => void) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      const filled = i <= Math.round(value)
      const btn = (
        <button
          key={i}
          onClick={(ev) => {
            ev.preventDefault()
            if (!interactive) return
            onChange && onChange(i)
          }}
          type="button"
          aria-label={`${i} star`}
          className={`text-xl leading-none ${filled ? "text-yellow-400" : "text-gray-300"} ${
            interactive ? "hover:text-yellow-500" : ""
          }`}
        >
          {filled ? "★" : "☆"}
        </button>
      )
      stars.push(btn)
    }
    return <div className="flex items-center gap-1">{stars}</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <button onClick={() => navigate(-1)} className="mb-6 text-gray-600 hover:text-gray-900 font-medium">
          ← Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image section */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
            <img
              src={selectedImage || "/placeholder.svg"}
              alt={product.name}
              className="w-full h-96 object-cover rounded-lg mb-4"
            />

            {/* Thumbnails */}
            {product.product_images?.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {[product.product_thumbnail, ...product.product_images.map((i) => i.image_url)].map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-20 h-20 rounded border-2 ${
                      selectedImage === img ? "border-green-500" : "border-gray-200"
                    }`}
                  >
                    <img src={img} alt="thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info section */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h1 className="text-2xl font-bold">{product.name}</h1>

              {/* Shop Name */}
              {product.shop_name && (
                <p className="text-sm text-gray-500 mb-2">
                  Shop: <span className="font-medium">{product.shop_name}</span>
                </p>
              )}

              {/* Rating */}
              <div className="flex items-center gap-3 mb-4">
                {renderStars(product.rating || 0, false)}
                <span className="text-gray-500 text-sm">({product.review_count || 0})</span>
              </div>

              {/* Price */}
              <div className="mb-4">
                <span className="text-2xl font-bold">
                  {price.has_discount ? price.discounted_price : price.original}{" "}
                  / <span className="font-medium">{product.unit_name}</span>
                </span>
                {price.has_discount && (
                  <span className="text-sm text-gray-400 line-through ml-2">{price.original}</span>
                )}
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-1 border rounded">
                  -
                </button>
                <span>{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.qty_in_stock, quantity + 1))}
                  className="px-3 py-1 border rounded"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition"
              >
                {addingToCart ? "Adding..." : "Add to Cart"}
              </button>

              <button
                onClick={handleToggleFavorite}
                className={`w-full py-2 mt-2 rounded-lg border-2 ${
                  isFavorite
                    ? "bg-red-50 border-red-500 text-red-500"
                    : "border-gray-300 text-gray-600 hover:border-red-500"
                }`}
              >
                {isFavorite ? "♥ Remove from Favorites" : "♡ Add to Favorites"}
              </button>
            </div>

            {/* Related products */}
            {relatedProducts.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="font-bold mb-4">Related Products</h3>
                <div className="space-y-3">
                  {relatedProducts.map((rel) => (
                    <button
                      key={rel.id}
                      onClick={() => navigate(`/products/${rel.id}`)}
                      className="w-full flex items-center gap-3 p-2 border rounded hover:border-green-500"
                    >
                      <img src={rel.product_thumbnail} className="w-16 h-16 object-cover rounded" />
                      <div>
                        <p className="font-medium">{rel.name}</p>
                        <p className="text-sm text-gray-500">
                          {rel.price.has_discount ? rel.price.discounted_price : rel.price.original} /{" "}
                          {rel.unit_name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="bg-white p-6 rounded-lg shadow mt-8">
          <h3 className="font-bold mb-3">Description</h3>
          <p className="text-gray-600">{product.description}</p>
        </div>

        {/* Reviews Section */}
        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Customer Reviews</h3>
            <div className="text-sm text-gray-500 flex items-center gap-2">
              {renderStars(
                reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : product.rating || 0,
                false
              )}
              <span>({reviews.length})</span>
            </div>
          </div>

          {/* Submit review form */}
          <form onSubmit={handleSubmitReview} className="mb-6 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your rating</label>
              <div>{renderStars(reviewRating, true, (v) => setReviewRating(v))}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your review</label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded p-2"
                placeholder="Write about your experience..."
              />
            </div>

            {reviewError && <div className="text-red-500 text-sm">{reviewError}</div>}

            <div>
              <button
                type="submit"
                disabled={submittingReview}
                className="px-4 py-2 bg-gradient-to-r from-[#E07A5F] to-[#F4A261] text-white rounded"
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </form>

          {/* Reviews list */}
          <div className="space-y-4">
            {reviewsLoading ? (
              <div className="text-center text-gray-500">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="text-gray-500">No reviews yet. Be the first to review this product.</div>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{r.user_name}</div>
                    <div className="text-xs text-gray-400">{r.created_at?.split("T")[0]}</div>
                  </div>
                  <div className="text-yellow-400">{renderStars(r.rating)}</div>
                  {r.comment && <p className="text-gray-600 mt-1">{r.comment}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductsDetail
