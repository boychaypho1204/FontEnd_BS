import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { register } from "../services/authService";

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const getErrorMessage = (error: any) => {
    const responseData = error?.response?.data;
    const candidateMessages = [
      responseData?.message,
      responseData?.error,
      responseData?.detail,
      responseData?.title,
      error?.message,
    ].filter(Boolean);

    const messageText = candidateMessages.join(" ");
    if (messageText) {
      return messageText;
    }

    if (error?.response?.status === 400 || error?.response?.status === 500) {
      return "Tên đăng nhập phải từ 3–100 ký tự và mật khẩu phải từ 6–100 ký tự.";
    }

    return "Đăng ký thất bại. Vui lòng thử lại.";
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedUsername || !trimmedPassword || !trimmedConfirmPassword) {
      toast.error(
        "Vui lòng nhập đầy đủ tên đăng nhập, mật khẩu và xác nhận mật khẩu.",
      );
      return;
    }

    if (trimmedUsername.length < 3 || trimmedUsername.length > 100) {
      toast.error("Tên đăng nhập phải có từ 3 đến 100 ký tự.");
      return;
    }

    if (trimmedPassword.length < 6 || trimmedPassword.length > 100) {
      toast.error("Mật khẩu phải có từ 6 đến 100 ký tự.");
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp. Vui lòng nhập lại.");
      return;
    }

    setSubmitting(true);

    try {
      const generatedEmail = `${trimmedUsername.toLowerCase().replace(/[^a-z0-9._-]/g, "") || "user"}@local.invalid`;

      await register({
        username: trimmedUsername,
        password: trimmedPassword,
        email: generatedEmail,
      });
      toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
      navigate("/login");
    } catch (error: any) {
      console.error(error);
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-outline-variant bg-surface p-6 sm:p-8 shadow-md">
        <h1 className="text-3xl font-bold text-primary mb-4">Đăng ký</h1>
        <p className="text-on-surface-variant mb-8">
          Tạo tài khoản mới để mua sách và theo dõi đơn hàng.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <label className="block">
            <span className="text-sm font-medium text-on-surface">
              Tên đăng nhập
            </span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-outline px-4 py-3 bg-surface-container text-on-surface focus:border-primary focus:outline-none"
              placeholder="customer1"
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

          <label className="block">
            <span className="text-sm font-medium text-on-surface">
              Xác nhận mật khẩu
            </span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
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
            {submitting ? "Đang xử lý..." : "Đăng ký"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-on-surface-variant">
          Đã có tài khoản?{" "}
          <Link
            to="/login"
            className="font-semibold text-primary hover:text-primary-container"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
