import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

interface UserProtectedRouteProps {
  children: ReactNode;
}

export default function UserProtectedRoute({
  children,
}: UserProtectedRouteProps) {
  const location = useLocation();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      toast.error("Vui lòng đăng nhập để truy cập trang này.");
    }
  }, [token]);

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
