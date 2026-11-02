import {
  createItem,
  deleteItem,
  getItemById,
  getItems,
  updateItem,
} from "./attributeApi";

export async function getPublishers(page = 0, size = 10, sort?: string) {
  return getItems("publishers", page, size, sort);
}

export async function getPublisherById(id: string | number) {
  return getItemById("publishers", id);
}

export async function createPublisher(payload: Record<string, unknown>) {
  return createItem("publishers", payload);
}

export async function updatePublisher(
  id: string | number,
  payload: Record<string, unknown>,
) {
  return updateItem("publishers", id, payload);
}

export async function deletePublisher(id: string | number) {
  return deleteItem("publishers", id);
}
