import axiosClient from "./axiosClient";

const API_ORIGIN = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
).replace(/\/api$/, "");

export interface BannerPayload {
  title?: string;
  link?: string;
  status?: string;
  image?: string;
  imageUrl?: string;
}

export function resolveBannerImageUrl(
  imageValue?: string | null,
  bannerId?: string | number,
) {
  if (!imageValue) {
    return "";
  }

  const value = String(imageValue).trim();
  if (!value) {
    return "";
  }

  if (value.startsWith("data:image/") || /^https?:\/\//i.test(value)) {
    return value;
  }

  const normalized = value.replace(/^\/+/, "");

  if (normalized.startsWith("uploads/")) {
    return `${API_ORIGIN}/${normalized}`;
  }

  if (normalized.startsWith("upload/")) {
    return `${API_ORIGIN}/${normalized}`;
  }

  if (normalized.includes("/")) {
    return `${API_ORIGIN}/uploads/${normalized}`;
  }

  return `${API_ORIGIN}/uploads/banners/${normalized}`;
}

export async function getBanners(page = 0, size = 10, search = "") {
  return axiosClient.get("/api/banners", {
    params: {
      page,
      size,
      search: search || undefined,
    },
  });
}

export async function createBanner(payload: BannerPayload) {
  return axiosClient.post("/api/banners", payload);
}

export async function updateBanner(
  id: string | number,
  payload: BannerPayload,
) {
  return axiosClient.put(`/api/banners/${id}`, payload);
}

export async function updateBannerStatus(id: string | number, status: string) {
  return axiosClient.put(`/api/banners/${id}/status`, { status });
}

export async function uploadBannerImage(
  file: File,
  bannerId?: string | number,
) {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", file);

  if (bannerId !== undefined && bannerId !== null && String(bannerId).length) {
    formData.append("bannerId", String(bannerId));
  }

  const headers: Record<string, string> = {
    "Content-Type": "multipart/form-data",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return axiosClient.post("/api/banners/upload", formData, {
    headers,
  });
}

export async function deleteBanner(id: string | number) {
  return axiosClient.delete(`/api/banners/${id}`);
}
