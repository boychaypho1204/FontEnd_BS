import { useEffect, useState } from "react";
import { Sparkles, ThumbsUp, Trophy } from "lucide-react";
import BookCard from "../components/ui/BookCard";
import { getBooks } from "../services/bookService";
import type { Book } from "../types";

const tabs = [
  { id: "1", label: "Manga/Comic" },
  { id: "2", label: "Tiểu Thuyết" },
  { id: "3", label: "Kỹ Năng" },
];

const extractBookArray = (response: unknown) => {
  const responseData = (response as any)?.data ?? response;

  if (Array.isArray(responseData)) return responseData;

  return (
    (responseData?.data as Book[]) ??
    responseData?.content ??
    responseData?.items ??
    responseData?.records ??
    responseData?.books ??
    []
  );
};

export default function TopTrending() {
  const [books, setBooks] = useState<Book[]>([]);
  const [categoryBooks, setCategoryBooks] = useState<Book[]>([]);
  const [recommendedBooks, setRecommendedBooks] = useState<Book[]>([]);
  const [activeTab, setActiveTab] = useState("1");
  const [isLoading, setIsLoading] = useState(true);

  const loadTopTrendingAndRecommended = async () => {
    setIsLoading(true);
    try {
      const [topResponse, recommendedResponse] = await Promise.all([
        // BÍ KÍP: Tăng size lên 5 để lấp đầy 5 cột trên màn hình rộng
        getBooks({ sort: "sold,desc", size: 5 }),
        getBooks({ sort: "id,desc", size: 5 }),
      ]);

      const topPayload = extractBookArray(topResponse);
      const recommendedPayload = extractBookArray(recommendedResponse);
      const normalizedTopBooks = Array.isArray(topPayload) ? topPayload : [];
      const normalizedRecommendedBooks = Array.isArray(recommendedPayload)
        ? recommendedPayload
        : [];

      // BÍ KÍP: Cắt lấy 5 cuốn thay vì 4
      setBooks(normalizedTopBooks.slice(0, 5));
      setRecommendedBooks(normalizedRecommendedBooks);
    } catch (error) {
      console.error("Failed to load top trending or recommended books", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTopTrendingAndRecommended();
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      void loadTopTrendingAndRecommended();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void loadTopTrendingAndRecommended();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const loadCategoryBooks = async () => {
      try {
        const response = await getBooks({
          categoryId: activeTab,
          sort: "sold,desc",
          // BÍ KÍP: Tăng size lên 5
          size: 5,
        });

        const payload = extractBookArray(response);
        setCategoryBooks(Array.isArray(payload) ? payload : []);
      } catch (error) {
        console.error("Failed to load category books", error);
      }
    };

    void loadCategoryBooks();
  }, [activeTab]);

  const getBadgeClass = (index: number) => {
    if (index === 0) return "bg-[#FFD700] text-black";
    if (index === 1) return "bg-[#C0C0C0] text-black";
    if (index === 2) return "bg-[#CD7F32] text-white";
    return "bg-surface-container-high text-on-surface";
  };

  return (
    // BÍ KÍP: Đổi max-w-[1280px] thành max-w-[1536px] w-full và đồng bộ padding
    <div className="max-w-[1536px] w-full mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-12">
      <div className="max-w-3xl">
        <div className="customer-gold inline-flex items-center gap-3 mb-3 text-sm uppercase tracking-widest font-semibold">
          <Trophy className="w-5 h-5" />
          BẢNG VÀNG
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary">
          Top Sách Bán Chạy Nhất
        </h1>
        <p className="mt-4 text-sm text-on-surface-variant max-w-2xl leading-7">
          Khám phá những tựa sách được độc giả yêu thích nhất hiện nay. Danh
          sách được xếp hạng theo số lượng bán ra, giúp bạn nhanh chóng tìm thấy
          những cuốn sách phổ biến nhất.
        </p>
      </div>

      <div className="mt-8">
        {isLoading ? (
          // BÍ KÍP: Thêm xl:grid-cols-5
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
            {/* Tạo 5 khung loading cho khớp số lượng mới */}
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-96 rounded-3xl bg-surface-container-high animate-pulse"
              />
            ))}
          </div>
        ) : books.length > 0 ? (
          // BÍ KÍP: Thêm xl:grid-cols-5
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 mt-8">
            {books.map((book, index) => (
              <div
                key={book.id ?? book.bookId ?? `top-trending-${index}`}
                className="relative"
              >
                <div
                  className={`absolute top-3 left-3 z-10 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${getBadgeClass(
                    index,
                  )}`}
                >
                  Rank {index + 1}
                </div>
                <BookCard book={book} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-10 text-center text-on-surface-variant">
            Không có sách nào trong bảng xếp hạng hiện tại.
          </div>
        )}
      </div>

      <section className="mt-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-serif font-bold text-primary">
              BXH Theo Thể Loại
            </h2>
          </div>

          <div className="flex flex-wrap gap-2 rounded-xl border border-outline-variant bg-surface p-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-primary text-on-primary shadow-md"
                      : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* BÍ KÍP: Thêm xl:grid-cols-5 */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 mt-8">
          {categoryBooks.length > 0 ? (
            categoryBooks.map((book, index) => (
              <BookCard
                key={book.id ?? book.bookId ?? `category-book-${index}`}
                book={book}
              />
            ))
          ) : (
            <div className="col-span-full rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-10 text-center text-on-surface-variant">
              Đang cập nhật sách theo thể loại.
            </div>
          )}
        </div>
      </section>

      <section className="mt-16">
        <div className="flex items-center gap-3">
          <ThumbsUp className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-serif font-bold text-primary">
            Có Thể Bạn Sẽ Thích
          </h2>
        </div>

        {/* BÍ KÍP: Thêm xl:grid-cols-5 */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 mt-8">
          {recommendedBooks.length > 0 ? (
            recommendedBooks.map((book, index) => (
              <BookCard
                key={book.id ?? book.bookId ?? `recommended-book-${index}`}
                book={book}
              />
            ))
          ) : (
            <div className="col-span-full rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-10 text-center text-on-surface-variant">
              Đang cập nhật sách gợi ý.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
