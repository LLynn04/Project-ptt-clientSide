"use client";

import React, { useEffect, useState, useRef } from 'react';
import ProductCard from "../../components/products/ProductCard";

const SellersDashboard = () => {
  const [view, setView] = useState<'public' | 'manage' | 'reels'>('public');
  const [shopData, setShopData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [editName, setEditName] = useState("");
  const [editComment, setEditComment] = useState("");
  
  // Product CRUD States
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    qty_in_stock: '',
    category_id: '',
    product_unit_id: '',
    product_thumbnail: null as File | null,
    product_images: [] as File[]
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);

  const token = localStorage.getItem("token");
  const BASE_URL = "http://127.0.0.1:8000";

  // ===== SHOP PROFILE FUNCTIONS =====
  const fetchProfile = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/shops/me`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      const json = await res.json();
      if (json.result) {
        setShopData(json.data);
        setEditName(json.data.shop_name);
        setEditComment(json.data.comment || "");
      }
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  // ===== PRODUCT CRUD FUNCTIONS =====
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const res = await fetch(`${BASE_URL}/api/products`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      const json = await res.json();
      console.log("[v0] Products fetch response:", json);
      if (json.data && json.data.data) {
        setProducts(json.data.data);
      } else if (json.data && Array.isArray(json.data)) {
        setProducts(json.data);
      }
    } catch (err) { 
      console.error("[v0] Error fetching products:", err); 
    } finally { 
      setIsLoadingProducts(false); 
    }
  };

  const fetchCategoriesAndUnits = async () => {
    try {
      const catRes = await fetch(`${BASE_URL}/api/categories`, { headers: { 'Accept': 'application/json' } });
      if (catRes.ok) {
        const catData = await catRes.json();
        console.log("[v0] Categories response:", catData);
        if (catData.data) setCategories(catData.data);
      } else {
        console.warn("[v0] Categories endpoint not available (", catRes.status, ")");
      }

      const unitRes = await fetch(`${BASE_URL}/api/product-unit`, { headers: { 'Accept': 'application/json' } });
      if (unitRes.ok) {
        const unitData = await unitRes.json();
        console.log("[v0] Units response:", unitData);
        if (unitData.data) setUnits(unitData.data);
      } else {
        console.warn("[v0] Product unit endpoint not available (", unitRes.status, ")");
      }
    } catch (err) { 
      console.error("[v0] Error fetching categories/units:", err); 
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      qty_in_stock: '',
      category_id: '',
      product_unit_id: '',
      product_thumbnail: null,
      product_images: []
    });
    setIsFormOpen(true);
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      qty_in_stock: product.qty_in_stock,
      category_id: product.category_id || '',
      product_unit_id: product.product_unit_id || '',
      product_thumbnail: null,
      product_images: []
    });
    setIsFormOpen(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    setDeletingId(id);
    try {
      const res = await fetch(`${BASE_URL}/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      
      if (res.ok) {
        setProducts(products.filter(p => p.id !== id));
        alert("Product deleted successfully");
      } else {
        const error = await res.json();
        alert("Error deleting product: " + (error.message || "Unknown error"));
      }
    } catch (err) { 
      console.error("Error deleting product:", err);
      alert("Network error deleting product");
    } finally { 
      setDeletingId(null); 
    }
  };

 const handleSaveProduct = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const form = new FormData();
  form.append('name', formData.name);
  form.append('description', formData.description);
  form.append('price', formData.price);
  form.append('qty_in_stock', formData.qty_in_stock);
  
  if (formData.category_id) form.append('category_id', formData.category_id);
  if (formData.product_unit_id) form.append('product_unit_id', formData.product_unit_id);
  
  // Add product thumbnail
  if (formData.product_thumbnail) {
    form.append('product_thumbnail', formData.product_thumbnail);
  }
  
  // Add product images
  formData.product_images.forEach((img, idx) => {
    form.append(`product_images[${idx}]`, img);
  });

  // IMPORTANT: For Laravel to recognize PUT/PATCH via POST, add _method field
  if (editingProduct) {
    form.append('_method', 'PUT');
  }

  try {
    const url = editingProduct 
      ? `${BASE_URL}/api/products/${editingProduct.id}` 
      : `${BASE_URL}/api/products`;
    
    // Always use POST (Laravel handles PUT via _method field)
    const method = 'POST';

    console.log("[v0] Saving product to:", url, "Method:", method, "Editing:", !!editingProduct);
    
    const res = await fetch(url, {
      method,
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
        // Do NOT set Content-Type - browser will set it automatically with boundary for FormData
      },
      body: form
    });

    const responseData = await res.json();
    console.log("[v0] Save response:", responseData);

    if (res.ok && responseData.result) {
      await fetchProducts();
      setIsFormOpen(false);
      setEditingProduct(null);
      // Reset form
      setFormData({
        name: '',
        description: '',
        price: '',
        qty_in_stock: '',
        category_id: '',
        product_unit_id: '',
        product_thumbnail: null,
        product_images: []
      });
      alert(editingProduct ? "Product updated successfully" : "Product created successfully");
    } else {
      const errorMsg = responseData.message || responseData.error || JSON.stringify(responseData);
      alert("Error saving product: " + errorMsg);
      console.error("[v0] Server error:", responseData);
    }
  } catch (err) { 
    console.error("[v0] Error saving product:", err);
    alert("Network error saving product. Check console for details.");
  }
};

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFormData(prev => ({ ...prev, product_thumbnail: e.target.files![0] }));
    }
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({ ...prev, product_images: Array.from(e.target.files!) }));
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'avatar' | 'cover') => {
    if (!e.target.files?.[0]) return;
    
    const formDataObj = new FormData();
    formDataObj.append(fieldName, e.target.files[0]);

    try {
      const res = await fetch(`${BASE_URL}/api/shop-img`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataObj
      });
      
      if (res.ok) {
        fetchProfile(); 
      } else {
        const errorData = await res.json();
        console.error("Upload failed:", errorData);
        alert("Upload failed. Check console for details.");
      }
    } catch (err) { 
      console.error("Network error:", err); 
    }
  };

  const handleUpdateShop = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch(`${BASE_URL}/api/shops`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ shop_name: editName, comment: editComment })
      });
      if (res.ok) {
        await fetchProfile();
        setView('public'); 
      }
    } catch (err) { console.error(err); }
    finally { setIsUpdating(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  useEffect(() => { 
    fetchProfile();
    fetchCategoriesAndUnits();
  }, [token]);

  useEffect(() => {
    if (view === 'manage') {
      fetchProducts();
    }
  }, [view]);

  if (isLoading) return <div className="p-20 text-center font-black animate-pulse uppercase tracking-widest">Loading Shop...</div>;
  if (!shopData) return <div className="p-20 text-center">Please login.</div>;

  return (
    <div className="bg-white min-h-screen pb-20 font-sans">
      
      {/* 1. COVER PHOTO SECTION */}
      <div className="relative h-64 bg-gray-200 group overflow-hidden">
        <img 
          src={shopData.cover ? `${BASE_URL}/storage/${shopData.cover}` : "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200"} 
          className="w-full h-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105" 
          alt="Cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        
        <button 
          onClick={() => coverInputRef.current?.click()}
          className="absolute bottom-6 right-6 bg-white/20 hover:bg-white/40 backdrop-blur-md border border-white/30 text-white text-[10px] font-black uppercase px-6 py-2.5 rounded-full transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2"
        >
          Change Cover
        </button>
        <input type="file" ref={coverInputRef} onChange={(e) => handleUpload(e, 'cover')} className="hidden" accept="image/*" />
      </div>

      <div className="max-w-[1000px] mx-auto px-6">
        
        {/* 2. PROFILE HEADER */}
        <div className="relative -mt-16 flex flex-col items-center md:items-start md:flex-row gap-6 mb-6">
          <div className="relative group">
            <div className="w-36 h-36 rounded-full border-4 border-white overflow-hidden shadow-2xl bg-white z-10">
              <img 
                src={shopData.avatar?.startsWith('http') ? shopData.avatar : `${BASE_URL}/storage/${shopData.avatar}`} 
                className="w-full h-full object-cover" 
                alt="Avatar" 
              />
            </div>
            
            <button 
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
            >
              <span className="text-white text-[10px] font-black uppercase tracking-tighter">Change Photo</span>
            </button>
            <input type="file" ref={avatarInputRef} onChange={(e) => handleUpload(e, 'avatar')} className="hidden" accept="image/*" />
          </div>
          
          <div className="flex-1 mt-20 md:mt-24 text-center md:text-left">
            <h1 className="text-4xl font-black text-gray-900 flex items-center justify-center md:justify-start gap-2">
              {shopData.shop_name}
              <span className="bg-blue-500 text-white text-[10px] p-1 rounded-full flex items-center justify-center">✓</span>
            </h1>
            <p className="text-gray-500 font-bold text-sm tracking-tight">@{shopData.shop_name?.replace(/\s+/g, '').toLowerCase()}</p>
          </div>

          <div className="flex gap-2 mt-4 md:mt-24 w-[200px]"></div>
        </div>

        {/* 3. SOCIAL STATS */}
        <div className="flex justify-center md:justify-start gap-12 py-8 border-y border-gray-100 mb-8">
          <div className="text-center md:text-left">
            <p className="font-black text-2xl text-gray-900">{shopData.total_products || 0}</p>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em]">Products</p>
          </div>
          <div className="text-center md:text-left">
            <p className="font-black text-2xl text-gray-900">0</p>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em]">Followers</p>
          </div>
          <div className="text-center md:text-left">
            <p className="font-black text-2xl text-gray-900">0</p>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em]">Likes</p>
          </div>
        </div>

        {/* 4. BIO */}
        <div className="mb-10 max-w-2xl text-center md:text-left">
          <p className="text-gray-700 text-base leading-relaxed italic">
            "{shopData.comment || "Welcome to my shop! Update your bio in the manage tab."}"
          </p>
        </div>

        {/* 5. TABS */}
        <div className="flex border-b border-gray-100 mb-8 sticky top-0 bg-white z-20">
          {['public', 'reels', 'manage'].map((tab) => (
            <button
              key={tab}
              onClick={() => setView(tab as any)}
              className={`flex-1 md:flex-none py-5 px-12 text-[10px] font-black uppercase tracking-[0.3em] transition-all border-b-2 ${
                view === tab ? "border-orange-500 text-gray-900" : "border-transparent text-gray-400"
              }`}
            >
              {tab === 'public' ? 'Collection' : tab}
            </button>
          ))}
        </div>

        {/* 6. CONTENT */}
        <div className="pb-20">
          {view === 'public' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              {shopData.products?.length > 0 ? (
                shopData.products.map((p: any) => <ProductCard key={p.id} product={p} />)
              ) : (
                <div className="col-span-full py-20 text-center text-gray-400 font-bold uppercase text-xs tracking-widest">No products yet</div>
              )}
            </div>
          )}

          {view === 'reels' && (
            <div className="grid grid-cols-3 gap-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-[9/16] bg-gray-100 relative group overflow-hidden">
                   <img src={`https://picsum.photos/seed/${i+44}/400/700`} className="w-full h-full object-cover" alt="reels" />
                </div>
              ))}
            </div>
          )}

          {view === 'manage' && (
            <div className="space-y-8">
              {/* SHOP PROFILE SECTION */}
              <div className="max-w-xl mx-auto space-y-8 py-4">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest">Shop Profile</h3>
                
                <div className="bg-gray-50 p-8 rounded-[2.5rem] shadow-inner">
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block tracking-widest">Shop Display Name</label>
                  <input 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-white border-none p-5 rounded-2xl text-base font-bold shadow-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div className="bg-gray-50 p-8 rounded-[2.5rem] shadow-inner">
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block tracking-widest">Bio Description</label>
                  <textarea 
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                    className="w-full bg-white border-none p-5 rounded-2xl text-base h-40 shadow-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                  />
                </div>

                <div className="flex flex-col gap-4">
                  <button 
                    onClick={handleUpdateShop}
                    disabled={isUpdating}
                    className="w-full py-6 bg-black text-white rounded-full text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isUpdating ? "Saving..." : "Update Shop Profile"}
                  </button>
                  <button onClick={handleLogout} className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-red-500 hover:bg-red-50 rounded-full transition-all">Log Out Account</button>
                </div>
              </div>

              {/* PRODUCTS SECTION */}
              <div className="border-t pt-12">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest">Manage Products</h3>
                  <button
                    onClick={handleAddProduct}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-black text-[10px] px-8 py-3 rounded-full uppercase tracking-widest transition-all active:scale-95"
                  >
                    + Add Product
                  </button>
                </div>

                {/* ADD/EDIT FORM */}
                {isFormOpen && (
                  <div className="bg-gray-50 p-8 rounded-[2.5rem] shadow-inner mb-12">
                    <h4 className="text-lg font-black text-gray-900 mb-6">{editingProduct ? 'Edit Product' : 'Add New Product'}</h4>
                    <form onSubmit={handleSaveProduct} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Product Name *</label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleFormChange}
                            className="w-full bg-white border-none p-4 rounded-xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-orange-500 outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Price *</label>
                          <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleFormChange}
                            step="0.01"
                            className="w-full bg-white border-none p-4 rounded-xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-orange-500 outline-none"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Description</label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleFormChange}
                          className="w-full bg-white border-none p-4 rounded-xl text-sm h-24 shadow-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Stock Qty *</label>
                          <input
                            type="number"
                            name="qty_in_stock"
                            value={formData.qty_in_stock}
                            onChange={handleFormChange}
                            className="w-full bg-white border-none p-4 rounded-xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-orange-500 outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Category</label>
                          <select
                            name="category_id"
                            value={formData.category_id}
                            onChange={handleFormChange}
                            className="w-full bg-white border-none p-4 rounded-xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-orange-500 outline-none"
                          >
                            <option value="">Select Category</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Unit</label>
                          <select
                            name="product_unit_id"
                            value={formData.product_unit_id}
                            onChange={handleFormChange}
                            className="w-full bg-white border-none p-4 rounded-xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-orange-500 outline-none"
                          >
                            <option value="">Select Unit</option>
                            {units.map(unit => (
                              <option key={unit.id} value={unit.id}>{unit.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Thumbnail</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailChange}
                            ref={thumbnailInputRef}
                            className="w-full bg-white border-none p-4 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-orange-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Product Images (max 5)</label>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImagesChange}
                            ref={imagesInputRef}
                            className="w-full bg-white border-none p-4 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-orange-500 outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex gap-4 pt-4">
                        <button
                          type="submit"
                          className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-[11px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all"
                        >
                          {editingProduct ? 'Update Product' : 'Create Product'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsFormOpen(false);
                            setEditingProduct(null);
                          }}
                          className="flex-1 py-4 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* PRODUCTS LIST */}
                {isLoadingProducts ? (
                  <div className="text-center py-12 text-gray-400 font-black animate-pulse">Loading products...</div>
                ) : products.length > 0 ? (
                  <div className="space-y-4">
                    {products.map((product: any) => (
                      <div key={product.id} className="bg-gray-50 p-6 rounded-2xl flex items-start justify-between gap-6">
                        <div className="flex items-start gap-4 flex-1">
                          <img
                            // Correct: Uses the full URL directly from the API
src={product.product_thumbnail || "https://via.placeholder.com/80"}
                            alt={product.name}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h4 className="font-black text-gray-900">{product.name}</h4>
                            <p className="text-xs text-gray-500 mt-1">{product.description?.substring(0, 60)}...</p>
                            <div className="flex gap-6 mt-3 text-xs font-bold">
                              <span className="text-orange-600">
                                ${typeof product.price === 'object' ? product.price.original || product.price.discounted_price : product.price}
                              </span>
                              <span className="text-gray-500">Stock: {product.qty_in_stock}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-black text-[10px] px-6 py-2 rounded-full uppercase transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            disabled={deletingId === product.id}
                            className="bg-red-500 hover:bg-red-600 text-white font-black text-[10px] px-6 py-2 rounded-full uppercase transition-all disabled:opacity-50"
                          >
                            {deletingId === product.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl text-gray-400 font-bold uppercase text-xs tracking-widest">
                    No products yet. Add your first product!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellersDashboard;
