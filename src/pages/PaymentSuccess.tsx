import { Link } from "react-router-dom";

export default function PaymentSuccess() {
  return (
    <div className="max-w-[720px] mx-auto px-4 md:px-10 py-14 text-center">
      <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-6 sm:p-10 shadow-sm">
        <h1 className="text-3xl font-bold text-emerald-900 mb-4">
          Đặt hàng thành công!
        </h1>
        <p className="text-on-surface-variant mb-6">
          Đơn hàng của bạn đã được tạo thành công. Chúng tôi sẽ liên hệ để xác
          nhận giao hàng sớm nhất.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-3xl bg-primary text-on-primary px-6 py-3 font-semibold hover:bg-primary-container transition"
        >
          Quay về trang chủ
        </Link>
      </div>
    </div>
  );
}
