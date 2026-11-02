import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { login } from "../services/authService";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const extractValue = (source: unknown, keys: string[]): unknown => {
    if (!source || typeof source !== "object") {
      return undefined;
    }

    const stack: Array<Record<string, unknown>> = [
      source as Record<string, unknown>,
    ];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) {
        continue;
      }

      for (const [key, value] of Object.entries(current)) {
        const normalizedKey = key.toLowerCase();
        if (
          keys.some((candidate) => candidate.toLowerCase() === normalizedKey)
        ) {
          return value;
        }

        if (value && typeof value === "object") {
          stack.push(value as Record<string, unknown>);
        }
      }
    }

    return undefined;
  };

  const normalizeRole = (value: unknown) => {
    const raw = Array.isArray(value) ? value[0] : value;
    return String(raw ?? "USER")
      .trim()
      .toUpperCase()
      .replace(/^ROLE_/, "");
  };

  const normalizeToken = (value: unknown) => {
    if (typeof value !== "string") {
      return "";
    }

    return value.trim().replace(/^Bearer\s+/i, "");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const trimmedIdentifier = identifier.trim();
      const response = await login({
        username: trimmedIdentifier,
        password,
      });
      console.log("Login API response:", response.data);

      const payload = response.data ?? {};
      const headerToken =
        response.headers?.authorization ??
        response.headers?.Authorization ??
        response.headers?.["x-auth-token"] ??
        response.headers?.["x-token"] ??
        response.headers?.token ??
        "";
      const tokenValue = extractValue(payload, [
        "token",
        "accessToken",
        "access_token",
        "jwt",
        "jwtToken",
        "authorization",
      ]);
      const token = normalizeToken(
        (typeof tokenValue === "string"
          ? tokenValue
          : typeof tokenValue === "object" && tokenValue !== null
            ? JSON.stringify(tokenValue)
            : "") ||
          (typeof headerToken === "string" ? headerToken : "") ||
          "",
      );
      const user = payload.user ?? null;
      const roleValue = extractValue(payload, ["role", "roles", "roleName"]);
      const normalizedRole = normalizeRole(roleValue);

      if (token) {
        localStorage.setItem("token", token);
      }
      localStorage.setItem("role", normalizedRole);

      const resolvedUser = user ?? {
        id: trimmedIdentifier,
        username: trimmedIdentifier,
        fullName: trimmedIdentifier,
        email: trimmedIdentifier,
        roles: [normalizedRole],
      };

      localStorage.setItem("user", JSON.stringify(resolvedUser));
      authLogin(resolvedUser as any, token);

      if (normalizedRole === "ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }

      toast.success("Đăng nhập thành công!");
    } catch (error) {
      console.error("Login error:", error);
      toast.error(
        "Đăng nhập thất bại. Vui lòng kiểm tra tên đăng nhập/email và mật khẩu.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-outline-variant bg-surface p-6 sm:p-8 shadow-md">
        <h1 className="text-3xl font-bold text-primary mb-4">Đăng nhập</h1>
        <p className="text-on-surface-variant mb-8">
          Đăng nhập để tiếp tục mua sách và quản lý tài khoản.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <label className="block">
            <span className="text-sm font-medium text-on-surface">
              Tên đăng nhập
            </span>
            <input
              type="text"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-outline px-4 py-3 bg-surface-container text-on-surface focus:border-primary focus:outline-none"
              placeholder="Nhập tài khoản của bạn"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-on-surface">
              Mật khẩu
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-outline px-4 py-3 bg-surface-container text-on-surface focus:border-primary focus:outline-none"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-on-surface-variant">
          Chưa có tài khoản?{" "}
          <Link
            to="/register"
            className="font-semibold text-primary hover:text-primary-container"
          >
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
