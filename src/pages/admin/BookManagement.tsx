import React, { useEffect, useMemo, useState } from "react";
import { Search, Plus, Edit2, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";
import {
  createBook,
  deleteBook,
  getAuthors,
  getBooks,
  getCategories,
  getPublishers,
  updateBook,
  uploadBookCover,
  type BookPayload,
} from "../../services/bookService";
import { fileToBase64 } from "../../services/uploadHelpers";

interface SelectOption {
  id: string | number;
  name?: string;
  title?: string;
}

interface BookRow {
  id: string | number;
  bookId?: string | number;
  title: string;
  isbn?: string;
  price?: number;
  stock?: number;
  stockQuantity?: number; // Bổ sung bắt biến stockQuantity
  quantity?: number; // Bổ sung bắt biến quantity
  sold?: number;
  soldQuantity?: number;
  quantitySold?: number;
  totalSold?: number;
  soldCount?: number;
  sales?: number;
  publicationYear?: number | string;
  category?:
    | { id?: string | number; categoryId?: string | number; name?: string }
    | string;
  categories?: Array<{ id?: string | number; name?: string }>; // Hỗ trợ mảng categories
  categoryName?: string;
  status?: string;
  cover?: string;
  coverImage?: string; // Bổ sung dòng này
  discountPercent?: number;
  categoryId?: string | number;
  authorIds?: Array<string | number>;
  publisherId?: string | number;
}

interface BookFormState {
  title: string;
  isbn: string;
  price: string;
  discountPercent: string;
  stock: string;
  publicationYear: string;
  categoryIds: string[];
  publisherId: string;
  authorIds: string[];
  description: string;
  status: string;
  coverFile: File | null;
  previewUrl: string | null;
}

const API_BASE_URL = "http://localhost:8080";
const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='280' viewBox='0 0 200 280'%3E%3Crect width='200' height='280' fill='%23f3f4f6'/%3E%3Crect x='24' y='24' width='152' height='232' rx='12' fill='%23ffffff' stroke='%23d1d5db' stroke-width='2'/%3E%3Cpath d='M64 176l25-35 20 24 24-34 27 45' fill='none' stroke='%239ca3af' stroke-width='8' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='84' cy='96' r='18' fill='%239ca3af'/%3E%3Ctext x='100' y='236' text-anchor='middle' font-size='18' font-family='Arial, sans-serif' fill='%236b7280'%3ENo Image%3C/text%3E%3C/svg%3E";

const emptyForm: BookFormState = {
  title: "",
  isbn: "",
  price: "",
  discountPercent: "0",
  stock: "",
  publicationYear: "",
  categoryIds: [],
  publisherId: "",
  authorIds: [],
  description: "",
  status: "ACTIVE",
  coverFile: null,
  previewUrl: null,
};

const getStableKey = (
  value: string | number | undefined,
  prefix: string,
  index: number,
) => {
  if (value !== undefined && value !== null && value !== "") {
    return String(value);
  }

  return `${prefix}-${index}`;
};

const isValidOption = (item: SelectOption) =>
  item.id !== undefined && item.id !== null && String(item.id).trim() !== "";

const normalizeSelectedValue = (value: string) =>
  ["undefined", "null"].includes(value) ? "" : value;

const getBookCoverUrl = (cover?: string) => {
  if (!cover || typeof cover !== "string") {
    return FALLBACK_IMAGE;
  }

  const trimmedValue = cover.trim();
  if (!trimmedValue) {
    return FALLBACK_IMAGE;
  }

  if (
    /^https?:\/\//i.test(trimmedValue) ||
    trimmedValue.startsWith("data:image/")
  ) {
    return trimmedValue;
  }

  const normalizedPath = trimmedValue.replace(/^\/+/, "");
  const pathWithUploads = normalizedPath.startsWith("uploads/")
    ? normalizedPath
    : `uploads/${normalizedPath}`;

  return `${API_BASE_URL}/${pathWithUploads}`;
};

const getBookSoldValue = (book: BookRow) =>
  Number(
    book.sold ??
      book.soldQuantity ??
      book.quantitySold ??
      book.totalSold ??
      book.soldCount ??
      book.sales ??
      0,
  );

const formatPriceVnd = (value: number | string | null | undefined) =>
  `${Number(value ?? 0).toLocaleString("vi-VN")}đ`;

export function BookManagement() {
  const [books, setBooks] = useState<BookRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageInfo, setPageInfo] = useState({
    number: 0,
    totalPages: 0,
    totalElements: 0,
    size: 10,
  });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookRow | null>(null);
  const [form, setForm] = useState<BookFormState>(emptyForm);
  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [authors, setAuthors] = useState<SelectOption[]>([]);
  const [publishers, setPublishers] = useState<SelectOption[]>([]);
  const [imageErrorMap, setImageErrorMap] = useState<
    Record<string | number, boolean>
  >({});

  const fetchBooks = async (nextPage = page, keyword = search) => {
    setLoading(true);

    try {
      const response = await getBooks({
        page: nextPage,
        size: 10,
        keyword: keyword,
      });
      const responseData = response.data as any;
      const payload = responseData?.data ?? responseData;
      const content = payload?.content ?? payload?.data ?? [];
      setBooks(content);
      setPageInfo({
        number: payload?.number ?? nextPage,
        totalPages: payload?.totalPages ?? 0,
        totalElements: payload?.totalElements ?? content.length,
        size: payload?.size ?? 10,
      });
      setPage(payload?.number ?? nextPage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load books");
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [categoryRes, authorRes, publisherRes] = await Promise.all([
        getCategories(),
        getAuthors(),
        getPublishers(),
      ]);

      const categoryPayload =
        (categoryRes.data as any)?.data ?? categoryRes.data;
      const authorPayload = (authorRes.data as any)?.data ?? authorRes.data;
      const publisherPayload =
        (publisherRes.data as any)?.data ?? publisherRes.data;

      // Chuẩn hóa lại dữ liệu để đảm bảo item nào cũng có thuộc tính .id chuẩn xác
      const parseList = (list: any[]) =>
        (list || [])
          .map((item) => ({
            ...item,
            id: item.id ?? item.categoryId ?? item.authorId ?? item.publisherId,
          }))
          .filter(
            (item) =>
              item.id !== undefined &&
              item.id !== null &&
              String(item.id).trim() !== "",
          );

      setCategories(
        parseList(
          categoryPayload?.content ?? categoryPayload?.data ?? categoryPayload,
        ),
      );
      setAuthors(
        parseList(
          authorPayload?.content ?? authorPayload?.data ?? authorPayload,
        ),
      );
      setPublishers(
        parseList(
          publisherPayload?.content ??
            publisherPayload?.data ??
            publisherPayload,
        ),
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load form options",
      );
    }
  };

  useEffect(() => {
    fetchBooks(0, search);
    fetchOptions();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchBooks(0, search);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    return () => {
      if (form.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(form.previewUrl);
      }
    };
  }, [form.previewUrl]);

  const resetForm = () => {
    if (form.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(form.previewUrl);
    }

    setForm({ ...emptyForm, previewUrl: null });
    setEditingBook(null);
    setIsModalOpen(false);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (book: any) => {
    setEditingBook(book);

    // Bóc tách danh sách ID thể loại an toàn
    const extractedCategoryIds = Array.isArray(book.categoryIds)
      ? book.categoryIds.map((item: any) => String(item))
      : Array.isArray(book.categories) && book.categories.length > 0
        ? book.categories.map((item: any) => String(item.categoryId ?? item.id))
        : [];

    const extractedCategoryId =
      book.categoryId ??
      (Array.isArray(book.categories) && book.categories.length > 0
        ? (book.categories[0].categoryId ?? book.categories[0].id)
        : "") ??
      (typeof book.category === "object"
        ? (book.category?.id ?? book.category?.categoryId)
        : book.category);

    // Bóc tách ID Nhà xuất bản an toàn
    const extractedPublisherId =
      book.publisherId ??
      (typeof book.publisher === "object" && book.publisher !== null
        ? (book.publisher.publisherId ?? book.publisher.id)
        : book.publisher);

    // Bóc tách danh sách ID Tác giả
    const extractedAuthorIds =
      Array.isArray(book.authorIds) && book.authorIds.length > 0
        ? book.authorIds.map((item: any) =>
            String(
              typeof item === "object" ? (item.authorId ?? item.id) : item,
            ),
          )
        : Array.isArray(book.authors) && book.authors.length > 0
          ? book.authors.map((item: any) => String(item.authorId ?? item.id))
          : [];

    setForm({
      title: book.title ?? "",
      isbn: book.isbn ?? "",
      price: book.price?.toString() ?? "",
      discountPercent: (book.discountPercent ?? 0).toString(),
      stock: (book.stockQuantity ?? book.stock ?? "").toString(),

      // Đọc linh hoạt năm xuất bản (phòng hờ backend đặt tên khác)
      publicationYear: (
        book.publicationYear ??
        book.publishYear ??
        ""
      ).toString(),

      categoryIds:
        extractedCategoryIds.length > 0
          ? extractedCategoryIds
          : extractedCategoryId
            ? [String(extractedCategoryId)]
            : [],
      publisherId: extractedPublisherId ? String(extractedPublisherId) : "",
      authorIds: extractedAuthorIds,

      // Đọc linh hoạt mô tả (phòng hờ backend đặt tên khác như desc, summary...)
      description: book.description ?? book.desc ?? book.summary ?? "",

      status: book.status ?? "ACTIVE",
      coverFile: null,
      // Ưu tiên đọc coverImage, nếu không có mới đọc cover
      previewUrl:
        (book.coverImage ?? book.cover)
          ? getBookCoverUrl(book.coverImage ?? book.cover)
          : null,
    });

    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const titleValue = form.title.trim();
    const selectedCategoryIds = form.categoryIds.filter(
      (value) => normalizeSelectedValue(value).trim() !== "",
    );
    const publisherValue = normalizeSelectedValue(form.publisherId);
    const publicationYearValue = normalizeSelectedValue(form.publicationYear);
    const stockValue = normalizeSelectedValue(form.stock);
    const priceValue = normalizeSelectedValue(form.price);
    const discountPercentValue = normalizeSelectedValue(form.discountPercent);
    const descriptionValue = form.description;
    const statusValue = form.status;
    const authorIdsValue = form.authorIds;

    const parsedCategoryIds = selectedCategoryIds.map((value) =>
      value && !Number.isNaN(Number(value)) ? Number(value) : value,
    );
    const parsedPublisherId =
      publisherValue && !Number.isNaN(Number(publisherValue))
        ? Number(publisherValue)
        : publisherValue;
    const parsedPublicationYear = Number(publicationYearValue);
    const parsedStock = Number(stockValue);
    const parsedPrice = Number(priceValue);

    if (!titleValue) {
      toast.error("Please enter a book title");
      return;
    }

    if (parsedCategoryIds.length === 0) {
      toast.error("Please select at least one category");
      return;
    }

    if (!publisherValue) {
      toast.error("Please select a publisher");
      return;
    }

    if (!publicationYearValue || Number.isNaN(parsedPublicationYear)) {
      toast.error("Please enter publication year");
      return;
    }

    const normalizedIsbn = form.isbn.trim() || undefined;
    const normalizedDescription = descriptionValue.trim() || undefined;
    const normalizedStatus = statusValue || "ACTIVE";
    const parsedDiscountPercent = Number(discountPercentValue);
    const normalizedPrice = Number.isNaN(parsedPrice) ? undefined : parsedPrice;
    const normalizedStock = Number.isNaN(parsedStock) ? undefined : parsedStock;
    const normalizedDiscountPercent =
      Number.isNaN(parsedDiscountPercent) || parsedDiscountPercent < 0
        ? undefined
        : Math.min(100, Math.max(0, parsedDiscountPercent));
    const normalizedCategoryIds =
      parsedCategoryIds.length > 0 ? parsedCategoryIds : undefined;
    const normalizedAuthorIds = authorIdsValue.filter(
      (value) => normalizeSelectedValue(value).trim() !== "",
    );
    const normalizedPublisherId = publisherValue
      ? parsedPublisherId
      : undefined;

    const payload: BookPayload = {
      title: titleValue,
      ...(normalizedIsbn ? { isbn: normalizedIsbn } : {}),
      ...(normalizedPrice !== undefined ? { price: normalizedPrice } : {}),
      ...(normalizedStock !== undefined
        ? {
            stock: normalizedStock,
            stockQuantity: normalizedStock,
            quantity: normalizedStock,
          }
        : {}),
      ...(normalizedCategoryIds
        ? {
            categoryId: normalizedCategoryIds[0],
            categoryIds: normalizedCategoryIds,
            categories: normalizedCategoryIds,
          }
        : {}),
      ...(normalizedPublisherId !== undefined
        ? {
            publisherId: normalizedPublisherId,
            publisherIds: [normalizedPublisherId],
          }
        : {}),
      ...(normalizedDiscountPercent !== undefined
        ? { discountPercent: normalizedDiscountPercent }
        : {}),
      ...(Number.isNaN(parsedPublicationYear)
        ? {}
        : {
            publicationYear: parsedPublicationYear,
            publishYear: parsedPublicationYear,
          }),
      ...(normalizedAuthorIds.length > 0
        ? {
            authorIds: normalizedAuthorIds,
            authors: normalizedAuthorIds,
          }
        : {}),
      ...(normalizedDescription
        ? { description: normalizedDescription, summary: normalizedDescription }
        : {}),
      ...(normalizedStatus ? { status: normalizedStatus } : {}),
    };

    try {
      let bookId: string | number | undefined;

      // Lấy đúng ID từ bookId hoặc id của editingBook
      const targetId = editingBook?.bookId ?? editingBook?.id;

      if (targetId) {
        await updateBook(targetId, payload);
        bookId = targetId;
        toast.success("Book updated successfully");
      } else {
        const response = await createBook(payload);
        bookId =
          response.data?.id ?? response.data?.data?.id ?? response.data?.bookId;
        toast.success("Book created successfully");
      }

      if (form.coverFile && bookId) {
        try {
          const coverImageBase64 = await fileToBase64(form.coverFile);

          // ❤️ Nâng cấp: Gửi kèm cả fileName cho Spring Boot khỏi bắt bẻ
          await uploadBookCover(bookId, {
            coverImage: coverImageBase64,
            fileName: form.coverFile.name, // Bổ sung tên file ở đây
          });
        } catch (coverError: any) {
          console.warn("Cover upload skipped or failed:", coverError);

          // ❤️ Nâng cấp: Lôi cổ thông báo lỗi từ Backend ra để dễ sửa
          const errorMsg =
            coverError?.response?.data?.message ||
            coverError?.response?.data?.error ||
            "Dữ liệu gửi lên không hợp lệ";

          toast.warning(`Sách đã lưu, nhưng lỗi up ảnh: ${errorMsg}`);
        }
      }

      await fetchBooks(page, search);
      resetForm();
    } catch (err) {
      const errorResponse = (err as { response?: { data?: unknown } })?.response
        ?.data;
      const backendMessage =
        typeof errorResponse === "string"
          ? errorResponse
          : errorResponse && typeof errorResponse === "object"
            ? ((
                errorResponse as {
                  message?: string;
                  error?: string;
                  detail?: string;
                }
              ).message ??
              (
                errorResponse as {
                  message?: string;
                  error?: string;
                  detail?: string;
                }
              ).error ??
              (
                errorResponse as {
                  message?: string;
                  error?: string;
                  detail?: string;
                }
              ).detail)
            : undefined;
      const message =
        backendMessage ||
        (err instanceof Error ? err.message : "Operation failed");
      toast.error(message);
    }
  };

  const handleCoverSelection = (file: File | null) => {
    if (!file) {
      setForm((prev) => ({ ...prev, coverFile: null, previewUrl: null }));
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, coverFile: file, previewUrl }));
  };

  const handleImageError = (key: string | number) => {
    setImageErrorMap((prev) => ({ ...prev, [key]: true }));
  };

  const handleDelete = async (id: string | number) => {
    if (!window.confirm("Delete this book?")) {
      return;
    }

    try {
      await deleteBook(id);
      toast.success("Book deleted successfully");
      await fetchBooks(page, search);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const pageNumbers = useMemo(() => {
    const total = Math.max(pageInfo.totalPages, 1);
    return Array.from({ length: total }, (_, index) => index + 1);
  }, [pageInfo.totalPages]);

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">
            Book Management
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Manage your inventory, prices, and stock status.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 justify-center transition-colors"
        >
          <Plus size={18} />
          Add New Book
        </button>
      </div>

      <div className="bg-surface border border-outline-variant rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            size={20}
          />
          <input
            type="text"
            className="w-full bg-background border border-outline-variant rounded-lg h-10 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            placeholder="Search by book title or ISBN"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-surface border border-outline-variant rounded-xl flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-225">
            <thead className="bg-surface-container-low border-b border-outline-variant">
              <tr>
                <th className="p-4 text-xs font-semibold tracking-wider text-on-surface-variant uppercase">
                  Book Title
                </th>
                <th className="p-4 text-xs font-semibold tracking-wider text-on-surface-variant uppercase">
                  Price
                </th>
                <th className="p-4 text-xs font-semibold tracking-wider text-on-surface-variant uppercase">
                  Discount
                </th>
                <th className="p-4 text-xs font-semibold tracking-wider text-on-surface-variant uppercase">
                  Stock
                </th>
                <th className="p-4 text-xs font-semibold tracking-wider text-on-surface-variant uppercase">
                  Sold
                </th>
                <th className="p-4 text-xs font-semibold tracking-wider text-on-surface-variant uppercase">
                  Category
                </th>
                <th className="p-4 text-xs font-semibold tracking-wider text-on-surface-variant uppercase">
                  Status
                </th>
                <th className="p-4 text-xs font-semibold tracking-wider text-on-surface-variant uppercase text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="p-6 text-center text-sm text-on-surface-variant"
                  >
                    Loading...
                  </td>
                </tr>
              ) : books.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="p-6 text-center text-sm text-on-surface-variant"
                  >
                    No books found.
                  </td>
                </tr>
              ) : (
                books.map((book, index) => (
                  <tr
                    key={getStableKey(book.id, "book", index)}
                    className="hover:bg-background transition-colors group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-14 bg-surface-container rounded overflow-hidden shrink-0 border border-outline-variant">
                          <img
                            src={
                              imageErrorMap[book.id ?? index]
                                ? FALLBACK_IMAGE
                                : getBookCoverUrl(book.coverImage ?? book.cover) // Thêm book.coverImage vào đây
                            }
                            alt={book.title}
                            className="w-full h-full object-cover"
                            onError={() => handleImageError(book.id ?? index)}
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-on-surface">
                            {book.title}
                          </span>
                          <span className="text-xs text-on-surface-variant">
                            {book.isbn}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-medium text-on-surface">
                      {formatPriceVnd(book.price)}
                    </td>
                    <td className="p-4 text-sm">
                      {book.discountPercent &&
                      Number(book.discountPercent) > 0 ? (
                        <span className="inline-flex items-center rounded-full bg-error/10 text-error px-3 py-1 text-xs font-semibold">
                          -{Number(book.discountPercent)}%
                        </span>
                      ) : (
                        <span className="text-on-surface-variant text-xs">
                          No discount
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm font-medium text-on-surface">
                      {book.stockQuantity ?? book.stock ?? 0}
                    </td>
                    <td className="p-4 text-sm font-medium text-on-surface">
                      {getBookSoldValue(book)}
                    </td>
                    <td className="p-4 text-sm text-on-surface">
                      {Array.isArray(book.categories) &&
                      book.categories.length > 0
                        ? book.categories.map((c) => c.name).join(", ")
                        : "Chưa phân loại"}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${
                          book.status === "ACTIVE"
                            ? "bg-secondary-container/30 text-secondary border-secondary-container"
                            : book.status === "OUT_OF_STOCK"
                              ? "bg-error-container/30 text-error border-error-container"
                              : "bg-surface-variant text-on-surface-variant border-outline-variant/30"
                        }`}
                      >
                        {book.status ?? "ACTIVE"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(book)}
                          className="p-1 text-on-surface-variant hover:text-primary transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(book.bookId ?? book.id)}
                          className="p-1 text-on-surface-variant hover:text-error transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-outline-variant bg-background flex items-center justify-between mt-auto">
          <span className="text-sm text-on-surface-variant">
            Showing {books.length} entries
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => fetchBooks(Math.max(0, page - 1), search)}
              disabled={page <= 0}
              className="p-2 border border-outline-variant rounded-lg text-on-surface hover:bg-surface-variant disabled:opacity-50"
            >
              &lt;
            </button>
            {pageNumbers.map((number) => (
              <button
                key={number}
                onClick={() => fetchBooks(number - 1, search)}
                className={`w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center ${page + 1 === number ? "bg-primary text-white" : "border border-outline-variant text-on-surface hover:bg-surface-variant"}`}
              >
                {number}
              </button>
            ))}
            <button
              onClick={() =>
                fetchBooks(Math.min(pageInfo.totalPages - 1, page + 1), search)
              }
              disabled={page >= pageInfo.totalPages - 1}
              className="p-2 border border-outline-variant rounded-lg text-on-surface hover:bg-surface-variant disabled:opacity-50"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-surface p-6 shadow-xl border border-outline-variant max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-on-surface">
                {editingBook ? "Edit" : "Add"} Book
              </h3>
              <button
                onClick={resetForm}
                className="p-1 rounded hover:bg-surface-variant"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Title
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  ISBN
                </label>
                <input
                  value={form.isbn}
                  onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                  className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={form.discountPercent}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numeric = Number(value);
                    if (
                      value === "" ||
                      (!Number.isNaN(numeric) && numeric >= 0 && numeric <= 100)
                    ) {
                      setForm({ ...form, discountPercent: value });
                    }
                  }}
                  className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Stock
                </label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Categories
                </label>
                <select
                  multiple
                  value={form.categoryIds}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      categoryIds: Array.from(
                        e.target.selectedOptions,
                        (option) => option.value,
                      ),
                    })
                  }
                  className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm min-h-24"
                  required
                >
                  {categories.map((item, index) => (
                    <option
                      key={getStableKey(item.id, "category", index)}
                      value={String(item.id)}
                    >
                      {item.name ?? item.title}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Hold Ctrl/Cmd to select multiple categories.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Publisher
                </label>
                <select
                  value={form.publisherId}
                  onChange={(e) =>
                    setForm({ ...form, publisherId: e.target.value })
                  }
                  className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select publisher</option>
                  {publishers.map((item, index) => (
                    <option
                      key={getStableKey(item.id, "publisher", index)}
                      value={String(item.id)}
                    >
                      {item.name ?? item.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Publication Year
                </label>
                <input
                  type="number"
                  min="1900"
                  max="2100"
                  value={form.publicationYear}
                  onChange={(e) =>
                    setForm({ ...form, publicationYear: e.target.value })
                  }
                  className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Authors
                </label>
                <select
                  multiple
                  value={form.authorIds}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      authorIds: Array.from(
                        e.target.selectedOptions,
                        (option) => option.value,
                      ),
                    })
                  }
                  className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm min-h-24"
                >
                  {authors.map((item, index) => (
                    <option
                      key={getStableKey(item.id, "author", index)}
                      value={String(item.id)}
                    >
                      {item.name ?? item.title}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Hold Ctrl/Cmd to select multiple authors.
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                  <option value="DISCONTINUED">Discontinued</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Cover Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleCoverSelection(e.target.files?.[0] ?? null)
                  }
                  className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                />
                {form.previewUrl ? (
                  <div className="mt-3 flex items-center justify-center rounded border border-outline-variant bg-background p-3">
                    <img
                      src={form.previewUrl}
                      alt="Cover preview"
                      className="max-h-40 w-full max-w-45 rounded object-cover"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  </div>
                ) : null}
              </div>
              <div className="md:col-span-2 flex justify-end gap-2">
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
