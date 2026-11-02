import {
  createItem,
  deleteItem,
  getItemById,
  getItems,
  updateItem,
} from "./attributeApi";

export async function getAuthors(page = 0, size = 10, sort?: string) {
  return getItems("authors", page, size, sort);
}

export async function getAuthorById(id: string | number) {
  return getItemById("authors", id);
}

export async function createAuthor(payload: Record<string, unknown>) {
  return createItem("authors", payload);
}

export async function updateAuthor(
  id: string | number,
  payload: Record<string, unknown>,
) {
  return updateItem("authors", id, payload);
}

export async function deleteAuthor(id: string | number) {
  return deleteItem("authors", id);
}
