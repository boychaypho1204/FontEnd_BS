import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getWishlist, removeFromWishlist } from "../services/wishlistService";
import { Link } from "react-router-dom"; // Import thêm Link để bọc tiêu đề sách
import type { Book } from "../types";

const getCoverUrl = (image?: string) => {
  if (!image) {
    return "/images/placeholder-book.png";
  }

  return /^(https?:\/\/|\/\/)/.test(image)
    ? image
    : `http://localhost:8080/uploads/${image}`;
};

export default function Wishlist() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWishlist = async () => {
    setLoading(true);
    try {
      const response = await getWishlist();
      setBooks(response.data);
    } catch (error) {
      console.error("Failed to load wishlist", error);
      toast.error("Không thể tải danh sách yêu thích.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const handleRemove = async (bookId: string) => {
    try {
      await removeFromWishlist(bookId);
      const targetId = String(bookId);
      setBooks((current) =>
        current.filter((book) => String(book.bookId ?? book.id) !== targetId),
      );
      toast.success("Đã xóa khỏi danh sách yêu thích.");
    } catch (error) {
      console.error("Remove wishlist failed", error);
      toast.error("Xóa yêu thích thất bại.");
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-8 md:py-10">
      <div className="mb-8 flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Yêu thích
        </p>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary">
          Sách bạn đã lưu
        </h1>
        <p className="text-sm md:text-base text-on-surface-variant">
          Danh sách những cuốn sách bạn muốn đọc hoặc mua sau.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-32 rounded-[24px] bg-surface-container-high animate-pulse"
            />
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="rounded-[28px] border border-outline-variant/30 bg-surface-container-low px-8 py-14 text-center shadow-sm">
          <p className="text-lg font-semibold text-on-surface mb-2">
            Chưa có sách nào trong wishlist
          </p>
          <p className="text-sm text-on-surface-variant">
            Hãy thêm vài cuốn sách yêu thích để xem lại sau.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {books.map((book) => {
            const currentBookId = book.bookId ?? book.id;

            return (
              <div
                key={currentBookId}
                className="min-w-0 rounded-xl border border-outline-variant bg-surface p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex flex-col xl:flex-row gap-5">
                  <div className="relative w-full md:w-32 lg:w-36 shrink-0">
                    <Link to={`/products/${currentBookId}`}>
                      <img
                        src={getCoverUrl(
                          book.coverImage ?? (book as { cover?: string }).cover,
                        )}
                        alt={book.title}
                        className="h-48 md:h-44 w-full md:w-32 lg:w-36 object-contain rounded-xl bg-surface-container-low"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src =
                            "/images/placeholder-book.png";
                        }}
                      />
                    </Link>
                  </div>

                  <div className="min-w-0 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      {/* ❤️ HIỂN THỊ ĐẦY ĐỦ TẤT CẢ THỂ LOẠI (CATEGORY BADGES) */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                          Yêu thích
                        </span>

                        {book.categories && book.categories.length > 0 ? (
                          book.categories.map((cat: any, idx: number) => (
                            <span
                              key={cat?.categoryId ?? cat?.id ?? idx}
                              className="text-[10px] font-semibold text-primary uppercase tracking-wider bg-surface-container px-2 py-0.5 rounded border border-outline-variant/20"
                            >
                              {cat.name}
                            </span>
                          ))
                        ) : book.category ? (
                          <span className="text-[10px] font-semibold text-primary uppercase tracking-wider bg-surface-container px-2 py-0.5 rounded border border-outline-variant/20">
                            {book.category}
                          </span>
                        ) : null}
                      </div>

                      <Link to={`/products/${currentBookId}`}>
                        <h2 className="font-serif text-xl font-bold text-primary leading-snug hover:underline line-clamp-2">
                          {book.title}
                        </h2>
                      </Link>

                      <p className="mt-1 text-sm font-medium text-on-surface-variant truncate">
                        {book.authors
                          ?.map((author) => author.name)
                          .join(", ") ??
                          book.author ??
                          "Đang cập nhật"}
                      </p>

                      {/* ❤️ PHẦN MÔ TẢ ĐÃ ĐƯỢC CHUẨN HÓA (Hiển thị tối đa 3 dòng) */}
                      <p className="mt-2 text-sm text-on-surface-variant line-clamp-3">
                        {book.description || "Chưa có mô tả cho cuốn sách này."}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-lg font-bold text-primary">
                        {book.price?.toLocaleString("vi-VN")}đ
                      </span>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleRemove(String(currentBookId))}
                          className="rounded-xl border border-error/20 bg-error/5 px-4 py-2 text-sm font-semibold text-error transition hover:bg-error/10"
                        >
                          Xóa
                        </button>
                        <Link
                          to={`/products/${currentBookId}`}
                          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary-container"
                        >
                          Xem chi tiết
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
