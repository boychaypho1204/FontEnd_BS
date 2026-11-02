import axiosClient from "./axiosClient";
import type { Book } from "../types";

export interface Banner {
  id: string;
  image?: string;
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  link?: string;
  status?: string;
  isActive?: boolean;
  active?: boolean;
  ctaText?: string;
  ctaLink?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  imageUrl?: string;
}

export function getBanners() {
  return axiosClient.get<Banner[]>("/api/banners");
}

export function getCategories() {
  return axiosClient.get<Category[]>("/api/categories");
}

export function getFeaturedBooks(size = 8) {
  return axiosClient.get<Book[]>("/api/books", {
    params: { size },
  });
}
