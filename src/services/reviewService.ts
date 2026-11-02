import axiosClient from "./axiosClient";

export interface ReviewStatsResponse {
  averageRating?: number;
  totalReviews?: number;
}

export interface ReviewItem {
  id?: string | number;
  rating?: number;
  comment?: string;
  createdAt?: string;
  status?: string;
  isVisible?: boolean;
  customerName?: string;
  userName?: string;
  username?: string;
  fullName?: string;
  name?: string;
  customer?: {
    fullName?: string;
    name?: string;
    username?: string;
  };
  author?: {
    fullName?: string;
    name?: string;
    username?: string;
  };
  user?: {
    fullName?: string;
    name?: string;
    username?: string;
  };
  book?: {
    title?: string;
  };
  bookTitle?: string;
  bookName?: string;
}

export async function getReviews(page = 0, size = 10, search = "") {
  return axiosClient.get("/api/reviews", {
    params: { page, size, search },
  });
}

export async function updateReviewStatus(id: string | number, status: string) {
  return axiosClient.put(`/api/reviews/${id}/status`, {
    status,
    isVisible: status === "VISIBLE",
  });
}

export async function createReview(payload: {
  bookId: string | number;
  rating: number;
  comment?: string;
}) {
  return axiosClient.post("/api/reviews", payload);
}

export async function getBookReviews(bookId: string | number) {
  return axiosClient.get<ReviewItem[]>(
    `/api/reviews/book/${encodeURIComponent(String(bookId))}`,
  );
}

export async function getBookReviewStats(bookId: string | number) {
  return axiosClient.get<ReviewStatsResponse>(
    `/api/reviews/book/${encodeURIComponent(String(bookId))}/stats`,
  );
}
