import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Heart } from "lucide-react";
import { toast } from "react-toastify";
import { Book } from "../../types";
import { addToCart } from "../../services/cartService";
import { addToWishlist } from "../../services/wishlistService";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { cn } from "../../lib/utils";

interface BookCardProps {
  key?: React.Key;
  book: Book;
  className?: string;
}

export default function BookCard({ book, className }: BookCardProps) {
  const navigate = useNavigate();
  const { refreshCartCount } = useCart();
  const { isAuthenticated } = useAuth();
  const [showAllCategories, setShowAllCategories] = React.useState(false);

  const authorName =
    book.authors?.map((author) => author.name).join(", ") ?? book.author;

  const categoriesList =
    book.categories && book.categories.length > 0
      ? book.categories
      : book.category
        ? [{ name: book.category }]
        : [];
  const visibleCategories = showAllCategories
    ? categoriesList
    : categoriesList.slice(0, 2);
  const remainingCategoryCount = categoriesList.length - visibleCategories.length;

  const bookId = book.bookId ?? book.id;
  const discountPercent = Number(book.discountPercent ?? 0);
  const hasDiscount = discountPercent > 0 && discountPercent <= 100;
  const discountedPrice = hasDiscount
    ? Number(book.price) * (1 - discountPercent / 100)
    : Number(book.price);
  const ratingValue = Number(
    (book as { averageRating?: number }).averageRating ?? book.rating ?? 0,
  );
  const hasRating = Number.isFinite(ratingValue) && ratingValue > 0;

  const getCoverUrl = (image?: string) => {
    if (!image) {
      return "/images/placeholder-book.png";
    }
    return /^(https?:\/\/|\/\/)/.test(image)
      ? image
      : `http://localhost:8080/uploads/${image}`;
  };

  const coverUrl = getCoverUrl(
    book.coverImage ?? (book as { cover?: string }).cover,
  );

  const handleAddToCart = async (
    event?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event?.preventDefault();
    event?.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng!");
      navigate("/login");
      return;
    }

    try {
      await addToCart(bookId);
      toast.success("Đã thêm vào giỏ hàng.");
      await refreshCartCount();
    } catch (error) {
      console.error("Add to cart failed", error);
      toast.error("Thêm vào giỏ hàng thất bại.");
    }
  };

  const handleAddToWishlist = async (
    event?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event?.preventDefault();
    event?.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để thêm vào yêu thích!");
      navigate("/login");
      return;
    }

    try {
      await addToWishlist(bookId);
      toast.success("Đã thêm vào yêu thích.");
    } catch (error) {
      console.error("Add to wishlist failed", error);
      toast.error("Thêm vào yêu thích thất bại.");
    }
  };

  return (
    <div
      className={cn(
        "group flex min-w-0 flex-col h-full bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant shadow-[0_3px_14px_rgba(38,61,38,0.06)] hover:border-primary/40 hover:shadow-md transition-[border-color,box-shadow] duration-200",
        className,
      )}
    >
      <Link
        to={`/products/${book.bookId ?? book.id}`}
        className="relative block aspect-2/3 min-h-0 overflow-hidden bg-surface-container-low shrink-0"
      >
        {/* Reserve the same cover area and badge clearance, even before the image loads. */}
        <img
          src={coverUrl}
          alt={book.title}
          className="absolute inset-0 block w-full h-full max-w-full max-h-full object-cover object-center"
          loading="lazy"
          onError={({ currentTarget }) => {
            currentTarget.onerror = null;
            currentTarget.src = "/images/placeholder-book.png";
          }}
        />
        {(hasDiscount || book.badge) && (
          <div className="absolute top-2 left-2 bg-error text-on-error text-[9px] font-bold px-1.5 py-0.5 rounded-sm shadow-sm z-10">
            {hasDiscount ? `-${discountPercent}%` : book.badge}
          </div>
        )}
        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300 pointer-events-none"></div>
      </Link>

      {/* Phần nội dung: Ép flex-grow để lấp đầy chiều cao và phân chia không gian */}
      <div className="p-3 sm:p-4 md:p-5 flex min-w-0 flex-col grow justify-between">
        <div>
          <div
            className={cn(
              "mb-2 flex flex-wrap content-start items-start gap-1",
              showAllCategories ? "min-h-11" : "h-11 overflow-hidden",
            )}
          >
            {categoriesList.length > 0 ? (
              <>
                {visibleCategories.map((cat: any, index: number) => (
                  <span
                    key={cat.categoryId ?? cat.id ?? index}
                    className="h-fit rounded border border-outline-variant/20 bg-surface-container px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-on-surface-variant"
                  >
                    {cat.name}
                  </span>
                ))}
                {categoriesList.length > 2 && (
                  <button
                    type="button"
                    aria-expanded={showAllCategories}
                    aria-label={
                      showAllCategories
                        ? "Thu gọn thể loại"
                        : `Xem thêm ${remainingCategoryCount} thể loại`
                    }
                    onClick={() => setShowAllCategories(!showAllCategories)}
                    className="book-card-category-toggle h-fit rounded border border-outline-variant/30 px-1.5 py-0.5 text-[9px] font-medium leading-none text-on-surface-variant hover:bg-surface-container-high"
                  >
                    {showAllCategories
                      ? "Thu gọn"
                      : `+${remainingCategoryCount}`}
                  </button>
                )}
              </>
            ) : (
              <span className="text-xs font-medium text-primary uppercase tracking-wider">
                Khác
              </span>
            )}
          </div>

          {/* ❤️ 2. Cố định chiều cao Tiêu đề sách (luôn chiếm đúng không gian của 2 dòng) */}
          <Link
            to={`/products/${book.bookId ?? book.id}`}
            className="font-serif font-bold text-base md:text-lg text-on-surface line-clamp-2 h-14 leading-snug hover:text-primary transition-colors mb-1 block"
          >
            {book.title}
          </Link>

          {hasRating ? (
            <div className="flex items-center gap-1 text-sm mb-3">
              <div className="customer-gold flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <span key={`${bookId}-star-${index}`}>
                    {index < Math.round(ratingValue) ? "★" : "☆"}
                  </span>
                ))}
              </div>
              <span className="text-on-surface-variant">
                {ratingValue.toFixed(1)}
              </span>
            </div>
          ) : null}

          {/* ❤️ 3. Cố định chiều cao Tên tác giả (1 dòng, nếu dài quá sẽ tự cắt bớt bằng dấu ...) */}
          <div className="text-sm text-on-surface-variant truncate mb-4">
            {authorName || "Đang cập nhật"}
          </div>
        </div>

        {/* Phần giá tiền và nút bấm luôn được đẩy sát xuống đáy */}
        <div className="flex flex-nowrap items-center justify-between gap-2 pt-3 border-t border-outline-variant">
          <div className="min-w-0">
            <div className="whitespace-nowrap font-bold text-base md:text-xl text-primary leading-none">
              {discountedPrice.toLocaleString("vi-VN")}đ
            </div>
            {hasDiscount ? (
              <div className="text-sm text-on-surface-variant line-through mt-1">
                {book.price.toLocaleString("vi-VN")}đ
              </div>
            ) : (
              <div className="text-sm opacity-0 mt-1">0đ</div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={(event) => void handleAddToWishlist(event)}
              className="book-card-action h-8 w-8 shrink-0 rounded-full bg-surface text-primary border border-primary/40 flex items-center justify-center hover:bg-primary-fixed transition-colors duration-200"
              aria-label="Thêm vào yêu thích"
            >
              <Heart className="w-4 h-4" />
            </button>
            <button
              onClick={(event) => void handleAddToCart(event)}
              className="book-card-action h-8 w-8 shrink-0 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-primary-container transition-colors duration-200"
              aria-label="Thêm vào giỏ hàng"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
