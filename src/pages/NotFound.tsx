import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="customer-theme min-h-[calc(100vh-80px)] flex items-center justify-center bg-background text-on-background font-sans px-4 py-16">
      <div className="w-full max-w-xl rounded-xl border border-outline-variant bg-surface p-6 sm:p-10 text-center shadow-md">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary text-4xl font-bold">
          404
        </div>
        <h1 className="text-4xl font-bold text-on-surface mb-4">
          Trang không tồn tại
        </h1>
        <p className="text-on-surface-variant mb-8">
          Trang bạn vừa truy cập không có trong hệ thống. Vui lòng kiểm tra lại
          đường dẫn hoặc quay về trang chủ.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-sm font-semibold text-on-primary transition hover:bg-primary-container"
        >
          Quay về trang chủ
        </Link>
      </div>
    </div>
  );
}
