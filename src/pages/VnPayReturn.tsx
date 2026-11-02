import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function VnPayReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const responseCode = searchParams.get("vnp_ResponseCode") ?? "";
  const txnRef =
    searchParams.get("vnp_TxnRef") ??
    searchParams.get("vnp_TransactionNo") ??
    "-";
  const rawAmount = Number(searchParams.get("vnp_Amount") ?? "0");
  const amountVnd = rawAmount / 100;

  const success = responseCode === "00";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-16 px-4">
      <div className="max-w-xl w-full bg-surface rounded-xl border border-outline-variant shadow-sm p-6 sm:p-8">
        <div className="text-center">
          <div
            className={`mx-auto mb-6 h-24 w-24 rounded-full flex items-center justify-center ${
              success ? "bg-emerald-100" : "bg-rose-100"
            }`}
          >
            <svg
              className={`h-12 w-12 ${success ? "text-emerald-600" : "text-rose-600"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {success ? (
                <path
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              ) : (
                <path
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              )}
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-2">
            {success ? "Đặt hàng thành công!" : "Giao dịch thất bại"}
          </h2>
          {success ? (
            <div className="text-sm text-on-surface-variant mb-4">
              <p className="mb-1">
                Cảm ơn bạn, đơn hàng đã được thanh toán thành công.
              </p>
              <p>
                Mã giao dịch: <strong>{txnRef}</strong>
              </p>
              <p>
                Số tiền:{" "}
                <strong>
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(amountVnd)}
                </strong>
              </p>
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant mb-4">
              Giao dịch thất bại hoặc bị hủy. Vui lòng thử lại hoặc liên hệ hỗ
              trợ.
            </p>
          )}
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => navigate("/products")}
              className="px-6 py-3 rounded-lg bg-primary text-on-primary font-semibold hover:bg-primary-container transition-colors"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
