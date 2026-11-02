import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./components/layout/Layout";
import { Layout as AdminLayout } from "./components/admin/Layout";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import UserProfile from "./pages/UserProfile";
import PaymentReturn from "./pages/PaymentReturn";
import VnPayReturn from "./pages/VnPayReturn";
import PaymentSuccess from "./pages/PaymentSuccess";
import Contact from "./pages/Contact";
import AboutUs from "./pages/AboutUs";
import TopTrending from "./pages/TopTrending";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserProtectedRoute from "./components/UserProtectedRoute";
import { ProtectedRoute, RedirectIfAdmin } from "./components/ProtectedRoute";
import { Dashboard } from "./pages/admin/Dashboard";
import { BookManagement } from "./pages/admin/BookManagement";
import { OrderManagement } from "./pages/admin/OrderManagement";
import { CustomerManagement } from "./pages/admin/CustomerManagement";
import { VoucherManagement } from "./pages/admin/VoucherManagement";
import { AttributeManagement } from "./pages/admin/AttributeManagement";
import { ContactManagement } from "./pages/admin/ContactManagement";
import { BannerManagement } from "./pages/admin/BannerManagement";
import { ReviewManagement } from "./pages/admin/ReviewManagement";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <RedirectIfAdmin>
              <Layout />
            </RedirectIfAdmin>
          }
        >
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route
            path="checkout"
            element={
              <UserProtectedRoute>
                <Checkout />
              </UserProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <UserProtectedRoute>
                <UserProfile />
              </UserProtectedRoute>
            }
          />
          <Route path="payment-return" element={<PaymentReturn />} />
          <Route path="vnpay-return" element={<VnPayReturn />} />
          <Route path="payment-success" element={<PaymentSuccess />} />
          <Route path="about" element={<AboutUs />} />
          <Route path="top-trending" element={<TopTrending />} />
          <Route path="contact" element={<Contact />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute allowedRole="ADMIN" />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="books" element={<BookManagement />} />
            <Route path="orders" element={<OrderManagement />} />
            <Route path="customers" element={<CustomerManagement />} />
            <Route path="vouchers" element={<VoucherManagement />} />
            <Route path="attributes" element={<AttributeManagement />} />
            <Route path="contact" element={<ContactManagement />} />
            <Route path="banners" element={<BannerManagement />} />
            <Route path="reviews" element={<ReviewManagement />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
