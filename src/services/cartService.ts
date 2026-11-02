import apiClient from "./apiClient";
import type { Book, CartItem } from "../types";

export interface Voucher {
  id: string;
  code: string;
  discountPercentage: number;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export function addToCart(bookId: string, quantity = 1) {
  return apiClient.post<CartItem>("/cart", {
    bookId,
    quantity,
  });
}

export function getCartItems() {
  return apiClient.get<CartItem[]>("/cart");
}

export function updateCartItem(itemId: string, quantity: number) {
  return apiClient.put<CartItem>(`/cart/${itemId}`, {
    quantity,
  });
}

export function removeCartItem(itemId: string) {
  return apiClient.delete<void>(`/cart/${itemId}`);
}

export function getVouchers() {
  return apiClient.get<Voucher[]>("/vouchers");
}
