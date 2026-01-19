"use client";

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from "../../components/products/ProductCard"; 

// Interface matches your Products page requirements
interface Product {
  id: number;
  name: string;
  description: string;
  product_thumbnail: string;
  qty_in_stock: number;
  price: {
    original: number;
    discounted_price: number;
    has_discount: boolean;
    discount_rate: number;
  };
  stock_status: string;
  category: {
    id: number;
    name: string;
    label: string;
  };
  shop: {
    id: number;
    name: string;
  };
  promotions: any[];
  rating: {
    average: number;
    count: number;
  };
}

const TopSale = () => {
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/products")
      .then((res) => res.json())
      .then((data) => {
        const productData: Product[] = Array.isArray(data) ? data : data.data || [];
        
        // Logic: Filter for 4-5 stars and limit to top 4 for a clean row
        const highlyRated = productData
          .filter((p) => p.rating && p.rating.average >= 4)
          .sort((a, b) => b.rating.average - a.rating.average)
          .slice(0, 4);

        setTopProducts(highlyRated);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching top sales:", err);
        setIsLoading(false);
      });
  }, []);

  // Hide the section entirely if no high-rated products exist
  if (!isLoading && topProducts.length === 0) return null;

  return (
    <section className="py-24 bg-white">
      <div className="max-w-[1280px] mx-auto px-6">
        
        {/* Header: Minimalist & Balanced */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div className="space-y-3">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.4em] block">
              Customer Favorites
            </span>
            <h2 className="text-4xl font-extralight text-gray-900 tracking-tight">
              Top Rated Selection
            </h2>
          </div>
          
          <Link 
            to="/products" 
            className="text-[11px] font-black uppercase tracking-widest text-gray-900 border-b-2 border-orange-500 pb-1 hover:text-orange-600 hover:border-orange-600 transition-all w-fit"
          >
            Explore All Items
          </Link>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-[4/5] bg-gray-50 rounded-2xl" />
                <div className="h-4 bg-gray-50 w-2/3 rounded" />
                <div className="h-4 bg-gray-50 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {topProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default TopSale;