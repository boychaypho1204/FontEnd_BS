// BÍ KÍP 1: Dùng lại apiClient của em để mang theo Token đăng nhập
import apiClient from "./apiClient";

export interface CreateVnpayRequest {
  amount: number;
  orderId: string;
  orderInfo?: string;
  bankCode?: string;
  language?: string;
}

export interface CreateVnpayResponse {
  url?: string;
  paymentUrl?: string;
  data?: string;
  [key: string]: any;
}

export const createVnpayUrl = async (data: CreateVnpayRequest) => {
  // BÍ KÍP 2: Đường dẫn giờ chỉ cần "/payments/vnpay/create" là chuẩn bài
  const response = await apiClient.post<CreateVnpayResponse>(
    "/payments/vnpay/create",
    data,
  );
  return response.data;
};

export default { createVnpayUrl };
