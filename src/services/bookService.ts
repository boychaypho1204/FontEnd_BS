import apiClient from "./apiClient";
import type { Book } from "../types";

export interface Category {
  id?: string;
  categoryId?: string;
  name: string;
  image?: string;
  imageUrl?: string;
}

export interface Author {
  id?: string;
  authorId?: string;
  name: string;
}

export interface Publisher {
  id?: string;
  publisherId?: string;
  name: string;
}

export interface BookQueryParams {
  category?: string | string[];
  categoryId?: string | string[] | number | number[];
  categoryIds?: string | string[] | number | number[];
  authorId?: string | string[] | number | number[];
  authorIds?: string | string[] | number | number[];
  publisherId?: string | string[] | number | number[];
  publisherIds?: string | string[] | number | number[];
  page?: number;
  size?: number;
  sort?: string;
  keyword?: string;
}

export interface ReviewPayload {
  bookId: string;
  rating: number;
  comment: string;
}

function serializeParams(params: Record<string, unknown>) {
  const entries: string[] = [];
  const encode = encodeURIComponent;

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        entries.push(`${encode(key)}=${encode(String(item))}`);
      });
      return;
    }

    entries.push(`${encode(key)}=${encode(String(value))}`);
  });

  return entries.join("&");
}

export function getBooks(params: BookQueryParams = {}) {
  return apiClient.get<Book[]>("/books", {
    params,
    paramsSerializer: serializeParams,
  });
}

export function getBookById(id: string) {
  return apiClient.get<Book>(`/books/${encodeURIComponent(String(id))}`);
}

export function getCategories(params?: Record<string, unknown>) {
  return apiClient.get<Category[]>("/categories", { params });
}

export function getAuthors(params?: Record<string, unknown>) {
  return apiClient.get<Author[]>("/authors", { params });
}

export function getPublishers(params?: Record<string, unknown>) {
  return apiClient.get<Publisher[]>("/publishers", { params });
}

export function postReview(data: ReviewPayload) {
  return apiClient.post("/reviews", data);
}

export interface BookPayload {
  title?: string;
  isbn?: string;
  price?: number;
  stock?: number;
  stockQuantity?: number;
  quantity?: number;
  sold?: number;
  soldQuantity?: number;
  quantitySold?: number;
  totalSold?: number;
  soldCount?: number;
  sales?: number;
  publicationYear?: number;
  publishYear?: number;
  categoryId?: string | number;
  categoryIds?: Array<string | number>;
  categories?: Array<string | number>;
  publisherId?: string | number;
  publisherIds?: Array<string | number>;
  authorIds?: Array<string | number>;
  authors?: Array<string | number>;
  description?: string;
  discountPercent?: number;
  summary?: string;
  status?: string;
  coverImage?: string;
}

export function createBook(data: BookPayload) {
  return apiClient.post("/books", data);
}

export function updateBook(id: string | number, data: BookPayload) {
  return apiClient.put(`/books/${encodeURIComponent(String(id))}`, data);
}

export function deleteBook(id: string | number) {
  return apiClient.delete(`/books/${encodeURIComponent(String(id))}`);
}

// export function uploadBookCover(
//   id: string | number,
//   data: { coverImage?: string; fileName?: string; file?: File },
// ) {
//   if (data.file) {
//     const formData = new FormData();
//     formData.append("file", data.file);

//     if (data.coverImage) {
//       formData.append("coverImage", data.coverImage);
//     }

//     if (data.fileName) {
//       formData.append("fileName", data.fileName);
//     }

//     return apiClient.post(
//       `/books/${encodeURIComponent(String(id))}/upload-cover`,
//       formData,
//       {
//         headers: {
//           "Content-Type": "multipart/form-data",
//         },
//       },
//     );
//   }

//   return apiClient.post(
//     `/books/${encodeURIComponent(String(id))}/upload-cover`,
//     data,
//   );
// }

export function uploadBookCover(
  id: string | number,
  data: { coverImage?: string; fileName?: string }, // Chờ nhận chuỗi Base64 từ form
) {
  // Gửi thẳng cục data (JSON) lên cho @RequestBody của Spring Boot
  return apiClient.post(
    `/books/${encodeURIComponent(String(id))}/upload-cover`,
    data,
    {
      headers: {
        "Content-Type": "application/json", // ❤️ Chốt hạ ép kiểu JSON
      },
    },
  );
}
