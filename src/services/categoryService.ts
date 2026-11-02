import {
  createItem,
  deleteItem,
  getItemById,
  getItems,
  updateItem,
} from "./attributeApi";

export async function getCategories(page = 0, size = 10, sort?: string) {
  return getItems("categories", page, size, sort);
}

export async function getCategoryById(id: string | number) {
  return getItemById("categories", id);
}

export async function createCategory(payload: Record<string, unknown>) {
  return createItem("categories", payload);
}

export async function updateCategory(
  id: string | number,
  payload: Record<string, unknown>,
) {
  return updateItem("categories", id, payload);
}

export async function deleteCategory(id: string | number) {
  return deleteItem("categories", id);
}
