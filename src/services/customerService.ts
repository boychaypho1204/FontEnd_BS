import axiosClient from "./axiosClient";

function getAuthHeaders() {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("admin_access_token") ||
    localStorage.getItem("accessToken") ||
    "";

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

export async function getUsers(page = 0, size = 10, search = "") {
  return axiosClient.get("/api/users", {
    // Đổi 'search' thành 'keyword: search' để khớp 100% với Spring Boot
    params: { page, size, keyword: search },
    headers: getAuthHeaders(),
  });
}

export async function toggleUserStatus(id: string | number, status: string) {
  return axiosClient.put(
    `/api/users/${id}/status`,
    { status },
    {
      headers: getAuthHeaders(),
    },
  );
}
