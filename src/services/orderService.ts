import apiClient from "./apiClient";

export interface OrderPayload {
  addressId?: number | string;
  address?: string;
  voucherCode?: string;
  shippingFee?: number;
  paymentMethod?: string;
  items?: Array<{
    bookId?: number | string;
    quantity?: number;
  }>;
  orderItems?: Array<{
    bookId?: number | string;
    quantity?: number;
  }>;
  bookItems?: Array<{
    bookId?: number | string;
    quantity?: number;
  }>;
  books?: Array<{
    bookId?: number | string;
    quantity?: number;
  }>;
}

export interface CreateOrderResponse {
  orderId?: string;
  id?: string;
  paymentUrl?: string;
  url?: string;
}

export interface VnpayReturnResponse {
  success: boolean;
  message: string;
  orderId?: string;
}

function extractOrderId(data: any) {
  if (!data) return undefined;
  if (typeof data === "string") return data;
  return data.orderId ?? data.id ?? data?.data?.orderId ?? data?.data?.id;
}

function extractPaymentUrl(data: any) {
  if (!data) return undefined;
  return (
    data.url ?? data.paymentUrl ?? data?.data?.url ?? data?.data?.paymentUrl
  );
}

export function createOrder(payload: OrderPayload) {
  return apiClient.post<CreateOrderResponse>("/orders", payload);
}

export function createVnpayUrl(orderId: string) {
  return apiClient.post<{ url?: string }>("/payments/create-url", {
    orderId,
  });
}

export function verifyVnpayReturn(params: URLSearchParams) {
  return apiClient.get<VnpayReturnResponse>("/payments/vnpay-return", {
    params: Object.fromEntries(params.entries()),
  });
}

export interface OrderRow {
  id?: string | number;
  orderId?: string | number;
  userName?: string;
  customerName?: string;
  totalAmount?: number;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  createdAt?: string;
  [key: string]: any;
}

export function getOrders(page?: number, size?: number, keyword?: string) {
  return apiClient.get("/orders", {
    params: {
      page: page,
      size: size,
      keyword: keyword, // Phải có dòng này để gửi chữ tìm kiếm lên API
    },
  });
}

function getAuthRole() {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("admin_access_token") ||
    localStorage.getItem("accessToken") ||
    "";

  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    const roleValue = payload?.role ?? payload?.roles ?? payload?.authorities;

    if (Array.isArray(roleValue)) {
      return roleValue.join(",").toUpperCase();
    }

    if (typeof roleValue === "string") {
      return roleValue.toUpperCase();
    }

    return null;
  } catch {
    return null;
  }
}

function isAdminRole(role: string | null) {
  return role?.includes("ADMIN") ?? false;
}

export function updateOrderStatus(id: string | number, status: string) {
  return apiClient.put(`/orders/${encodeURIComponent(String(id))}/status`, {
    status,
  });
}

export async function cancelOrder(id: string | number) {
  try {
    return await apiClient.put(
      `/orders/${encodeURIComponent(String(id))}/cancel`,
    );
  } catch (error: any) {
    const status = error?.response?.status;
    const message = error?.response?.data?.message;

    if (status === 404 || status === 405) {
      if (isAdminRole(getAuthRole())) {
        return await apiClient.put(
          `/orders/${encodeURIComponent(String(id))}/status`,
          {
            status: "CANCELLED",
          },
        );
      }

      throw new Error(
        "Backend hiện chưa hỗ trợ hủy đơn cho tài khoản khách hàng.",
      );
    }

    if (message) {
      throw new Error(message);
    }

    throw error;
  }
}

export async function cancelOrderByAdmin(id: string | number) {
  return apiClient.put(`/orders/${encodeURIComponent(String(id))}/status`, {
    status: "CANCELLED",
  });
}
