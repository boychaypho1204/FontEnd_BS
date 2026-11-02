import apiClient from "./apiClient";
import type { Book } from "../types";

export async function addToWishlist(bookId: string | number) {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Vui lòng đăng nhập để sử dụng wishlist.");
  }

  const url = `/wishlists?bookId=${encodeURIComponent(String(bookId))}`;

  try {
    return await apiClient.post<Book>(url, undefined);
  } catch (error) {
    console.error("Add to wishlist failed", error);
    throw error;
  }
}

export function getWishlist() {
  return apiClient.get<Book[]>("/wishlists");
}

export function removeFromWishlist(bookId: string | number) {
  const url = `/wishlists?bookId=${encodeURIComponent(String(bookId))}`;
  return apiClient.delete<void>(url);
}
