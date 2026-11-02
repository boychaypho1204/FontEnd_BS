import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { getBookById, updateBook } from "../services/bookService";
import {
  getOrders,
  updateOrderStatus,
  verifyVnpayReturn,
} from "../services/orderService";

async function applyVnpayOrderInventory(orderId?: string) {
  if (!orderId) {
    return;
  }

  try {
    const orderResponse = await getOrders(0, 50, String(orderId));
    const payload =
      (orderResponse as any)?.data?.data ?? (orderResponse as any)?.data ?? [];
    const content = Array.isArray((payload as any)?.content)
      ? (payload as any).content
      : Array.isArray((payload as any)?.data)
        ? (payload as any).data
        : Array.isArray(payload)
          ? payload
          : [];

    const matchedOrder = (content as any[]).find(
      (order: any) => String(order?.id ?? order?.orderId) === String(orderId),
    );

    const orderToUse = matchedOrder ?? payload;
    const paymentMethod = String(orderToUse?.paymentMethod ?? "").toLowerCase();

    if (paymentMethod === "cod" || paymentMethod === "cash") {
      return;
    }

    const itemSource = Array.isArray(orderToUse?.items)
      ? orderToUse.items
      : Array.isArray(orderToUse?.orderItems)
        ? orderToUse.orderItems
        : [];

    for (const item of itemSource) {
      const bookId = item?.bookId ?? item?.book?.id ?? item?.book?.bookId;
      const quantity = Number(item?.quantity ?? item?.qty ?? 1);

      if (!bookId || !Number.isFinite(quantity) || quantity <= 0) {
        continue;
      }

      const bookResponse = await getBookById(String(bookId));
      const bookData =
        (bookResponse as any)?.data?.data ?? (bookResponse as any)?.data ?? {};
      const currentStock = Number(
        bookData?.stockQuantity ?? bookData?.stock ?? bookData?.quantity ?? 0,
      );

      if (!Number.isFinite(currentStock) || currentStock <= 0) {
        continue;
      }

      if (currentStock < quantity) {
        continue;
      }

      const nextStock = Math.max(0, currentStock - quantity);
      await updateBook(String(bookId), {
        stock: nextStock,
        stockQuantity: nextStock,
        quantity: nextStock,
      });
    }
  } catch (error) {
    console.warn("VNPAY inventory sync skipped:", error);
  }
}

const resolveOrderId = (response: any, queryParams: URLSearchParams) => {
  const fromResponse =
    response?.orderId ??
    response?.id ??
    response?.data?.orderId ??
    response?.data?.id ??
    response?.data?.data?.orderId ??
    response?.data?.data?.id;

  if (fromResponse) {
    return String(fromResponse);
  }

  const txnRef =
    queryParams.get("vnp_TxnRef") ??
    queryParams.get("vnp_OrderInfo") ??
    queryParams.get("txnRef") ??
    "";

  if (txnRef) {
    return txnRef;
  }

  return undefined;
};

export default function PaymentReturn() {
  const location = useLocation();
  const [status, setStatus] = useState<"success" | "failure" | "loading">(
    "loading",
  );
  const [message, setMessage] = useState("Đang xác nhận giao dịch...");

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const runVerify = async () => {
      try {
        const response = await verifyVnpayReturn(queryParams);
        const orderId = resolveOrderId(response.data, queryParams);

        if (response.data.success) {
          await applyVnpayOrderInventory(orderId);

          setStatus("success");
          setMessage(response.data.message || "Thanh toán thành công.");
          toast.success(response.data.message || "Thanh toán thành công.");
        } else {
          if (orderId) {
            try {
              await updateOrderStatus(orderId, "CANCELLED");
            } catch (cancelError) {
              console.warn(
                "Failed to mark VNPAY failed order as CANCELLED:",
                cancelError,
              );
            }
          }

          setStatus("failure");
          setMessage(response.data.message || "Thanh toán thất bại.");
          toast.error(response.data.message || "Thanh toán thất bại.");
        }
      } catch (error) {
        console.error("VNPAY return verification failed", error);
        setStatus("failure");
        setMessage("Không thể xác nhận giao dịch.");
        toast.error("Không thể xác nhận giao dịch.");
      }
    };

    runVerify();
  }, [location.search]);

  return (
    <div className="max-w-[720px] mx-auto px-4 md:px-10 py-14 text-center">
      {status === "loading" ? (
        <div className="space-y-4">
          <div className="h-24 w-24 mx-auto rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-on-surface-variant">{message}</p>
        </div>
      ) : status === "success" ? (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-6 sm:p-10 shadow-sm">
          <h1 className="text-3xl font-bold text-emerald-900 mb-4">
            Thanh toán thành công!
          </h1>
          <p className="text-on-surface-variant">{message}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-error/30 bg-error-container/30 p-6 sm:p-10 shadow-sm">
          <h1 className="text-3xl font-bold text-error mb-4">
            Thanh toán thất bại
          </h1>
          <p className="text-on-surface-variant">{message}</p>
        </div>
      )}
    </div>
  );
}
