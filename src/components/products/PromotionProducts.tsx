import React, { useState, useEffect } from "react";

interface Promotion {
  id: number;
  name: string;
  code: string;
  description: string | null;
  discount_rate: string;
  discount_amount: number;
  status: string;
  start_date: string;
  end_date: string;
}

interface ApiResponse {
  result: boolean;
  code: number;
  message: string;
  data: Promotion[];
}

const PromotionsComponent: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/promotions`);
      const result: ApiResponse = await response.json();
      setPromotions(result.data);
    } catch (error) {
      console.error("Error fetching promotions:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (loading) {
    return (
      <div className="bg-white py-8">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (promotions.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 py-8">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Special Offers</h2>
            <p className="text-sm text-gray-600 mt-1">Save big with our exclusive deals</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {promotions.slice(0, 4).map((promo) => {
            const daysLeft = getDaysRemaining(promo.end_date);
            const isCopied = copiedCode === promo.code;
            
            return (
              <div
                key={promo.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
              >
                {/* Header with discount */}
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
                  
                  <div className="relative">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white">
                        {parseFloat(promo.discount_rate)}
                      </span>
                      <span className="text-2xl font-bold text-white">%</span>
                    </div>
                    <p className="text-white text-sm font-medium mt-1">OFF</p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-1">
                    {promo.name}
                  </h3>

                  {/* Code box */}
                  <div
                    onClick={() => copyToClipboard(promo.code)}
                    className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-3 mb-3 cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all duration-200 group/code"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-0.5">Promo Code</p>
                        <p className="font-mono font-bold text-sm text-gray-900 truncate">
                          {promo.code}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {isCopied ? (
                          <svg
                            className="w-5 h-5 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5 text-gray-400 group-hover/code:text-orange-600 transition-colors"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Time remaining */}
                  <div className="flex items-center gap-2 text-sm">
                    <svg
                      className="w-4 h-4 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    <span className="text-gray-600">
                      {daysLeft > 0 ? (
                        <>
                          <span className="font-semibold text-orange-600">{daysLeft}</span> day{daysLeft !== 1 ? 's' : ''} left
                        </>
                      ) : (
                        <span className="text-red-600 font-semibold">Expired</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .line-clamp-1 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
        }
      `}</style>
    </div>
  );
};

export default PromotionsComponent;