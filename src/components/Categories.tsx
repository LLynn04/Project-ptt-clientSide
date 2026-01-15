"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Category {
  id: number;
  name: string;
  label: string;
  products_count?: number;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface ApiResponse {
  data: Category[];
  meta: PaginationMeta;
}

const CategoryGrid: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/categories?page=1&size=20&scol=name&sdir=asc&count_product=1`
      );
      const result: ApiResponse = await response.json();
      setCategories(result.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (id: number) => {
    navigate(`/products?category=${id}`);
  };

  return (
    <div className="bg-white">
      <div className="max-w-[1400px] mx-auto px-6 py-20">
        {/* Section Header - Explicit bottom margin to prevent overlap */}
        <div className="text-center mb-16">
          <span className="text-[10px] uppercase tracking-[3px] text-[#C19A6B] font-bold bg-[#FAF7F2] px-3 py-1 rounded">
            Categories
          </span>
          <h2 className="text-3xl font-bold text-gray-900 mt-4 tracking-tight">
            Browse Our Collections
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-[#C19A6B] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : categories.length === 0 ? (
          <p className="text-center text-gray-500 py-20">
            No categories found.
          </p>
        ) : (
          <div className="relative group">
            <div
              className="flex gap-8 md:gap-14 overflow-x-auto no-scrollbar pb-10 scroll-smooth snap-x snap-mandatory px-4"
              style={{
                msOverflowStyle: "none",
                scrollbarWidth: "none",
              }}
            >
              {categories.map((category) => (
                <div
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="flex-shrink-0 flex flex-col items-center group cursor-pointer snap-start w-32 md:w-40"
                >
                  {/* Circle Icon Container - Fix for the 'Top Gap' Notch */}
                  <div
                    className="relative w-28 h-28 md:w-32 md:h-32 rounded-full bg-[#FAF7F2] flex items-center justify-center transition-all duration-300 border border-transparent group-hover:border-[#C19A6B] group-hover:bg-white group-hover:shadow-xl overflow-hidden"
                    style={{
                      WebkitBackfaceVisibility: "hidden",
                      transform: "translateZ(0)", // Forces hardware acceleration
                    }}
                  >
                    {/* Inner shadow layer to 'fill' the gap if it appears */}
                    <div className="absolute inset-0 rounded-full border-[1.5px] border-transparent group-hover:border-[#C19A6B] opacity-100 transition-all duration-300" />

                    {/* Category Icon */}
                    <svg
                      className="w-10 h-10 text-gray-600 group-hover:text-[#C19A6B] group-hover:scale-110 transition-all duration-500 relative z-10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    </svg>
                  </div>

                  {/* Text Label - Positioned with pt-6 to ensure gap from circle */}
                  <div className="pt-6 flex flex-col items-center">
                    <h3 className="font-bold text-gray-900 text-[11px] md:text-[12px] uppercase tracking-[2px] group-hover:text-[#C19A6B] transition-colors duration-300">
                      {category.label}
                    </h3>
                    <span className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-widest opacity-80">
                      {category.products_count || 0} Items
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Hidden Scrollbar Styles */}
            <style
              dangerouslySetInnerHTML={{
                __html: `
              .no-scrollbar::-webkit-scrollbar {
                display: none;
              }
            `,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryGrid;
