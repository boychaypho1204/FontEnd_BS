import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Filter, ChevronDown, Check, Search } from "lucide-react";
import BookCard from "../components/ui/BookCard";
import {
  getAuthors,
  getBooks,
  getCategories,
  getPublishers,
} from "../services/bookService";
import type { Author, Category, Publisher } from "../services/bookService";
import type { Book } from "../types";
import { resolveAssetUrl } from "../lib/utils";

const sortOptions = [
  "Mới nhất",
  "Bán chạy nhất",
  "Giá từ thấp đến cao",
  "Giá từ cao đến thấp",
];

// BÍ KÍP: Sửa thành 15 để chia hết cho 5 (Mỗi trang có 3 dòng vuông vức, không bị lẻ sản phẩm)
const PAGE_SIZE = 15;

const getSafeArray = (payload: unknown) => {
  if (Array.isArray(payload)) return payload;

  const wrappedPayload = payload as Record<string, unknown> | undefined;
  const extractedPayload =
    wrappedPayload?.data ??
    wrappedPayload?.content ??
    wrappedPayload?.result ??
    wrappedPayload?.items ??
    wrappedPayload?.records ??
    payload;

  return Array.isArray(extractedPayload) ? extractedPayload : [];
};

const normalizeResponseData = (res: any) => {
  const responseData = res?.data as any;
  return (
    responseData?.data ??
    responseData?.content ??
    responseData?.result ??
    responseData?.items ??
    responseData?.records ??
    responseData
  );
};

const mapSortOptionToBackend = (option: string) => {
  switch (option) {
    case "Mới nhất":
      return "id,desc";
    case "Bán chạy nhất":
      return "sold,desc";
    case "Giá từ thấp đến cao":
      return "price,asc";
    case "Giá từ cao đến thấp":
      return "price,desc";
    default:
      return "id,desc";
  }
};

const getFilterParamValues = (params: URLSearchParams, keys: string[]) => {
  for (const key of keys) {
    const values = params.getAll(key);
    if (values.length) {
      return values;
    }
  }

  return [];
};

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOption, setSortOption] = useState("");
  const [sortOpen, setSortOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") ?? "",
  );

  const selectedCategories = useMemo(
    () => getFilterParamValues(searchParams, ["category"]),
    [searchParams],
  );
  const selectedCategoryIds = useMemo(
    () => getFilterParamValues(searchParams, ["categoryIds", "categoryId"]),
    [searchParams],
  );
  const selectedAuthors = useMemo(
    () => getFilterParamValues(searchParams, ["author"]),
    [searchParams],
  );
  const selectedAuthorIds = useMemo(
    () => getFilterParamValues(searchParams, ["authorIds", "authorId"]),
    [searchParams],
  );
  const selectedPublishers = useMemo(
    () => getFilterParamValues(searchParams, ["publisher"]),
    [searchParams],
  );
  const selectedPublisherIds = useMemo(
    () => getFilterParamValues(searchParams, ["publisherIds", "publisherId"]),
    [searchParams],
  );
  const page = Number(searchParams.get("page") ?? "0");
  const currentPage = Number.isNaN(page) || page < 0 ? 0 : page;

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);

    const nextParams = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      nextParams.set("search", value.trim());
    } else {
      nextParams.delete("search");
    }
    nextParams.set("page", "0");
    setSearchParams(nextParams);
  };

  const updateParams = (key: string, value: string, checked: boolean) => {
    const aliases = {
      categoryIds: ["categoryIds", "categoryId"],
      authorIds: ["authorIds", "authorId"],
      publisherIds: ["publisherIds", "publisherId"],
    } as const;

    const keysToClear = aliases[key as keyof typeof aliases] ?? [key];
    const currentValues = searchParams.getAll(key);
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter((item) => item !== value);

    const nextParams = new URLSearchParams(searchParams.toString());
    keysToClear.forEach((paramKey) => nextParams.delete(paramKey));
    newValues.forEach((val) => nextParams.append(key, val));
    nextParams.set("page", "0");
    setSearchParams(nextParams);
  };

  const handleSortChange = (option: string) => {
    setSortOption(option);
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("sort", mapSortOptionToBackend(option));
    setSearchParams(nextParams);
    setSortOpen(false);
  };

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [categoryRes, authorRes, publisherRes] = await Promise.all([
          getCategories({ size: 1000 }),
          getAuthors({ size: 1000 }),
          getPublishers({ size: 1000 }),
        ]);

        const categoryResAny = categoryRes as any;
        const authorResAny = authorRes as any;
        const publisherResAny = publisherRes as any;

        const categoriesData = normalizeResponseData(categoryResAny);
        const authorsData = normalizeResponseData(authorResAny);
        const publishersData = normalizeResponseData(publisherResAny);

        const categoryPayload = getSafeArray(categoriesData);
        const authorPayload = getSafeArray(authorsData);
        const publisherPayload = getSafeArray(publishersData);

        const normalizedCategories = (categoryPayload as Category[]).map(
          (category, index) => ({
            ...category,
            id: String(
              category.id ?? category.categoryId ?? `category-${index}`,
            ),
            name: category.name || `Thể loại ${index + 1}`,
          }),
        );

        const normalizedAuthors = (authorPayload as Author[]).map(
          (author, index) => ({
            ...author,
            id: String(author.id ?? author.authorId ?? `author-${index}`),
            name: author.name || `Tác giả ${index + 1}`,
          }),
        );

        const normalizedPublishers = (publisherPayload as Publisher[]).map(
          (publisher, index) => ({
            ...publisher,
            id: String(
              publisher.id ?? publisher.publisherId ?? `publisher-${index}`,
            ),
            name: publisher.name || `Nhà xuất bản ${index + 1}`,
          }),
        );

        setCategories(normalizedCategories);
        setAuthors(normalizedAuthors);
        setPublishers(normalizedPublishers);
      } catch (error) {
        console.error("Failed to load filter data", error);
      }
    };

    loadFilters();
  }, []);

  useEffect(() => {
    const urlSearchTerm = searchParams.get("search") ?? "";
    if (urlSearchTerm !== searchTerm) {
      setSearchTerm(urlSearchTerm);
    }
  }, [searchParams]);

  const filteredBooks = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    const categoryNamesFromIds = selectedCategoryIds
      .map((id) =>
        categories.find(
          (category) => String(category.id ?? category.categoryId) === id,
        )?.name,
      )
      .filter((name): name is string => Boolean(name))
      .map((name) => name.toLowerCase());
    const authorNamesFromIds = selectedAuthorIds
      .map((id) =>
        authors.find(
          (author) => String(author.id ?? author.authorId) === id,
        )?.name,
      )
      .filter((name): name is string => Boolean(name))
      .map((name) => name.toLowerCase());
    const publisherNamesFromIds = selectedPublisherIds
      .map((id) =>
        publishers.find(
          (publisher) => String(publisher.id ?? publisher.publisherId) === id,
        )?.name,
      )
      .filter((name): name is string => Boolean(name))
      .map((name) => name.toLowerCase());
    const categoryNamesToMatch = [
      ...selectedCategories.map((name) => name.toLowerCase()),
      ...categoryNamesFromIds,
    ];

    return books.filter((book) => {
      const extendedBook = book as Book & {
        authorId?: string | number;
        authorIds?: Array<string | number>;
        publisherId?: string | number;
      };
      const bookCategoryIds = [
        book.categoryId,
        ...(book.categories?.flatMap((category) => [
          category.id,
          (category as { categoryId?: string | number }).categoryId,
        ]) ?? []),
      ]
        .filter((id) => id !== undefined && id !== null)
        .map(String);
      const bookCategoryNames = [
        book.category,
        ...(book.categories?.map((category) => category.name) ?? []),
      ]
        .filter((name): name is string => Boolean(name))
        .map((name) => name.toLowerCase());
      const matchesCategory =
        categoryNamesToMatch.length === 0 &&
        selectedCategoryIds.length === 0
          ? true
          : selectedCategoryIds.some((id) => bookCategoryIds.includes(id)) ||
            categoryNamesToMatch.some((name) =>
              bookCategoryNames.includes(name),
            );

      const bookAuthorIds = [
        extendedBook.authorId,
        ...(extendedBook.authorIds ?? []),
        ...(book.authors?.flatMap((author) => [
          author.id,
          (author as { authorId?: string | number }).authorId,
        ]) ?? []),
      ]
        .filter((id) => id !== undefined && id !== null)
        .map(String);
      const bookAuthorNames = [
        book.author,
        ...(book.authors?.map((author) => author.name) ?? []),
      ]
        .filter((name): name is string => Boolean(name))
        .map((name) => name.toLowerCase());
      const authorNamesToMatch = [
        ...selectedAuthors.map((name) => name.toLowerCase()),
        ...authorNamesFromIds,
      ];
      const matchesAuthor =
        selectedAuthorIds.length === 0 && authorNamesToMatch.length === 0
          ? true
          : selectedAuthorIds.some((id) => bookAuthorIds.includes(id)) ||
            authorNamesToMatch.some((name) => bookAuthorNames.includes(name));

      const publisher = book.publisher;
      const publisherData =
        publisher && typeof publisher === "object"
          ? (publisher as {
              id?: string | number;
              publisherId?: string | number;
              name?: string;
            })
          : undefined;
      const bookPublisherIds = [
        extendedBook.publisherId,
        publisherData?.id,
        publisherData?.publisherId,
      ]
        .filter((id) => id !== undefined && id !== null)
        .map(String);
      const bookPublisherNames = [
        typeof publisher === "string" ? publisher : publisherData?.name,
      ]
        .filter((name): name is string => Boolean(name))
        .map((name) => name.toLowerCase());
      const publisherNamesToMatch = [
        ...selectedPublishers.map((name) => name.toLowerCase()),
        ...publisherNamesFromIds,
      ];
      const matchesPublisher =
        selectedPublisherIds.length === 0 &&
        publisherNamesToMatch.length === 0
          ? true
          : selectedPublisherIds.some((id) => bookPublisherIds.includes(id)) ||
            publisherNamesToMatch.some((name) =>
              bookPublisherNames.includes(name),
            );

      if (!matchesCategory || !matchesAuthor || !matchesPublisher) {
        return false;
      }

      if (!keyword) return true;

      const title = book.title?.toLowerCase() ?? "";
      const authorNames = bookAuthorNames.join(" ");
      const categoryNames = bookCategoryNames.join(" ");
      return (
        title.includes(keyword) ||
        authorNames.includes(keyword) ||
        categoryNames.includes(keyword)
      );
    });
  }, [
    authors,
    books,
    categories,
    publishers,
    searchTerm,
    selectedAuthors,
    selectedAuthorIds,
    selectedCategories,
    selectedCategoryIds,
    selectedPublisherIds,
    selectedPublishers,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages - 1);
  const pagedBooks = useMemo(() => {
    const start = safePage * PAGE_SIZE;
    return filteredBooks.slice(start, start + PAGE_SIZE);
  }, [filteredBooks, safePage]);

  const handlePageChange = (nextPage: number) => {
    const clampedPage = Math.max(0, Math.min(nextPage, totalPages - 1));
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("page", String(clampedPage));
    setSearchParams(nextParams);
  };

  useEffect(() => {
    const loadBooks = async () => {
      setIsLoading(true);
      try {
        const params: Record<string, string | string[]> = {
          page: "0",
          size: "200",
        };

        if (selectedCategoryIds.length) {
          params.categoryId = selectedCategoryIds;
        }
        if (selectedAuthorIds.length) {
          params.authorId = selectedAuthorIds;
        }
        if (selectedPublisherIds.length) {
          params.publisherId = selectedPublisherIds;
        }
        if (sortOption) params.sort = mapSortOptionToBackend(sortOption);

        const bookRes = await getBooks(params);
        const responseData = normalizeResponseData(bookRes as any);
        const bookPayload = getSafeArray(responseData);
        setBooks(Array.isArray(bookPayload) ? (bookPayload as Book[]) : []);
      } catch (error) {
        console.error("Failed to fetch books", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBooks();
  }, [
    selectedCategoryIds,
    selectedAuthorIds,
    selectedPublisherIds,
    sortOption,
  ]);

  return (
    // BÍ KÍP: Đổi max-w-[1280px] thành max-w-[1536px] (Chuẩn màn hình to), giúp 2 bên nở rộng ra, bộ lọc lùi sâu vào mép trái
    <div className="max-w-[1536px] w-full mx-auto px-4 md:px-8 lg:px-12 pt-4 md:pt-6 pb-8 md:pb-12 flex flex-col md:flex-row gap-8 lg:gap-12">
      <aside className="w-full md:w-56 lg:w-64 shrink-0">
        <div className="md:sticky md:top-36 lg:top-24 space-y-10 rounded-xl border border-outline-variant bg-surface p-4 shadow-sm">
          <section>
            <div className="mb-6 flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              <h2 className="font-serif text-xl font-bold text-primary">Lọc</h2>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-semibold mb-3 text-on-surface">
                Danh mục
              </h3>
              <div className="filter-scrollbar space-y-2 max-h-60 overflow-y-auto pr-2">
                {categories.map((category) => {
                  const categoryId = String(category.id ?? category.categoryId);
                  const isChecked = selectedCategoryIds.includes(categoryId);
                  return (
                    <label
                      key={`category-${categoryId}`}
                      className="flex items-center gap-3 text-sm text-on-surface cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(event) =>
                          updateParams(
                            "categoryIds",
                            categoryId,
                            event.target.checked,
                          )
                        }
                        className="w-4 h-4 rounded border-outline text-primary focus:ring-primary"
                      />
                      <span className="truncate">{category.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-semibold mb-3 text-on-surface">
                Tác giả
              </h3>
              <div className="filter-scrollbar space-y-2 max-h-60 overflow-y-auto pr-2">
                {authors.map((author, index) => {
                  const authorId = String(
                    author.id ?? author.authorId ?? `author-${index}`,
                  );
                  const isChecked = selectedAuthorIds.includes(authorId);
                  return (
                    <label
                      key={authorId}
                      className="flex items-center gap-3 text-sm text-on-surface"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(event) =>
                          updateParams(
                            "authorIds",
                            authorId,
                            event.target.checked,
                          )
                        }
                        className="w-4 h-4 rounded border-outline text-primary focus:ring-primary"
                      />
                      {author.name}
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3 text-on-surface">
                Nhà xuất bản
              </h3>
              <div className="filter-scrollbar space-y-2 max-h-60 overflow-y-auto pr-2">
                {publishers.map((publisher, index) => {
                  const publisherId = String(
                    publisher.id ??
                      publisher.publisherId ??
                      `publisher-${index}`,
                  );
                  const isChecked = selectedPublisherIds.includes(publisherId);
                  return (
                    <label
                      key={publisherId}
                      className="flex items-center gap-3 text-sm text-on-surface"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(event) =>
                          updateParams(
                            "publisherIds",
                            publisherId,
                            event.target.checked,
                          )
                        }
                        className="w-4 h-4 rounded border-outline text-primary focus:ring-primary"
                      />
                      {publisher.name}
                    </label>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </aside>

      <div className="grow min-w-0">
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-bold text-primary">
            Khám phá sách
          </h1>
          <p className="mb-3 text-sm text-on-surface-variant">
            {isLoading
              ? "Đang tải kết quả..."
              : `${filteredBooks.length.toLocaleString("vi-VN")} cuốn sách`}
          </p>

          <div className="flex w-full min-w-0 items-center gap-3">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Tìm kiếm và lọc theo danh mục, tác giả, nhà xuất bản."
                className="h-12 w-full rounded-xl border border-outline-variant/70 bg-surface-container-lowest px-10 text-sm text-on-surface shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="relative shrink-0">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="flex h-12 items-center gap-2 whitespace-nowrap rounded-lg border border-outline-variant/50 px-3 sm:px-4 text-sm font-medium hover:bg-surface-container transition-colors"
              >
                Sắp xếp: {sortOption || "Tất cả"}
                <ChevronDown className="w-4 h-4 text-on-surface-variant" />
              </button>

              {sortOpen && (
                <div className="absolute right-0 top-full z-20 mt-2 w-56 max-w-[calc(100vw-32px)] overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-lg">
                  <ul className="py-1">
                    {sortOptions.map((option, index) => (
                      <li key={`sort-${option}-${index}`}>
                        <button
                          type="button"
                          onClick={() => handleSortChange(option)}
                          className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-surface-container transition-colors ${
                            sortOption === option
                              ? "text-primary font-semibold"
                              : "text-on-surface"
                          }`}
                        >
                          {option}
                          {sortOption === option && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          // BÍ KÍP: Cập nhật lưới Grid thêm xl:grid-cols-5
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
            {/* Tăng thẻ loading giả lên 15 cho khớp số lượng */}
            {Array.from({ length: 15 }).map((_, index) => (
              <div
                key={index}
                className="h-96 rounded-3xl bg-surface-container-high animate-pulse"
              ></div>
            ))}
          </div>
        ) : pagedBooks.length > 0 ? (
          <>
            {/* BÍ KÍP: Cập nhật lưới Grid thêm xl:grid-cols-5 */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
              {pagedBooks.map((book, index) => (
                <BookCard
                  key={book.id ?? book.bookId ?? `book-${index}`}
                  book={book}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(safePage - 1)}
                  disabled={safePage === 0}
                  className="rounded-lg border border-outline-variant/60 px-3 py-2 text-sm font-medium text-on-surface disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Trước
                </button>

                {Array.from({ length: totalPages }, (_, index) => {
                  const isActive = index === safePage;
                  return (
                    <button
                      key={`page-${index}`}
                      type="button"
                      onClick={() => handlePageChange(index)}
                      className={`min-w-10 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary text-on-primary"
                          : "border border-outline-variant/60 text-on-surface hover:bg-surface-container"
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => handlePageChange(safePage + 1)}
                  disabled={safePage === totalPages - 1}
                  className="rounded-lg border border-outline-variant/60 px-3 py-2 text-sm font-medium text-on-surface disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
            <div className="text-on-surface-variant mb-2">
              Không tìm thấy sách phù hợp với bộ lọc hoặc từ khóa tìm kiếm.
            </div>
            <Link
              to="/products"
              className="text-primary font-semibold hover:underline"
            >
              Xóa bộ lọc và thử lại
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
