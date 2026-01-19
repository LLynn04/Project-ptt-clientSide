"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, HeartOff } from "lucide-react";
import ProductCard from "./../components/products/ProductCard"; // Ensure this path is correct

const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

 const fetchFavorites = async () => {
  setIsLoading(true);
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("http://127.0.0.1:8000/api/favorites", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });
    const result = await response.json();
    
    if (response.ok) {
      // Extract the array from data.data
      const rawFavs = result.data?.data || [];
      
      // Transform the data so 'price' matches what ProductCard expects
      const formattedProducts = rawFavs.map((item: any) => {
        const p = item.product;
        
        // If price is a number (like in your Postman), turn it into an object
        const formattedPrice = typeof p.price === 'number' 
          ? { 
              original: p.price, 
              discounted_price: p.price, 
              has_discount: false, 
              discount_rate: 0 
            }
          : p.price; // if it's already an object, keep it

        return {
          ...p,
          price: formattedPrice
        };
      });

      setFavorites(formattedProducts);
    }
  } catch (err) {
    console.error("Error fetching favorites:", err);
  } finally {
    setIsLoading(false);
  }
};

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#FDFBF9]">
        <Loader2 className="w-10 h-10 text-[#C19A6B] animate-spin" />
      </div>
    );

  return (
    <div className="bg-[#FDFBF9] min-h-screen py-12 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Header - Matches your ProductList style exactly */}
        <div className="text-center mb-12 relative">
          <button 
            onClick={() => navigate(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[10px] font-bold text-gray-500 hover:text-[#C19A6B] transition-all tracking-widest uppercase"
          >
            <ArrowLeft size={14} /> Back
          </button>

          <span className="text-[10px] uppercase tracking-[3px] text-[#C19A6B] font-bold bg-[#F1EDE7] px-3 py-1 rounded">
            Your Selection
          </span>
          <h2 className="text-3xl font-bold text-gray-900 mt-4 italic">My Favorites</h2>
        </div>

        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[#FAF7F2] border border-[#F1EDE7]">
            <HeartOff size={40} className="text-[#C19A6B] mb-4 opacity-50" />
            <p className="text-gray-600 font-medium italic">No favorite items yet.</p>
            <button 
              onClick={() => navigate('/')}
              className="mt-6 text-[10px] uppercase tracking-widest font-bold text-[#C19A6B] border-b border-[#C19A6B] pb-1"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          /* Grid layout using your exact ProductCard */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {favorites.map((product) => (
              <div key={product.id} className="h-full">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;