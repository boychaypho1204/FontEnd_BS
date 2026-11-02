import apiClient from "./apiClient";

export interface ContactPayload {
  fullName: string;
  email: string;
  message: string;
}

export function postContact(payload: ContactPayload) {
  return apiClient.post("/contacts", payload);
}

export function getContacts(page = 0, size = 10, keyword = "") {
  return apiClient.get("/contacts/admin", {
    params: { page, size, keyword },
  });
}

export function updateContactStatus(id: string | number, status: string) {
  return apiClient.put(`/contacts/${encodeURIComponent(String(id))}/status`, {
    status,
  });
}
