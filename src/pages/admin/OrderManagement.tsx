import React, { useEffect, useMemo, useState } from "react";
import { Search, Download, Eye } from "lucide-react";
import { toast } from "react-toastify";
import {
  cancelOrderByAdmin,
  getOrders,
  updateOrderStatus,
  type OrderRow,
} from "../../services/orderService";
import { getBookById, updateBook } from "../../services/bookService";
import apiClient from "../../services/apiClient";

const statusOptions = [
  "PENDING",
  "CONFIRMED",
  "PAID",
  "PACKING",
  "SHIPPING",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
];

const normalizeStatus = (status?: string) =>
  String(status ?? "")
    .trim()
    .toUpperCase();

const isTerminalStatus = (status?: string) => {
  const normalized = normalizeStatus(status);
  return normalized === "COMPLETED" || normalized === "CANCELLED";
};

const getAllowedNextStatus = (currentStatus?: string) => {
  const normalized = normalizeStatus(currentStatus);

  if (normalized === "PENDING") {
    return ["PENDING", "CONFIRMED", "CANCELLED"];
  }

  if (normalized === "CONFIRMED") {
    return ["CONFIRMED", "COMPLETED", "CANCELLED"];
  }

  if (normalized === "COMPLETED" || normalized === "CANCELLED") {
    return [normalized];
  }

  return statusOptions;
};

const getVisibleStatusOptions = (currentStatus?: string) => {
  const normalized = normalizeStatus(currentStatus);

  if (normalized === "PENDING") {
    return ["PENDING", "CONFIRMED", "CANCELLED"];
  }

  if (normalized === "CONFIRMED") {
    return ["CONFIRMED", "COMPLETED", "CANCELLED"];
  }

  if (normalized === "COMPLETED" || normalized === "CANCELLED") {
    return [normalized];
  }

  return statusOptions;
};

const extractOrderItems = (order: OrderRow) => {
  const itemSource = Array.isArray(order.items)
    ? order.items
    : Array.isArray((order as any).orderItems)
      ? (order as any).orderItems
      : Array.isArray((order as any).bookItems)
        ? (order as any).bookItems
        : Array.isArray((order as any).books)
          ? (order as any).books
          : [];

  return itemSource.filter(Boolean);
};

const formatCurrencyVnd = (value: number | string | null | undefined) => {
  const numericValue = Number(value ?? 0);

  if (!Number.isFinite(numericValue)) {
    return "0 ₫";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(numericValue);
};

const getBookCoverUrl = (image?: string) => {
  if (!image) {
    return "https://placehold.co/160x160?text=No+Image";
  }

  if (/^(https?:\/\/|\/\/)/.test(image)) {
    return image;
  }

  if (image.startsWith("/")) {
    return image;
  }

  if (image.startsWith("uploads/")) {
    return `http://localhost:8080/${image}`;
  }

  return `http://localhost:8080/uploads/${image}`;
};

export function OrderManagement() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [inventoryAppliedOrders, setInventoryAppliedOrders] = useState<
    Set<string | number>
  >(new Set());
  const [cancellingOrderId, setCancellingOrderId] = useState<
    string | number | null
  >(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] =
    useState<OrderRow | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [page, setPage] = useState(0);
  const [pageInfo, setPageInfo] = useState({
    number: 0,
    totalPages: 0,
    totalElements: 0,
    size: 10,
  });

  const fetchOrders = async (nextPage = page, keyword = search) => {
    setLoading(true);
    try {
      const response = await getOrders(nextPage, 10, keyword);
      const payload = response.data?.data ?? response.data;
      const content = payload?.content ?? payload?.data ?? [];
      setOrders(content);
      setPageInfo({
        number: payload?.number ?? nextPage,
        totalPages: payload?.totalPages ?? 0,
        totalElements: payload?.totalElements ?? content.length,
        size: payload?.size ?? 10,
      });
      setPage(payload?.number ?? nextPage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(0, search);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => fetchOrders(0, search), 400);
    return () => window.clearTimeout(timer);
  }, [search]);

  const fetchOrderDetails = async (orderId: string | number) => {
    setLoadingDetails(true);
    try {
      const response = await apiClient.get(`/orders/${orderId}`);
      const detailsData = response.data?.data ?? response.data;
      setSelectedOrderDetails(detailsData);
    } catch (err) {
      console.error("Failed to fetch order details:", err);
      toast.error("Không thể tải chi tiết đơn hàng");
      setSelectedOrderDetails(selectedOrder);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleStatusChange = async (order: OrderRow, nextStatus: string) => {
    const id = order.id ?? order.orderId;
    const currentStatus = normalizeStatus(order.status);
    const normalizedNextStatus = normalizeStatus(nextStatus);

    if (!id) {
      toast.error("Không tìm thấy ID đơn hàng.");
      return;
    }

    if (isTerminalStatus(currentStatus)) {
      toast.info(
        "Đơn hàng đã hoàn tất hoặc đã hủy nên không thể thao tác thêm.",
      );
      return;
    }

    const allowedStatuses = getAllowedNextStatus(currentStatus);
    if (
      allowedStatuses.length > 0 &&
      !allowedStatuses.includes(normalizedNextStatus)
    ) {
      toast.warning(
        "Chỉ có thể chuyển từ Pending → Confirmed, Confirmed → Complete hoặc hủy đơn.",
      );
      return;
    }

    try {
      // 1. Gọi API cập nhật trạng thái đơn (Backend sẽ TỰ ĐỘNG trừ kho + tăng đã bán)
      await updateOrderStatus(id, normalizedNextStatus);

      // (ĐÃ XÓA TOÀN BỘ KHỐI if (shouldApplyInventory) LẰNG NHẰNG Ở ĐÂY)

      toast.success("Cập nhật trạng thái đơn hàng thành công!");
      await fetchOrders(page, search); // Tải lại danh sách đơn
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Cập nhật trạng thái thất bại",
      );
    }
  };
  // const handleStatusChange = async (order: OrderRow, nextStatus: string) => {
  //   const id = order.id ?? order.orderId;
  //   const currentStatus = normalizeStatus(order.status);
  //   const normalizedNextStatus = normalizeStatus(nextStatus);

  //   if (!id) {
  //     toast.error("Không tìm thấy ID đơn hàng.");
  //     return;
  //   }

  //   if (isTerminalStatus(currentStatus)) {
  //     toast.info(
  //       "Đơn hàng đã hoàn tất hoặc đã hủy nên không thể thao tác thêm.",
  //     );
  //     return;
  //   }

  //   const allowedStatuses = getAllowedNextStatus(currentStatus);
  //   if (
  //     allowedStatuses.length > 0 &&
  //     !allowedStatuses.includes(normalizedNextStatus)
  //   ) {
  //     toast.warning(
  //       "Chỉ có thể chuyển từ Pending → Confirmed, Confirmed → Complete hoặc hủy đơn.",
  //     );
  //     return;
  //   }

  //   try {
  //     await updateOrderStatus(id, normalizedNextStatus);

  //     const orderKey = String(id);
  //     const shouldApplyInventory =
  //       currentStatus === "PENDING" &&
  //       normalizedNextStatus === "CONFIRMED" &&
  //       !inventoryAppliedOrders.has(orderKey);

  //     if (shouldApplyInventory) {
  //       const orderItems = extractOrderItems(order);

  //       for (const item of orderItems) {
  //         const bookId = item?.bookId ?? item?.book?.id ?? item?.book?.bookId;
  //         const quantity = Number(item?.quantity ?? item?.qty ?? 1);

  //         if (!bookId || !Number.isFinite(quantity) || quantity <= 0) {
  //           continue;
  //         }

  //         try {
  //           const bookResponse = await getBookById(String(bookId));
  //           const bookData =
  //             (bookResponse.data as any)?.data ?? bookResponse.data;
  //           const currentStock = Number(
  //             bookData?.stockQuantity ?? bookData?.stock ?? 0,
  //           );
  //           const currentSold = Number(
  //             bookData?.sold ??
  //               bookData?.soldQuantity ??
  //               bookData?.quantitySold ??
  //               bookData?.totalSold ??
  //               bookData?.soldCount ??
  //               bookData?.sales ??
  //               0,
  //           );
  //           const nextStock = Math.max(0, currentStock - quantity);
  //           const nextSold = currentSold + quantity;

  //           await updateBook(String(bookId), {
  //             stock: nextStock,
  //             stockQuantity: nextStock,
  //             quantity: nextStock,
  //             sold: nextSold,
  //             soldQuantity: nextSold,
  //             quantitySold: nextSold,
  //             totalSold: nextSold,
  //             soldCount: nextSold,
  //           });
  //         } catch (inventoryError) {
  //           console.warn(
  //             "Inventory update skipped for book",
  //             bookId,
  //             inventoryError,
  //           );
  //         }
  //       }
  //       setInventoryAppliedOrders((prev) => {
  //         const nextSet = new Set(prev);
  //         nextSet.add(orderKey);
  //         return nextSet;
  //       });
  //     }

  //     toast.success("Order status updated successfully");
  //     await fetchOrders(page, search);
  //   } catch (err) {
  //     toast.error(
  //       err instanceof Error ? err.message : "Failed to update status",
  //     );
  //   }
  // };

  const handleCancelOrder = async (id: string | number) => {
    setCancellingOrderId(id);
    try {
      await cancelOrderByAdmin(id);
      toast.success("Đã hủy đơn hàng thành công.");
      await fetchOrders(page, search);
    } catch (err: any) {
      const message =
        err?.message ??
        err?.response?.data?.message ??
        "Không thể hủy đơn hàng. Chỉ các đơn đang chờ xác nhận mới có thể hủy.";
      toast.error(message);
    } finally {
      setCancellingOrderId(null);
    }
  };

  const canCancelOrder = (status: string) => {
    const normalized = normalizeStatus(status);
    return !isTerminalStatus(normalized) && normalized !== "COMPLETED";
  };

  const getOrderItems = (order: OrderRow | null | undefined) => {
    if (!order) return [];

    const candidateSources = [
      order.items,
      (order as any).items,
      (order as any).orderItems,
      (order as any).bookItems,
      (order as any).details,
      (order as any).orderDetails,
      (order as any).books,
      (order as any).lineItems,
      (order as any).order_items,
      (order as any).book_items,
      (order as any).content,
      (order as any).data?.items,
      (order as any).data?.orderItems,
      (order as any).data?.details,
      (order as any).data?.orderDetails,
      (order as any).data?.books,
      (order as any).products,
      (order as any).itemDetails,
      (order as any).orderDetailsList,
    ];

    const itemSource = candidateSources.find(Array.isArray) ?? [];

    if (Array.isArray(itemSource) && itemSource.length === 0) {
      console.warn("Order has no items detected. Full order object:", order);
    }

    return Array.isArray(itemSource) ? itemSource.filter(Boolean) : [];
  };

  const getStatusStyle = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return "bg-surface-container-high text-on-surface border-transparent";
      case "CONFIRMED":
      case "PAID":
        return "bg-surface-container-highest text-primary border-transparent";
      case "PACKING":
        return "bg-tertiary-fixed text-on-tertiary-fixed border-transparent";
      case "SHIPPING":
        return "bg-secondary-fixed text-on-secondary-fixed border-transparent";
      case "DELIVERED":
      case "COMPLETED":
        return "bg-secondary-fixed-dim text-on-secondary-container border-transparent";
      case "CANCELLED":
        return "bg-error-container text-on-error-container border-transparent";
      default:
        return "bg-surface-container text-on-surface";
    }
  };

  const getPaymentMethodStyle = (method: string) => {
    const normalized = String(method ?? "").toUpperCase();
    if (normalized === "VNPAY") {
      return "bg-blue-100 text-blue-800 border-blue-300";
    }
    if (normalized === "COD") {
      return "bg-green-100 text-green-800 border-green-300";
    }
    return "bg-gray-100 text-gray-800 border-gray-300";
  };

  const getPaymentMethodLabel = (method: string) => {
    const normalized = String(method ?? "").toUpperCase();
    if (normalized === "VNPAY") {
      return "Thanh toán trực tuyến (VNPAY)";
    }
    if (normalized === "COD") {
      return "Thanh toán khi nhận hàng (COD)";
    }
    return method || "-";
  };

  const pageNumbers = useMemo(
    () =>
      Array.from(
        { length: Math.max(pageInfo.totalPages, 1) },
        (_, index) => index + 1,
      ),
    [pageInfo.totalPages],
  );

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* --- START BỔ SUNG TIÊU ĐỀ TƯƠNG TỰ BOOK MANAGEMENT --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">
            Order Management
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Manage your customer orders, shipping status, and payments.
          </p>
        </div>
      </div>
      {/* --- END BỔ SUNG TIÊU ĐỀ --- */}

      {/* Box chứa thanh search và nút Export (Đã bỏ border-box to tướng đi để giống Book) */}
      <div className="bg-surface border border-outline-variant rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"
            size={20}
          />
          <input
            type="text"
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary text-sm outline-none transition-all"
            placeholder="Search Order ID or Customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button className="h-10 px-4 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-container transition-colors shadow-sm flex items-center gap-2 flex-none">
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden flex-1 flex flex-col shadow-sm">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left min-w-225 border-collapse">
            <thead className="bg-surface-container sticky top-0 z-10 border-b border-outline-variant">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-on-surface-variant uppercase">
                  Order ID
                </th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-on-surface-variant uppercase">
                  Customer
                </th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-on-surface-variant uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-on-surface-variant text-right uppercase">
                  Total
                </th>
                <th className="px-5 py-3 text-xs font-semibold tracking-wider text-on-surface-variant uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-on-surface-variant text-right uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-sm text-on-surface-variant"
                  >
                    Loading...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-sm text-on-surface-variant"
                  >
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const orderId = order.orderId ?? order.id;
                  const customerName =
                    order.customerName ??
                    order.user?.fullName ??
                    order.user?.username ??
                    order.customer ??
                    "-";
                  const createdAt = order.createdAt ?? order.date ?? "-";
                  const totalPrice = Number(
                    order.totalAmount ?? order.totalPrice ?? order.total ?? 0,
                  );
                  const status = normalizeStatus(order.status || "PENDING");
                  const visibleStatuses = getVisibleStatusOptions(status);

                  return (
                    <tr
                      key={String(orderId)}
                      className="hover:bg-surface-container-low transition-colors group"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-primary">
                        {orderId}
                      </td>
                      <td className="px-4 py-3 text-sm text-on-surface">
                        {customerName}
                      </td>
                      <td className="px-4 py-3 text-sm text-on-surface-variant">
                        {createdAt}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-on-surface text-right">
                        {formatCurrencyVnd(totalPrice)}
                      </td>
                      <td className="px-5 py-3">
                        <select
                          value={status}
                          onChange={(e) =>
                            void handleStatusChange(order, e.target.value)
                          }
                          disabled={isTerminalStatus(status)}
                          className={`h-8 px-2 pr-6 rounded text-xs font-semibold outline-none border ${getStatusStyle(status)} ${isTerminalStatus(status) ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
                        >
                          {visibleStatuses.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {canCancelOrder(status) ? (
                            <button
                              onClick={() => {
                                const orderIdentifier =
                                  order.id ?? order.orderId ?? orderId;
                                if (!orderIdentifier) {
                                  return;
                                }
                                void handleCancelOrder(orderIdentifier);
                              }}
                              disabled={cancellingOrderId != null}
                              className="rounded-lg border border-error px-3 py-1.5 text-xs font-semibold text-error hover:bg-error/10 transition-colors disabled:opacity-60"
                            >
                              {cancellingOrderId != null
                                ? "Đang hủy..."
                                : "Hủy"}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => {
                              const orderIdentifier = order.id ?? order.orderId;
                              if (!orderIdentifier) {
                                toast.error("Không tìm thấy ID đơn hàng.");
                                return;
                              }

                              setSelectedOrder(order);
                              void fetchOrderDetails(orderIdentifier);
                            }}
                            className="text-primary hover:bg-surface-variant p-1.5 rounded transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-outline-variant bg-background flex items-center justify-between mt-auto">
          <span className="text-sm text-on-surface-variant">
            Showing {orders.length} entries
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => fetchOrders(Math.max(0, page - 1), search)}
              disabled={page <= 0}
              className="p-2 border border-outline-variant rounded-lg text-on-surface hover:bg-surface-variant disabled:opacity-50"
            >
              &lt;
            </button>
            {pageNumbers.map((number) => (
              <button
                key={number}
                onClick={() => fetchOrders(number - 1, search)}
                className={`w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center ${page + 1 === number ? "bg-primary text-white" : "border border-outline-variant text-on-surface hover:bg-surface-variant"}`}
              >
                {number}
              </button>
            ))}
            <button
              onClick={() =>
                fetchOrders(Math.min(pageInfo.totalPages - 1, page + 1), search)
              }
              disabled={page >= pageInfo.totalPages - 1}
              className="p-2 border border-outline-variant rounded-lg text-on-surface hover:bg-surface-variant disabled:opacity-50"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {selectedOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/70 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-surface p-6 shadow-2xl border border-outline-variant">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-sm text-on-surface-variant">
                  Chi tiết đơn hàng
                </p>
                <h3 className="text-2xl font-bold text-primary">
                  #{selectedOrder.orderId ?? selectedOrder.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedOrder(null);
                  setSelectedOrderDetails(null);
                }}
                className="rounded-full border border-outline-variant px-3 py-1.5 text-sm text-on-surface hover:bg-surface-container-low"
              >
                Đóng
              </button>
            </div>

            {loadingDetails ? (
              <div className="py-6 text-center text-on-surface-variant">
                Đang tải chi tiết đơn hàng...
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 mb-6">
                  <div className="rounded-2xl bg-surface-container-low p-4">
                    <p className="text-xs uppercase tracking-wide text-on-surface-variant mb-1">
                      Khách hàng
                    </p>
                    <p className="font-semibold text-on-surface">
                      {selectedOrderDetails?.customerName ??
                        selectedOrderDetails?.user?.fullName ??
                        selectedOrderDetails?.user?.username ??
                        selectedOrder?.customerName ??
                        selectedOrder?.user?.fullName ??
                        selectedOrder?.user?.username ??
                        "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-surface-container-low p-4">
                    <p className="text-xs uppercase tracking-wide text-on-surface-variant mb-1">
                      Trạng thái
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(normalizeStatus((selectedOrderDetails?.status ?? selectedOrder?.status) || "PENDING"))}`}
                    >
                      {normalizeStatus(
                        (selectedOrderDetails?.status ??
                          selectedOrder?.status) ||
                          "PENDING",
                      )}
                    </span>
                  </div>
                  <div className="rounded-2xl bg-surface-container-low p-4">
                    <p className="text-xs uppercase tracking-wide text-on-surface-variant mb-1">
                      Phương thức thanh toán
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold border ${getPaymentMethodStyle(selectedOrderDetails?.paymentMethod ?? selectedOrder?.paymentMethod ?? "")}`}
                    >
                      {getPaymentMethodLabel(
                        selectedOrderDetails?.paymentMethod ??
                          selectedOrder?.paymentMethod ??
                          "",
                      )}
                    </span>
                  </div>
                  <div className="rounded-2xl bg-surface-container-low p-4">
                    <p className="text-xs uppercase tracking-wide text-on-surface-variant mb-1">
                      Tổng tiền
                    </p>
                    <p className="font-semibold text-on-surface">
                      {formatCurrencyVnd(
                        selectedOrderDetails?.totalAmount ??
                          selectedOrderDetails?.totalPrice ??
                          selectedOrderDetails?.total ??
                          selectedOrder?.totalAmount ??
                          selectedOrder?.totalPrice ??
                          selectedOrder?.total ??
                          0,
                      )}
                    </p>
                  </div>
                </div>

                <div className="border border-outline-variant rounded-2xl overflow-hidden">
                  <div className="bg-surface-container px-4 py-3 text-sm font-semibold text-on-surface">
                    Sản phẩm
                  </div>
                  <div className="divide-y divide-outline-variant/60">
                    {getOrderItems(selectedOrderDetails ?? selectedOrder)
                      .length === 0 ? (
                      <div className="p-4 text-sm text-on-surface-variant">
                        Không có sản phẩm trong đơn hàng.
                      </div>
                    ) : (
                      getOrderItems(selectedOrderDetails ?? selectedOrder).map(
                        (item: any, index: number) => {
                          const book = item?.book ?? item?.product ?? {};
                          const title =
                            book?.title ??
                            item?.productName ??
                            item?.name ??
                            item?.title ??
                            `Sản phẩm ${index + 1}`;
                          const quantity = Number(
                            item?.quantity ?? item?.qty ?? 1,
                          );
                          const unitPrice = Number(
                            item?.unitPrice ?? item?.price ?? item?.amount ?? 0,
                          );
                          const coverImage =
                            item?.coverImage ??
                            book?.coverImage ??
                            book?.cover ??
                            item?.image ??
                            item?.productImage ??
                            "";

                          return (
                            <div
                              key={`${title}-${index}`}
                              className="flex items-center justify-between gap-4 p-4"
                            >
                              <div className="flex items-start gap-3">
                                {coverImage ? (
                                  <img
                                    src={getBookCoverUrl(coverImage)}
                                    alt={title}
                                    className="h-16 w-16 rounded-2xl object-cover border border-outline"
                                    onError={(event) => {
                                      const target =
                                        event.currentTarget as HTMLImageElement;
                                      target.src =
                                        "https://placehold.co/160x160?text=No+Image";
                                    }}
                                  />
                                ) : null}
                                <div>
                                  <p className="font-medium text-on-surface">
                                    {title}
                                  </p>
                                  <p className="text-sm text-on-surface-variant">
                                    Số lượng: {quantity}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-on-surface-variant">
                                  {formatCurrencyVnd(unitPrice)} / sản phẩm
                                </p>
                                <p className="font-semibold text-on-surface">
                                  {formatCurrencyVnd(unitPrice * quantity)}
                                </p>
                              </div>
                            </div>
                          );
                        },
                      )
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
