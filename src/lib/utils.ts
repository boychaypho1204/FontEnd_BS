import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function resolveAssetUrl(
  path?: string,
  fallback = "/images/placeholder-book.png",
) {
  if (!path) {
    return fallback;
  }

  const trimmed = String(path).trim();
  if (!trimmed) {
    return fallback;
  }

  if (
    /^https?:\/\//i.test(trimmed) ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  const apiBase = (
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api"
  )
    .replace(/\/api\/?$/, "")
    .replace(/\/$/, "");

  if (trimmed.startsWith("uploads/")) {
    return `${apiBase}/${trimmed}`;
  }

  return `${apiBase}/uploads/${trimmed}`;
}
