import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  price: {
    original: number;
    discounted_price: number;
    has_discount: boolean;
    discount_rate: number;
  };
  product_thumbnail: string;
  category: {
    id: number;
    name: string;
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
        if (Array.isArray(data)) {
          setCategories(data);
        } else if (Array.isArray(data.data)) {
          setCategories(data.data);
        } else {
          console.error("Unexpected categories response:", data);
          setCategories([]);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching categories:", err);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        } else if (Array.isArray(data.data)) {
          setProducts(data.data);
        } else {
          console.error("Unexpected products response:", data);
          setProducts([]);
        }
      })
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  // Set selected category from URL after data loads
  useEffect(() => {
    if (!isLoading) {
      const categoryId = searchParams.get('category');
      if (categoryId) {
        const catId = Number(categoryId);
        console.log('Setting category from URL:', catId);
        setSelectedCategory(catId);
      }
    }
  }, [searchParams, isLoading]);

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category.id === selectedCategory)
    : products;

  console.log('Selected Category:', selectedCategory);
  console.log('Filtered Products:', filteredProducts.length);

  // Handle category selection and update URL
  const handleCategoryClick = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    if (categoryId === null) {
      setSearchParams({});
    } else {
      setSearchParams({ category: categoryId.toString() });
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-56 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3 px-2">Categories</h2>
              <ul className="space-y-1">
                <li
                  onClick={() => handleCategoryClick(null)}
                  className={`cursor-pointer px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedCategory === null
                      ? "bg-gradient-to-r from-[#E07A5F] to-[#F4A261] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  All Products
                </li>
                {categories.map((cat) => (
                  <li
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`cursor-pointer px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedCategory === cat.id
                        ? "bg-gradient-to-r from-[#E07A5F] to-[#F4A261] text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {cat.name}
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Products</h1>
              <p className="text-sm text-gray-600 mt-1">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
              </p>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
                  >
                    <div className="relative aspect-square overflow-hidden bg-gray-100">
                      <img
                        src={product.product_thumbnail}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {product.price.has_discount && (
                        <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                          -{product.price.discount_rate}%
                        </span>
                      )}
                    </div>
                    
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 h-10">
                        {product.name}
                      </h3>
                      
                      {product.price.has_discount ? (
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-[#E07A5F]">
                            ${product.price.discounted_price.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-400 line-through">
                            ${product.price.original.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-gray-900">
                          ${product.price.original.toFixed(2)}
                        </span>
                      )}

                      <button className="w-full mt-3 bg-gradient-to-r from-[#E07A5F] to-[#F4A261] text-white text-sm font-medium py-2 rounded-md hover:opacity-90 transition-opacity">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No products found</h3>
                <p className="text-sm text-gray-500">Try selecting a different category</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Products;