import axiosClient from "./axiosClient";

export interface VoucherPayload {
  code?: string;
  description?: string;
  discountType?: string;
  discountValue?: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export async function getVouchers(page = 0, size = 10, search = "") {
  return axiosClient.get("/api/vouchers/admin", {
    params: { page, size, keyword: search },
  });
}

export async function getPublicVouchers() {
  return axiosClient.get("/api/vouchers");
}

export async function createVoucher(payload: VoucherPayload) {
  return axiosClient.post("/api/vouchers", payload);
}

export async function updateVoucher(
  id: string | number,
  payload: VoucherPayload,
) {
  return axiosClient.put(`/api/vouchers/${id}`, payload);
}

export async function deleteVoucher(id: string | number) {
  return axiosClient.delete(`/api/vouchers/${id}`);
}
