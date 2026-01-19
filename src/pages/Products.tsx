"use client"

import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/products/ProductCard"; 

interface Category {
  id: number;
  name: string;
  label: string;
}

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
  shop: {
    id: number;
    name: string;
  };
  promotions: {
    id: number;
    name: string;
    discount_rate: string;
  }[];
  rating: {
    average: number;
    count: number;
  };
  category: {
    id: number;
    name: string;
    label: string;
  };
}

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/categories")
      .then((res) => res.json())
      .then((data) => {
        const categoryData = Array.isArray(data) ? data : data.data || [];
        setCategories(categoryData);
      })
      .catch((err) => console.error("Error fetching categories:", err));

    fetch("http://127.0.0.1:8000/api/products")
      .then((res) => res.json())
      .then((data) => {
        const productData = Array.isArray(data) ? data : data.data || [];
        setProducts(productData);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    const categoryId = searchParams.get('category');
    setSelectedCategory(categoryId ? Number(categoryId) : null);
  }, [searchParams]);

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category.id === selectedCategory)
    : products;

  const handleCategoryClick = (categoryId: number | null) => {
    if (categoryId === null) {
      setSearchParams({});
    } else {
      setSearchParams({ category: categoryId.toString() });
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header Section: Clean & Neutral */}
      <header className="border-b border-gray-100">
        <div className="max-w-[1280px] mx-auto px-6 py-12">
          <nav className="text-xs text-gray-400 uppercase tracking-widest mb-4">
            Store / Products / {selectedCategory ? "Category" : "All"}
          </nav>
          <h1 className="text-4xl font-light text-gray-900 tracking-tight">
            {selectedCategory 
              ? categories.find(c => c.id === selectedCategory)?.label 
              : "Our Collection"}
          </h1>
        </div>
      </header>

      <div className="max-w-[1280px] mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* Sidebar: Subtle & Minimalist */}
          <aside className="w-full lg:w-56 flex-shrink-0">
            <div className="sticky top-24">
              <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-8">
                Categories
              </h3>
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => handleCategoryClick(null)}
                  className={`text-left px-0 py-2 text-sm transition-all duration-200 border-l-2 ${
                    selectedCategory === null
                      ? "border-orange-500 pl-4 text-gray-900 font-bold bg-gray-50/50"
                      : "border-transparent pl-4 text-gray-500 hover:text-gray-900 hover:bg-gray-50/30"
                  }`}
                >
                  All Products
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`text-left px-0 py-2 text-sm transition-all duration-200 border-l-2 ${
                      selectedCategory === cat.id
                        ? "border-orange-500 pl-4 text-gray-900 font-bold bg-gray-50/50"
                        : "border-transparent pl-4 text-gray-500 hover:text-gray-900 hover:bg-gray-50/30"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-12 animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <div className="aspect-[4/5] bg-gray-100 rounded-lg" />
                    <div className="h-4 bg-gray-100 w-2/3 rounded" />
                    <div className="h-4 bg-gray-100 w-1/2 rounded" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-12">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-32 border border-dashed border-gray-100 rounded-3xl">
                <p className="text-gray-400 font-medium">No items currently available in this category.</p>
                <button 
                  onClick={() => handleCategoryClick(null)}
                  className="mt-4 text-sm font-bold text-orange-600 hover:text-orange-700 underline underline-offset-4"
                >
                  View all items
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Products;