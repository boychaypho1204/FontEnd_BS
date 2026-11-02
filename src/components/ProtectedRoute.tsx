import { Navigate, Outlet } from "react-router-dom";

interface ProtectedRouteProps {
  allowedRole: string; // Quyền được phép vào (VD: "ADMIN")
}

function getNormalizedRole() {
  const storedRole = localStorage.getItem("role");
  const storedUser = localStorage.getItem("user");
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const userRole =
    storedRole ?? parsedUser?.role ?? parsedUser?.roles?.[0] ?? "USER";

  return String(userRole ?? "USER")
    .trim()
    .toUpperCase()
    .replace(/^ROLE_/, "");
}

export function ProtectedRoute({ allowedRole }: ProtectedRouteProps) {
  const token = localStorage.getItem("token");
  const normalizedAllowedRole = allowedRole
    ?.trim()
    .toUpperCase()
    .replace(/^ROLE_/, "");
  const normalizedUserRole = getNormalizedRole();

  // 1. Nếu chưa đăng nhập -> Tự động đuổi ra trang Login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Nếu đã đăng nhập nhưng SAI QUYỀN (ví dụ User cố tình vào link Admin) -> Đuổi về trang chủ
  if (normalizedUserRole !== normalizedAllowedRole) {
    return <Navigate to="/" replace />;
  }

  // 3. Nếu ĐÚNG QUYỀN -> Mời vào trong (Cho phép hiển thị các trang của Admin)
  return <Outlet />;
}

export function RedirectIfAdmin({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  const normalizedUserRole = getNormalizedRole();

  if (token && normalizedUserRole === "ADMIN") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
}
