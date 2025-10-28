const Banner = () => {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-light text-gray-900 leading-tight">
              Fresh & Organic
              <span className="block font-normal mt-2">Vegetables</span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Discover the finest selection of farm-fresh vegetables delivered straight to your doorstep. Quality you
              can taste, freshness you can trust.
            </p>
            <div className="flex gap-4 pt-4">
              <button className="bg-[#E07A5F] hover:bg-[#d16b50] text-white px-8 py-3 rounded-lg font-medium transition-colors">
                Shop Now
              </button>
              <button className="border-2 border-gray-300 hover:border-[#E07A5F] text-gray-700 px-8 py-3 rounded-lg font-medium transition-colors">
                Learn More
              </button>
            </div>
          </div>

          {/* Right side - Image */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&h=600&fit=crop"
                alt="Fresh vegetables"
                className="w-full h-[400px] object-cover"
              />
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-6">
              <div className="text-3xl font-bold text-[#E07A5F]">100%</div>
              <div className="text-sm text-gray-600 font-medium">Organic</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Banner
