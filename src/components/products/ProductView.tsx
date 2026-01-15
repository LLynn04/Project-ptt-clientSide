"use client"

import { useEffect, useState } from "react"
import ProductCard from "./ProductCard"

const ProductList = () => {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await fetch("http://127.0.0.1:8000/api/products")
        const data = await response.json()
        if (data.result && data.data) setProducts(data.data)
        else setError("Failed to load products")
      } catch (err) {
        setError("Failed to fetch products.")
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  if (loading) return <div className="py-20 text-center">Loading...</div>

  return (
    <section className="py-12 bg-[#FDFBF9]">
      <div className="text-center mb-10">
        <span className="text-[10px] uppercase tracking-[3px] text-[#C19A6B] font-bold bg-[#F1EDE7] px-3 py-1 rounded">
          Top Sale
        </span>
        <h2 className="text-3xl font-bold text-gray-900 mt-4">Featured Product</h2>
      </div>

      <div className="relative group px-10">
        {/* snap-x mandatory ensures cards don't stop halfway */}
        <div 
          className="flex gap-6 overflow-x-auto pb-10 no-scrollbar scroll-smooth snap-x snap-mandatory"
          style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
        >
          <style dangerouslySetInnerHTML={{__html: `
            .no-scrollbar::-webkit-scrollbar { display: none; }
          `}} />

          {products.map((product) => (
            /* snap-start makes the card align to the left when scrolling */
            /* w-[calc(25%-18px)] makes exactly 4 cards fit if screen is wide enough */
            <div key={product.id} className="flex-shrink-0 w-[280px] md:w-[calc(25%-18px)] min-w-[250px] snap-start">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ProductList