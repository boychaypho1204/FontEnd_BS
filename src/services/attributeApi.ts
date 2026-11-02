import axiosClient from "./axiosClient";

export type AttributeTabKey = "categories" | "authors" | "publishers";

export interface AttributeItem {
  id?: string | number;
  name?: string;
  title?: string;
  description?: string;
  [key: string]: unknown;
}

export interface AttributePageResponse {
  content: AttributeItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface AttributeFormPayload {
  name?: string;
  title?: string;
  value?: string;
  label?: string;
  categoryName?: string;
  authorName?: string;
  publisherName?: string;
  address?: string;
  phone?: string;
  website?: string;
  status?: string;
  slug?: string;
  description?: string;
  bio?: string;
  avatar?: string;
}

function getResourcePath(resource: AttributeTabKey) {
  return `/api/${resource}`;
}

function buildListParams(page: number, size: number, sort?: string) {
  const params: Record<string, string | number> = { page, size };

  if (sort) {
    params.sort = sort;
  }

  return params;
}

function buildAttributePayload(
  resource: AttributeTabKey,
  value: string | AttributeFormPayload,
) {
  if (resource === "publishers") {
    if (typeof value === "object" && value !== null) {
      const normalizedName = (value.name ?? "").toString().trim();
      const normalizedAddress = (value.address ?? "").toString().trim();
      const normalizedPhone = (value.phone ?? "").toString().trim();
      const normalizedWebsite = (value.website ?? "").toString().trim();
      const normalizedStatus = (value.status ?? "ACTIVE")
        .toString()
        .trim()
        .toUpperCase();

      return {
        name: normalizedName,
        address: normalizedAddress || null,
        phone: normalizedPhone || null,
        website: normalizedWebsite || null,
        status: normalizedStatus || "ACTIVE",
      };
    }

    return {
      name: typeof value === "string" ? value.trim() : "",
      address: null,
      phone: null,
      website: null,
      status: "ACTIVE",
    };
  }

  if (typeof value === "object" && value !== null) {
    if (resource === "categories") {
      return {
        name: value.name?.trim() ?? "",
        slug: (value.slug ?? "").toString().trim() || undefined,
        description: (value.description ?? "").toString().trim() || undefined,
        status: (value.status ?? "ACTIVE").toString().trim().toUpperCase(),
      };
    }

    if (resource === "authors") {
      return {
        name: value.name?.trim() ?? "",
        bio: (value.bio ?? "").toString().trim() || undefined,
        avatar: (value.avatar ?? "").toString().trim() || undefined,
        status: (value.status ?? "ACTIVE").toString().trim().toUpperCase(),
      };
    }

    return {
      name: value.name?.trim() ?? "",
      title: value.title?.trim() ?? value.name?.trim() ?? "",
      value: value.value?.trim() ?? value.name?.trim() ?? "",
      label: value.label?.trim() ?? value.name?.trim() ?? "",
      categoryName: value.categoryName?.trim() ?? value.name?.trim() ?? "",
      authorName: value.authorName?.trim() ?? value.name?.trim() ?? "",
      publisherName: value.publisherName?.trim() ?? value.name?.trim() ?? "",
    };
  }

  const trimmedValue = typeof value === "string" ? value.trim() : "";

  switch (resource) {
    case "categories":
      return {
        name: trimmedValue,
        title: trimmedValue,
        value: trimmedValue,
        label: trimmedValue,
        categoryName: trimmedValue,
      };
    case "authors":
      return {
        name: trimmedValue,
        title: trimmedValue,
        value: trimmedValue,
        label: trimmedValue,
        authorName: trimmedValue,
      };
    default:
      return {
        name: trimmedValue,
        title: trimmedValue,
        value: trimmedValue,
        label: trimmedValue,
      };
  }
}

export async function getItems(
  resource: AttributeTabKey,
  page = 0,
  size = 10,
  sort?: string,
): Promise<AttributePageResponse> {
  const response = await axiosClient.get(getResourcePath(resource), {
    params: buildListParams(page, size, sort),
  });
  const payload = response.data;

  if (payload && Array.isArray(payload.content)) {
    return payload as AttributePageResponse;
  }

  if (Array.isArray(payload)) {
    return {
      content: payload,
      totalElements: payload.length,
      totalPages: 1,
      number: 0,
      size,
    };
  }

  if (Array.isArray(payload?.data)) {
    return {
      content: payload.data,
      totalElements: payload.data.length,
      totalPages: 1,
      number: 0,
      size,
    };
  }

  return {
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size,
  };
}

export async function getItemById(
  resource: AttributeTabKey,
  id: string | number,
) {
  const response = await axiosClient.get(`${getResourcePath(resource)}/${id}`);
  return response.data as AttributeItem;
}

export async function createItem(
  resource: AttributeTabKey,
  payload: Record<string, unknown>,
) {
  return axiosClient.post(getResourcePath(resource), payload);
}

export async function updateItem(
  resource: AttributeTabKey,
  id: string | number,
  payload: Record<string, unknown>,
) {
  return axiosClient.put(`${getResourcePath(resource)}/${id}`, payload);
}

export function createAttributePayload(
  resource: AttributeTabKey,
  value: string | AttributeFormPayload,
) {
  return buildAttributePayload(resource, value);
}

export async function deleteItem(
  resource: AttributeTabKey,
  id: string | number,
) {
  return axiosClient.delete(`${getResourcePath(resource)}/${id}`);
}
