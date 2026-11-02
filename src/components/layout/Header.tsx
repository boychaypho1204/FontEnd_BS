import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  User,
  Heart,
  Menu,
  LogOut,
  UserCircle2,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";

export default function Header() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount, clearCartCount } = useCart();
  const [isScrolled, setIsScrolled] = useState(() => window.scrollY > 0);

  useEffect(() => {
    const updateScrollState = () => setIsScrolled(window.scrollY > 0);

    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  const handleLogout = () => {
    logout();
    clearCartCount();
    navigate("/login");
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b text-primary transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-lg border-outline-variant shadow-sm"
          : "bg-transparent backdrop-blur-none border-transparent shadow-none"
      }`}
    >
      <div className="max-w-[1280px] mx-auto px-4 md:px-10 min-h-16 md:min-h-20 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:py-0">
        <div className="flex shrink-0 items-center gap-2 lg:gap-4">
          <button className="md:hidden p-2 -ml-2 text-on-surface-variant hover:bg-surface-variant/50 rounded-full transition-colors">
            <Menu className="w-6 h-6" />
          </button>
          <Link
            to="/"
            className="text-lg md:text-2xl font-serif font-bold text-primary tracking-tight whitespace-nowrap"
          >
            Lumina Books
          </Link>
        </div>

        <nav className="customer-nav order-3 hidden w-full md:flex flex-wrap items-center justify-center gap-x-6 gap-y-1 font-medium lg:order-none lg:w-auto lg:justify-self-center">
          <NavLink
            to="/"
            className="text-on-surface hover:text-primary transition-colors py-2 relative group"
          >
            Trang chủ
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
          </NavLink>

          <NavLink
            to="/products"
            className="text-on-surface-variant hover:text-primary transition-colors py-2 relative group"
          >
            Sản phẩm
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
          </NavLink>

          <NavLink
            to="/about"
            className="text-on-surface-variant hover:text-primary transition-colors py-2 relative group"
          >
            Về chúng tôi
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
          </NavLink>

          <NavLink
            to="/top-trending"
            className="text-on-surface-variant hover:text-primary transition-colors py-2 relative group"
          >
            BXH Bán Chạy
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
          </NavLink>
        </nav>

        <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1 lg:ml-0 lg:gap-2 lg:justify-self-end">
          <button
            type="button"
            onClick={() => {
              if (isAuthenticated) {
                navigate("/wishlist");
              } else {
                toast.info("Vui lòng đăng nhập để xem yêu thích.");
                navigate("/login");
              }
            }}
            className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-variant/50 rounded-full transition-all"
          >
            <Heart className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (isAuthenticated) {
                navigate("/cart");
              } else {
                toast.info("Vui lòng đăng nhập để xem giỏ hàng.");
                navigate("/login");
              }
            }}
            className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-variant/50 rounded-full transition-all relative"
          >
            <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
            <span className="absolute top-0 right-0 bg-error text-on-error text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center translate-x-1/4 -translate-y-1/4 border-2 border-surface">
              {cartCount}
            </span>
          </button>
          {isAuthenticated && user ? (
            <div className="flex items-center gap-1 rounded-lg border border-outline-variant bg-surface px-1 py-1">
              <Link
                to="/profile"
                aria-label="Tài khoản của tôi"
                className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-surface-variant/50 hover:text-primary"
              >
                <UserCircle2 className="w-5 h-5" />
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 rounded-full border border-outline px-2 py-1 text-sm text-on-surface-variant hover:text-primary hover:border-primary transition"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-variant/50 rounded-full transition-all"
            >
              <User className="w-5 h-5 md:w-6 md:h-6" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
