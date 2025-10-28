import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Category {
  id: number;
  name: string;
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
  const [hoveredId, setHoveredId] = useState<number | null>(null);

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
      <div className="max-w-[1280px] mx-auto px-6 py-12">
        <h2 className="text-3xl font-semibold text-gray-800 mb-8 text-center">
          Browse by Category
        </h2>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-[#f97316] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : categories.length === 0 ? (
          <p className="text-center text-gray-500 py-20">
            No categories found.
          </p>
        ) : (
          <div className="relative">
            <div
              className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
              style={{
                scrollSnapType: "x mandatory",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {categories.slice(0, 12).map((category) => {
                const isHovered = hoveredId === category.id;
                return (
                  <div
                    key={category.id}
                    onMouseEnter={() => setHoveredId(category.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => handleCategoryClick(category.id)}
                    className={`flex-shrink-0 w-[180px] bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer p-5 flex flex-col items-center justify-center text-center ${
                      isHovered ? "border-orange-400" : ""
                    }`}
                    style={{ scrollSnapAlign: "start" }}
                  >
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-all duration-300 ${
                        isHovered
                          ? "bg-orange-100 text-orange-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      </svg>
                    </div>
                    <h3 className="font-medium text-gray-800">{category.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {category.products_count || 0} products
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Hide scrollbar visually */}
            <style>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
              .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryGrid;