import axiosClient from "./axiosClient";
import type { User, Order } from "../types";

export interface UpdateUserProfilePayload {
  fullName?: string;
  email?: string;
  phone?: string;
  addresses?: UserAddress[];
}

export interface UserAddress {
  addressId?: number | string;
  receiverName?: string;
  phone?: string;
  province?: string;
  district?: string;
  ward?: string;
  detailAddress?: string;
  isDefault?: boolean;
}

export interface CreateUserAddressPayload {
  receiverName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  detailAddress: string;
  isDefault?: boolean;
}

async function requestWithFallback<T>(
  method: "get" | "put",
  payload?: UpdateUserProfilePayload,
) {
  const endpoints = ["/api/users/profile", "/api/users/me"];
  let lastError: unknown;

  for (const endpoint of endpoints) {
    try {
      if (method === "get") {
        return await axiosClient.get<T>(endpoint);
      }

      return await axiosClient.put<T>(endpoint, payload);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status !== 404 && status !== 405) {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError;
}

export function getUserProfile() {
  return requestWithFallback<User>("get");
}

export function updateUserProfile(payload: UpdateUserProfilePayload) {
  return requestWithFallback<User>("put", payload);
}

export function getUserAddresses() {
  return axiosClient.get<UserAddress[]>("/api/addresses");
}

export function createUserAddress(payload: CreateUserAddressPayload) {
  return axiosClient.post<UserAddress>("/api/addresses", payload);
}

export async function setDefaultUserAddress(addressId: number | string) {
  const id = encodeURIComponent(String(addressId));
  const endpoints = [
    `/api/addresses/${id}/default`,
    `/api/addresses/${id}`,
    `/api/users/profile/default-address`,
    `/api/users/default-address`,
  ];

  let lastError: unknown;

  for (const endpoint of endpoints) {
    try {
      return await axiosClient.put(endpoint, { addressId, isDefault: true });
    } catch (error: any) {
      const status = error?.response?.status;
      if (status !== 404 && status !== 405) {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError ?? new Error("Không thể thiết lập địa chỉ mặc định.");
}

export function getMyOrders() {
  return axiosClient.get<Order[]>("/api/orders/my");
}
export function getOrderDetail(orderId: string | number) {
  return axiosClient.get<Order>(
    `/api/orders/${encodeURIComponent(String(orderId))}`,
  );
}
