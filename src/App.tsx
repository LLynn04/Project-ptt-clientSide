import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import RootLayout from "./components/Layout/RootLayOut.tsx";
import HomePage from "./pages/Home.tsx";

// Auth Pages
import Register from "./pages/auth/Register.tsx";
import Login from "./pages/auth/Login.tsx";
import ForgotPasswordForm from "./pages/auth/ForgetPassword.tsx";
import VerifyOtpForm from "./pages/auth/Send-Otp.tsx";
import ResetPasswordForm from "./pages/auth/ResetPassword.tsx";

// Profile user page
import ProfilePage from "./pages/users/ProfileDashboad.tsx";
import SettingUser from "./pages/users/SettingUser.tsx";
import OrdersUser from "./pages/users/Orders.tsx";

// Add to cart and fav
import AddFavorite from "./pages/Favorites.tsx";
import CartPage from "./pages/Cart.tsx";

// Products page
import ProductsPage from "./pages/Products.tsx";
import ProductsDetail from "./pages/ProductsDetail.tsx";

//seller request page
import SellerRequest from "./pages/SellerRequest.tsx";

//admin dashboard page
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import Products from "./pages/admin/pages/Products.tsx";
import Categories from "./pages/admin/pages/Categories.tsx";
import Orders from "./pages/admin/pages/Orders.tsx";
import Customers from "./pages/admin/pages/Customers.tsx";
import ShopesManage from "./pages/admin/pages/Shops.tsx";
import RequestSeller from "./pages/admin/pages/RequestSeller.tsx";
// import PromotionProducts from "./components/products/PromotionProducts.tsx";

// seller
import SellersDashboard from "./pages/Seller/SellersDashboard.tsx";

function App() {
  return (
    <BrowserRouter>
      {/* ✅ Wrap all Route components inside <Routes> */}
      <Routes>
        {/* Layout route */}
        <Route path="/" element={<RootLayout />}>
          <Route index element={<HomePage />} />

          {/* Products routes */}
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductsDetail />} />
          {/* <Route path="promotion-products" element={<PromotionProducts />} /> */}

          {/* Cart and Favorites */}
          <Route path="favorites" element={<AddFavorite />} />
          <Route path="cart" element={<CartPage />} />

          {/* Profile */}
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingUser />} />
          <Route path="orders" element={<OrdersUser />} />

          {/* seller request */}
          <Route path="seller-request" element={<SellerRequest />} />
        </Route>
        {/* Admin Dashboard */}
        <Route path="admin/*" element={<AdminDashboard />} />
        <Route path="admin/products" element={<Products />} />
        <Route path="admin/categories" element={<Categories />} />
        <Route path="admin/orders" element={<Orders />} />
        <Route path="admin/customers" element={<Customers />} />
        <Route path="admin/shops" element={<ShopesManage />} />
        <Route path="admin/seller-requests" element={<RequestSeller />} />

        {/* Seller Dashboard */}
        <Route path="seller" element={<SellersDashboard />} />

        {/* Auth routes */}
        <Route path="/sign-up" element={<Register />} />
        <Route path="/sign-in" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        <Route path="/verify-otp" element={<VerifyOtpForm />} />
        <Route path="/reset-password" element={<ResetPasswordForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
