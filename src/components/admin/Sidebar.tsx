import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  LayoutDashboard,
  Book,
  ShoppingCart,
  Users,
  Ticket,
  HelpCircle,
  Settings2,
  BookOpen,
  Image,
  MessageSquareQuote,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export function Sidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin_access_token");
    logout();
    toast.success("Đăng xuất thành công");
    navigate("/login", { replace: true });
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "books", label: "Book Management", icon: Book },
    { id: "orders", label: "Order Management", icon: ShoppingCart },
    { id: "customers", label: "Customer Management", icon: Users },
    { id: "attributes", label: "Attribute Management", icon: Settings2 },
    { id: "vouchers", label: "Vouchers", icon: Ticket },
    { id: "banners", label: "Banner Management", icon: Image },
    { id: "reviews", label: "Reviews", icon: MessageSquareQuote },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-inverse-surface flex flex-col py-6 z-50">
      <div className="px-6 mb-8 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0">
          <BookOpen className="text-on-primary-container" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Admin Bookstore
          </h2>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <NavLink
                  to={`/admin/${item.id}`}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors duration-200 ${
                      isActive
                        ? "bg-primary-container text-on-primary-container border-l-4 border-primary"
                        : "text-[#d3e4fe] hover:bg-surface-variant/10 hover:text-white border-l-4 border-transparent"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={20}
                        className={isActive ? "text-primary" : ""}
                      />
                      {item.label}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-6 mt-auto pt-6 border-t border-outline-variant/30">
        <div className="flex items-center gap-3">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgdzaNDS6KzlvzzoMY6Qi0V3qHtH-xTLJ6BZ3pFuFnroG5fSHcfme78IEPQmDcYEMq-PHodf-CbF9Y9bUQ27KvkWV7GWoncCoVMnYQedOQcane1rwOlj7lAGN25GoEW3nOVqnNC20xs6vVwQbdWm92mnfCSkAWYv4OJopfBGMhHOgjRwCtboDccQJdkIljcHaqNPZ2X45m4YlWFEexIxomrXRok8MdhXw1fttIdyHksTJEwsAoqmvzGga6OKYKG7xBhsQrEJcopSt9"
            alt="Admin"
            className="w-10 h-10 rounded-full object-cover border border-outline-variant"
          />
          <div className="flex flex-col text-left flex-1">
            <span className="text-sm font-semibold text-white">
              Người Quản Trị
            </span>
            <span className="text-xs text-[#cbdbf5]">Superadmin</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          <LogOut size={18} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
