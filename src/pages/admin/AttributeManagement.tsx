import React, { useEffect, useMemo, useState } from "react";
import { Plus, Edit2, Trash2, Tag, Layers, X } from "lucide-react";
import { toast } from "react-toastify";
import {
  createAttributePayload,
  createItem,
  deleteItem,
  getItems,
  updateItem,
  type AttributeItem,
  type AttributePageResponse,
  type AttributeTabKey,
} from "../../services/attributeApi";

const tabConfig: Array<{
  key: AttributeTabKey;
  title: string;
  icon: React.ReactNode;
  accent: string;
}> = [
  {
    key: "categories",
    title: "Categories",
    icon: <Layers className="text-primary" size={20} />,
    accent: "text-primary",
  },
  {
    key: "authors",
    title: "Authors",
    icon: <Tag className="text-secondary" size={20} />,
    accent: "text-secondary",
  },
  {
    key: "publishers",
    title: "Publishers",
    icon: <Tag className="text-tertiary" size={20} />,
    accent: "text-tertiary",
  },
];

export function AttributeManagement() {
  const [activeTab, setActiveTab] = useState<AttributeTabKey>("categories");
  const [items, setItems] = useState<AttributeItem[]>([]);
  const [pageInfo, setPageInfo] = useState<AttributePageResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AttributeItem | null>(null);
  const [formValue, setFormValue] = useState("");
  const [publisherForm, setPublisherForm] = useState({
    name: "",
    address: "",
    phone: "",
    website: "",
    status: "ACTIVE",
  });
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    description: "",
    status: "ACTIVE",
  });
  const [authorForm, setAuthorForm] = useState({
    name: "",
    bio: "",
    avatar: "",
    status: "ACTIVE",
  });
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);

  const activeConfig = useMemo(
    () => tabConfig.find((tab) => tab.key === activeTab),
    [activeTab],
  );

  const fetchItems = async (nextPage = page) => {
    setLoading(true);
    setError("");

    try {
      const data = await getItems(activeTab, nextPage, pageSize);
      setItems(data.content);
      setPageInfo(data);
      setPage(data.number);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    fetchItems(0);
  }, [activeTab]);

  const resetForm = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormValue("");
    setPublisherForm({
      name: "",
      address: "",
      phone: "",
      website: "",
      status: "ACTIVE",
    });
    setCategoryForm({
      name: "",
      slug: "",
      description: "",
      status: "ACTIVE",
    });
    setAuthorForm({
      name: "",
      bio: "",
      avatar: "",
      status: "ACTIVE",
    });
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (item: AttributeItem) => {
    setEditingItem(item);

    if (activeTab === "publishers") {
      setPublisherForm({
        name: String(item.name ?? ""),
        address: String(item.address ?? ""),
        phone: String(item.phone ?? ""),
        website: String(item.website ?? ""),
        status: String(item.status ?? "ACTIVE"),
      });
    } else if (activeTab === "categories") {
      setCategoryForm({
        name: String(item.name ?? ""),
        slug: String(item.slug ?? ""),
        description: String(item.description ?? ""),
        status: String(item.status ?? "ACTIVE"),
      });
    } else if (activeTab === "authors") {
      setAuthorForm({
        name: String(item.name ?? ""),
        bio: String(item.bio ?? ""),
        avatar: String(item.avatar ?? ""),
        status: String(item.status ?? "ACTIVE"),
      });
    } else {
      setFormValue(String(item.name ?? item.title ?? ""));
    }

    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === "publishers") {
      if (!publisherForm.name.trim()) {
        setError("Name is required");
        return;
      }
    } else if (activeTab === "categories") {
      if (!categoryForm.name.trim()) {
        setError("Name is required");
        return;
      }
    } else if (activeTab === "authors") {
      if (!authorForm.name.trim()) {
        setError("Name is required");
        return;
      }
    } else if (!formValue.trim()) {
      setError("Name is required");
      return;
    }

    try {
      const payload =
        activeTab === "publishers"
          ? createAttributePayload(activeTab, publisherForm)
          : activeTab === "categories"
            ? createAttributePayload(activeTab, categoryForm)
            : activeTab === "authors"
              ? createAttributePayload(activeTab, authorForm)
              : createAttributePayload(activeTab, formValue);

      if (editingItem?.id) {
        await updateItem(activeTab, editingItem.id, payload);
        toast.success(`${activeConfig?.title} updated successfully`);
      } else {
        await createItem(activeTab, payload);
        toast.success(`${activeConfig?.title} created successfully`);
      }
      await fetchItems(page);
      resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Operation failed";
      setError(message);
      toast.error(message);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!window.confirm("Delete this item?")) {
      return;
    }

    try {
      await deleteItem(activeTab, id);
      toast.success(`${activeConfig?.title} deleted successfully`);
      await fetchItems(page);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Delete failed";
      setError(message);
      toast.error(message);
    }
  };

  const getAttributeItemId = (
    item: AttributeItem,
  ): string | number | undefined => {
    const directId = item.id;
    if (typeof directId === "string" || typeof directId === "number") {
      return directId;
    }

    const altId = item.categoryId ?? item.authorId ?? item.publisherId;
    if (typeof altId === "string" || typeof altId === "number") {
      return altId;
    }

    return undefined;
  };

  const getAttributeItemKey = (item: AttributeItem, index: number) => {
    const rawId = getAttributeItemId(item);
    if (rawId !== undefined) {
      return String(rawId);
    }

    const label = item.name ?? item.title ?? "";
    return label ? `${label}-${index}` : `attribute-item-${index}`;
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">
            Attributes Management
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Manage categories, authors, and publishers from the backend.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabConfig.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${activeTab === tab.key ? "bg-primary text-white border-primary" : "bg-surface border-outline-variant text-on-surface-variant"}`}
          >
            {tab.title}
          </button>
        ))}
      </div>

      <div className="bg-surface border border-outline-variant rounded-xl flex flex-col h-full overflow-hidden shadow-sm">
        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
          <div className="flex items-center gap-2">
            {activeConfig?.icon}
            <h3 className="font-bold text-on-surface">{activeConfig?.title}</h3>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-1 transition-colors"
          >
            <Plus size={16} /> Add
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {error ? <p className="mb-3 text-sm text-red-500">{error}</p> : null}

          {loading ? (
            <p className="text-sm text-on-surface-variant">Loading...</p>
          ) : (
            <div className="flex flex-col gap-3">
              {items.length === 0 ? (
                <p className="text-sm text-on-surface-variant">
                  No data available.
                </p>
              ) : (
                items.map((item, index) => {
                  const label = String(item.name ?? item.title ?? "Unnamed");
                  const id = getAttributeItemId(item);
                  const canDelete = id !== undefined;

                  return (
                    <div
                      key={getAttributeItemKey(item, index)}
                      className="flex items-center justify-between p-3 border border-outline-variant rounded-lg hover:border-primary/50 transition-colors group"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-on-surface">
                          {label}
                        </span>
                        {item.description ? (
                          <span className="text-xs text-on-surface-variant">
                            {String(item.description)}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1 text-on-surface-variant hover:text-primary"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => id !== undefined && handleDelete(id)}
                            disabled={!canDelete}
                            className="p-1 text-on-surface-variant hover:text-error disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {pageInfo && pageInfo.totalPages > 1 ? (
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={() => fetchItems(Math.max(0, page - 1))}
                disabled={page === 0}
                className="rounded border border-outline-variant px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: pageInfo.totalPages }, (_, index) => (
                <button
                  key={index}
                  onClick={() => fetchItems(index)}
                  className={`rounded px-3 py-1.5 text-sm ${page === index ? "bg-primary text-white" : "border border-outline-variant"}`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() =>
                  fetchItems(Math.min(pageInfo.totalPages - 1, page + 1))
                }
                disabled={page >= pageInfo.totalPages - 1}
                className="rounded border border-outline-variant px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl border border-outline-variant">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-on-surface">
                {editingItem ? "Edit" : "Add"} {activeConfig?.title}
              </h3>
              <button
                onClick={resetForm}
                className="p-1 rounded hover:bg-surface-variant"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === "publishers" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">
                      Name
                    </label>
                    <input
                      value={publisherForm.name}
                      onChange={(e) =>
                        setPublisherForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                      placeholder="Enter publisher name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">
                      Address
                    </label>
                    <input
                      value={publisherForm.address}
                      onChange={(e) =>
                        setPublisherForm((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                      placeholder="Enter address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">
                      Phone
                    </label>
                    <input
                      value={publisherForm.phone}
                      onChange={(e) =>
                        setPublisherForm((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                      placeholder="Enter phone"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">
                      Website
                    </label>
                    <input
                      value={publisherForm.website}
                      onChange={(e) =>
                        setPublisherForm((prev) => ({
                          ...prev,
                          website: e.target.value,
                        }))
                      }
                      className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                      placeholder="Enter website"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">
                      Status
                    </label>
                    <select
                      value={publisherForm.status}
                      onChange={(e) =>
                        setPublisherForm((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                      className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </>
              ) : activeTab === "categories" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">
                      Name
                    </label>
                    <input
                      value={categoryForm.name}
                      onChange={(e) =>
                        setCategoryForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                      placeholder="Enter category name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">
                      Slug
                    </label>
                    <input
                      value={categoryForm.slug}
                      onChange={(e) =>
                        setCategoryForm((prev) => ({
                          ...prev,
                          slug: e.target.value,
                        }))
                      }
                      className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                      placeholder="Enter category slug"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">
                      Description
                    </label>
                    <textarea
                      value={categoryForm.description}
                      onChange={(e) =>
                        setCategoryForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                      placeholder="Enter description"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">
                      Status
                    </label>
                    <select
                      value={categoryForm.status}
                      onChange={(e) =>
                        setCategoryForm((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                      className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </>
              ) : activeTab === "authors" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">
                      Name
                    </label>
                    <input
                      value={authorForm.name}
                      onChange={(e) =>
                        setAuthorForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                      placeholder="Enter author name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">
                      Bio
                    </label>
                    <textarea
                      value={authorForm.bio}
                      onChange={(e) =>
                        setAuthorForm((prev) => ({
                          ...prev,
                          bio: e.target.value,
                        }))
                      }
                      className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                      placeholder="Enter biography"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">
                      Avatar
                    </label>
                    <input
                      value={authorForm.avatar}
                      onChange={(e) =>
                        setAuthorForm((prev) => ({
                          ...prev,
                          avatar: e.target.value,
                        }))
                      }
                      className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                      placeholder="Enter avatar URL"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">
                      Status
                    </label>
                    <select
                      value={authorForm.status}
                      onChange={(e) =>
                        setAuthorForm((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                      className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-2">
                    Name
                  </label>
                  <input
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                    placeholder={`Enter ${activeConfig?.title.toLowerCase()} name`}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded px-3 py-2 text-sm border border-outline-variant"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-primary px-3 py-2 text-sm font-semibold text-white"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
