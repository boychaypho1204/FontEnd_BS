import { useEffect, useState, type FormEvent } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Star,
  ShoppingCart,
  Truck,
  RefreshCw,
  ShieldCheck,
  Heart,
  Share2,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";
import { getBookById, getBooks } from "../services/bookService";
import { addToCart } from "../services/cartService";
import { addToWishlist } from "../services/wishlistService";
import BookCard from "../components/ui/BookCard";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import {
  createReview,
  getBookReviews,
  getBookReviewStats,
  type ReviewItem,
} from "../services/reviewService";
import { getUserAddresses, getUserProfile } from "../services/userService";
import type { Book } from "../types";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"desc" | "details" | "reviews">(
    "desc",
  );
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    totalReviews: 0,
  });
  const [productReviews, setProductReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutProfile, setCheckoutProfile] = useState<{
    fullName: string;
    email: string;
    phone: string;
  } | null>(null);
  const [checkoutAddresses, setCheckoutAddresses] = useState<any[]>([]);
  const [selectedCheckoutAddress, setSelectedCheckoutAddress] =
    useState<any>(null);

  const { isAuthenticated, user } = useAuth();
  const { refreshCartCount } = useCart();

  const getCoverUrl = (image?: string) => {
    if (!image) {
      return "/images/placeholder-book.png";
    }
    return /^(https?:\/\/|\/\/)/.test(image)
      ? image
      : `http://localhost:8080/uploads/${image}`;
  };

  const getAuthorName = (book: Book) =>
    book.authors?.map((author) => author.name).join(", ") ??
    book.author ??
    "Chưa xác định";

  // Lấy tên thể loại đầu tiên (dùng cho breadcrumb hoặc link phụ)
  const getCategoryName = (book: Book) =>
    book.categories?.[0]?.name ?? book.category ?? "Khác";

  const getCategoryId = (book: Book): string | number | undefined => {
    if (book.categories && book.categories.length > 0) {
      const firstCat = book.categories[0] as any;
      return firstCat?.id ?? firstCat?.categoryId;
    }
    return book.categoryId;
  };

  const getPublisherName = (book: Book) =>
    typeof book.publisher === "string"
      ? book.publisher
      : (book.publisher?.name ?? "Chưa cập nhật");

  const getBookId = (book: Book) => book.bookId ?? book.id;

  const getBookDiscountedPrice = (book: Book) => {
    const discountPercent = Number(book.discountPercent ?? 0);
    if (!Number.isFinite(discountPercent) || discountPercent <= 0) {
      return Number(book.price ?? 0);
    }
    return Number(book.price ?? 0) * (1 - discountPercent / 100);
  };

  const formatFullAddress = (address: any) => {
    const parts = [
      address?.detailAddress,
      address?.ward,
      address?.district,
      address?.province,
    ].filter((part) => Boolean(String(part ?? "").trim()));

    return parts.join(", ");
  };

  const handleBuyNow = async () => {
    if (!book) return;

    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để mua hàng!");
      navigate("/login");
      return;
    }

    setCheckoutLoading(true);
    try {
      const [profileResponse, addressResponse] = await Promise.all([
        getUserProfile(),
        getUserAddresses(),
      ]);

      const profile = profileResponse?.data ?? {};
      const fullName = profile.fullName?.trim() ?? "";
      const email = profile.email?.trim() ?? "";
      const phone = profile.phone?.trim() ?? "";
      const addresses = Array.isArray(addressResponse?.data)
        ? addressResponse.data
        : [];

      if (!fullName || !email || !phone || addresses.length === 0) {
        toast.info(
          "Bạn chưa có thông tin nhận hàng. Hãy cập nhật hồ sơ trước khi đặt hàng.",
        );
        navigate("/profile?from=product");
        return;
      }

      const defaultAddress =
        addresses.find((address: any) => Boolean(address?.isDefault)) ??
        addresses[0] ??
        null;

      setCheckoutProfile({ fullName, email, phone });
      setCheckoutAddresses(addresses);
      setSelectedCheckoutAddress(defaultAddress);
      setShowCheckoutModal(true);
    } catch (error) {
      console.error("Failed to load profile for buy now", error);
      toast.error("Không thể tải thông tin đặt hàng. Vui lòng thử lại.");
      navigate("/profile?from=product");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleConfirmCheckout = () => {
    if (!book || !checkoutProfile) return;

    const unitPrice = getBookDiscountedPrice(book);
    const checkoutItem = {
      id: getBookId(book),
      bookId: getBookId(book),
      book,
      quantity,
      price: Number(book.price ?? 0),
      unitPrice,
      totalPrice: unitPrice * quantity,
    };

    const addressValue =
      formatFullAddress(selectedCheckoutAddress) ||
      selectedCheckoutAddress?.detailAddress ||
      selectedCheckoutAddress?.address ||
      "";

    navigate("/checkout", {
      state: {
        profile: checkoutProfile,
        address: addressValue,
        addressId:
          selectedCheckoutAddress?.addressId ??
          selectedCheckoutAddress?.id ??
          null,
        shippingRecipient: {
          fullName:
            selectedCheckoutAddress?.receiverName?.trim() ||
            checkoutProfile.fullName,
          phone:
            selectedCheckoutAddress?.phone?.trim() || checkoutProfile.phone,
          address: addressValue,
        },
        items: [checkoutItem],
        subtotal: checkoutItem.totalPrice,
        discountAmount: 0,
        total: checkoutItem.totalPrice,
        voucher: null,
      },
    });

    setShowCheckoutModal(false);
  };

  const normalizeBooksPayload = (payload: unknown): Book[] => {
    if (Array.isArray(payload)) {
      return payload as Book[];
    }

    if (payload && typeof payload === "object") {
      const record = payload as Record<string, unknown>;
      const nested = record.data ?? record.content ?? record.items ?? [];

      if (Array.isArray(nested)) {
        return nested as Book[];
      }

      if (Array.isArray(record.books)) {
        return record.books as Book[];
      }
    }

    return [];
  };

  const loadReviewData = async (bookId: string | number) => {
    setLoadingReviews(true);
    try {
      const [statsResponse, reviewsResponse] = await Promise.all([
        getBookReviewStats(bookId),
        getBookReviews(bookId),
      ]);

      const stats = statsResponse.data ?? {};
      setReviewStats({
        averageRating: Number(stats.averageRating ?? 0) || 0,
        totalReviews: Number(stats.totalReviews ?? 0) || 0,
      });
      setProductReviews(
        Array.isArray(reviewsResponse.data) ? reviewsResponse.data : [],
      );
    } catch (error) {
      console.error("Failed to load review data", error);
      setReviewStats({ averageRating: 0, totalReviews: 0 });
      setProductReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    const loadBook = async () => {
      if (!id) return;
      setIsLoading(true);

      try {
        const response = await getBookById(id);
        const currentBookPayload = (response?.data ?? response) as
          | Record<string, unknown>
          | Book;
        const currentBook =
          (currentBookPayload as Record<string, unknown>).data ??
          currentBookPayload;
        setBook(currentBook as Book);

        const bookId = getBookId(currentBook as Book as Book);
        if (bookId !== undefined && bookId !== null && bookId !== "") {
          await loadReviewData(bookId);
        }

        const catId = getCategoryId(currentBook as Book);
        if (catId !== undefined && catId !== null && catId !== "") {
          const numericCategoryId = Number(catId);
          if (!isNaN(numericCategoryId)) {
            const relatedResponse = await getBooks({
              categoryId: numericCategoryId,
              size: 4,
            });
            const relatedItems = normalizeBooksPayload(
              relatedResponse?.data ?? relatedResponse,
            );
            setRelatedBooks(
              relatedItems.filter(
                (item) =>
                  item?.id !== (currentBook as Book).id &&
                  item?.bookId !== (currentBook as Book).bookId,
              ),
            );
          }
        }
      } catch (error) {
        console.error("Failed to load book detail", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBook();
  }, [id]);

  const handleReviewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const token = localStorage.getItem("token");
    if (!token || !user) {
      toast.error("Vui lòng đăng nhập để gửi đánh giá.");
      navigate("/login");
      return;
    }

    if (!book) return;

    setSubmittingReview(true);
    try {
      await createReview({
        bookId: getBookId(book),
        rating: reviewRating,
        comment: reviewText.trim(),
      });
      toast.success("Đánh giá của bạn đã được gửi.");
      setReviewText("");
      setReviewRating(5);
      await loadReviewData(getBookId(book));
      setActiveTab("reviews");
    } catch (error) {
      console.error("Review submission failed", error);
      toast.error("Gửi đánh giá thất bại, vui lòng thử lại.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStarSelector = (
    selectedRating: number,
    onSelect: (value: number) => void,
  ) => (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const value = index + 1;
        const isActive = value <= selectedRating;

        return (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            className="rounded-lg p-2 transition-colors hover:bg-surface-container"
            aria-label={`Đánh giá ${value} sao`}
          >
            <Star
              className={`h-5 w-5 ${isActive ? "fill-[#A88445] text-[#765A2A]" : "text-outline"}`}
            />
          </button>
        );
      })}
    </div>
  );

  const renderStarDisplay = (value: number) => {
    const safeValue = Number.isFinite(value) ? value : 0;
    const normalizedValue = Math.max(0, Math.min(5, safeValue));

    return (
      <div className="customer-gold flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className="h-4 w-4"
            fill={index < Math.round(normalizedValue) ? "currentColor" : "none"}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
        <div className="h-24 w-24 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="font-serif text-3xl font-bold text-primary mb-4">
          Không tìm thấy sách
        </h2>
        <p className="text-on-surface-variant mb-6">
          Rất tiếc, cuốn sách bạn đang tìm kiếm không tồn tại hoặc đã bị gỡ.
        </p>
        <Link
          to="/products"
          className="px-6 py-3 bg-primary text-on-primary rounded-full font-bold hover:bg-primary-container transition-colors"
        >
          Quay lại Cửa hàng
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-8">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-on-surface-variant mb-8">
        <Link to="/" className="hover:text-primary transition-colors">
          Trang chủ
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/products" className="hover:text-primary transition-colors">
          Sản phẩm
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link
          to={`/products?category=${getCategoryName(book)}`}
          className="hover:text-primary transition-colors"
        >
          {getCategoryName(book)}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-on-surface font-medium truncate max-w-50 sm:max-w-none">
          {book.title}
        </span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 mb-16">
        <div className="w-full lg:w-2/5 shrink-0">
          <div className="aspect-3/4 rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant/30 relative">
            <img
              src={getCoverUrl(
                book.coverImage ?? (book as { cover?: string }).cover,
              )}
              alt={book.title}
              className="block h-full w-full object-cover object-center"
              onError={({ currentTarget }) => {
                currentTarget.onerror = null;
                currentTarget.src = "/images/placeholder-book.png";
              }}
            />
            {book.badge && (
              <div className="absolute top-4 left-4 bg-primary text-on-primary text-sm font-bold px-3 py-1.5 rounded shadow-sm">
                {book.badge}
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 w-full lg:w-auto lg:flex-1">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-2 leading-tight">
            {book.title}
          </h1>
          <div className="text-lg text-on-surface-variant mb-4">
            Tác giả:{" "}
            <span className="font-semibold text-primary">
              {getAuthorName(book)}
            </span>
          </div>

          {/* Hiển thị danh sách tất cả các thể loại dạng badge ngay dưới tiêu đề */}
          {book.categories && book.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {book.categories.map((cat, idx) => {
                const categoryId =
                  (
                    cat as {
                      id?: string | number;
                      categoryId?: string | number;
                    }
                  ).id ?? (cat as { categoryId?: string | number }).categoryId;

                return (
                  <Link
                    key={String(categoryId ?? idx)}
                    to={`/products?categoryId=${categoryId ?? ""}`}
                    className="px-3 py-1 bg-surface-container text-primary rounded-full text-xs font-semibold border border-outline-variant/30 hover:bg-primary hover:text-on-primary transition-colors"
                  >
                    {cat.name}
                  </Link>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-4 mb-6">
            <div className="customer-gold flex items-center gap-2">
              {renderStarDisplay(reviewStats.averageRating)}
              <span className="text-on-surface font-bold">
                {reviewStats.totalReviews > 0
                  ? reviewStats.averageRating.toFixed(1)
                  : "0.0"}
              </span>
            </div>
            <span className="text-on-surface-variant text-sm border-l border-outline-variant/30 pl-4">
              {reviewStats.totalReviews} đánh giá
            </span>
          </div>

          <div className="flex flex-wrap items-end gap-4 mb-8 pb-8 border-b border-outline-variant">
            <div className="font-serif text-3xl md:text-4xl font-bold text-primary">
              {getBookDiscountedPrice(book).toLocaleString("vi-VN")}đ
            </div>
            {Number(book.discountPercent ?? 0) > 0 && (
              <div className="text-lg text-on-surface-variant line-through mb-1">
                {Number(book.price ?? 0).toLocaleString("vi-VN")}đ
              </div>
            )}
          </div>

          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-on-surface font-medium">Số lượng:</span>
                <div className="flex items-center bg-surface-container rounded-lg border border-outline-variant/30">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 text-on-surface hover:text-primary transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    readOnly
                    className="w-12 text-center bg-transparent border-none focus:ring-0 font-semibold"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2 text-on-surface hover:text-primary transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* <div className="flex items-center gap-2">
                <span className="text-on-surface font-medium">Đánh giá:</span>
                {renderStarDisplay(reviewStats.averageRating)}
                <span className="text-sm text-on-surface-variant">
                  {reviewStats.totalReviews > 0
                    ? `${reviewStats.averageRating.toFixed(1)}/5`
                    : "Chưa có đánh giá"}
                </span>
              </div> */}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={async () => {
                  try {
                    if (!book) return;

                    if (!isAuthenticated) {
                      toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng!");
                      navigate("/login");
                      return;
                    }

                    await addToCart(getBookId(book));

                    toast.success("Đã thêm vào giỏ hàng.", {
                      hideProgressBar: true,
                    });
                    await refreshCartCount();
                  } catch (error) {
                    console.error("Add to cart failed", error);
                    toast.error("Thêm vào giỏ hàng thất bại.");
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-on-primary rounded-lg font-semibold text-base hover:bg-primary-container hover:shadow-md transition-[background-color,box-shadow]"
              >
                <ShoppingCart className="w-5 h-5" /> Thêm Vào Giỏ
              </button>
              <button
                type="button"
                onClick={() => void handleBuyNow()}
                disabled={checkoutLoading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 py-4 px-6 bg-surface text-primary border border-primary rounded-xl font-bold text-lg hover:bg-primary-fixed transition-colors disabled:opacity-60"
              >
                {checkoutLoading ? "Đang kiểm tra..." : "Mua Ngay"}
              </button>
            </div>
            <div className="flex gap-4 mt-4">
              <button
                onClick={async () => {
                  if (!book) return;

                  if (!isAuthenticated) {
                    toast.error("Vui lòng đăng nhập để thêm vào yêu thích!");
                    navigate("/login");
                    return;
                  }

                  try {
                    await addToWishlist(getBookId(book));
                    toast.success("Đã thêm vào yêu thích.");
                  } catch (error) {
                    console.error("Add to wishlist failed", error);
                    toast.error("Thêm vào yêu thích thất bại.");
                  }
                }}
                className="flex items-center justify-center gap-2 py-2 text-on-surface-variant hover:text-primary transition-colors text-sm font-medium"
              >
                <Heart className="w-4 h-4" /> Yêu thích
              </button>
              <button className="flex items-center justify-center gap-2 py-2 text-on-surface-variant hover:text-primary transition-colors text-sm font-medium">
                <Share2 className="w-4 h-4" /> Chia sẻ
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-container-low p-6 rounded-xl border border-outline-variant/20">
            <div className="flex items-start gap-3">
              <Truck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Giao hàng tận nơi</h4>
                <p className="text-xs text-on-surface-variant mt-1">
                  Dự kiến giao: 2-3 ngày
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Cam kết chính hãng</h4>
                <p className="text-xs text-on-surface-variant mt-1">
                  100% sách thật từ NXB
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 sm:col-span-2 mt-2 pt-4 border-t border-outline-variant/20">
              <RefreshCw className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Đổi trả miễn phí</h4>
                <p className="text-xs text-on-surface-variant mt-1">
                  Hỗ trợ đổi trả trong 7 ngày với lỗi NSX
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCheckoutModal && checkoutProfile && book ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-surface/80 p-4">
          <div className="w-full max-w-2xl max-h-[calc(100dvh-32px)] overflow-y-auto break-words rounded-xl border border-outline-variant bg-surface p-5 sm:p-6 shadow-lg">
            <h3 className="text-2xl font-bold text-primary mb-4">
              Xác nhận thông tin giao hàng
            </h3>
            <p className="text-sm text-on-surface-variant mb-6">
              Vui lòng kiểm tra thông tin khách hàng và chọn địa chỉ nhận hàng.
            </p>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-surface-container-low p-4">
                  <p className="text-sm text-on-surface-variant">Họ và tên</p>
                  <p className="font-semibold text-on-surface">
                    {checkoutProfile.fullName}
                  </p>
                </div>
                <div className="rounded-2xl bg-surface-container-low p-4">
                  <p className="text-sm text-on-surface-variant">Email</p>
                  <p className="font-semibold text-on-surface">
                    {checkoutProfile.email}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-surface-container-low p-4">
                <label className="mb-2 block text-sm font-semibold text-on-surface">
                  Chọn địa chỉ giao hàng
                </label>
                <select
                  value={
                    selectedCheckoutAddress
                      ? `${selectedCheckoutAddress.addressId ?? selectedCheckoutAddress.id ?? "null"}::${checkoutAddresses.findIndex(
                          (address) => address === selectedCheckoutAddress,
                        )}`
                      : ""
                  }
                  onChange={(event) => {
                    const selectedValue = event.target.value;
                    const index = Number(selectedValue.split("::")[1]);
                    const nextAddress = checkoutAddresses[index] ?? null;
                    setSelectedCheckoutAddress(nextAddress);
                  }}
                  className="w-full rounded-2xl border border-outline-variant/30 bg-surface px-4 py-3 text-on-surface"
                >
                  {checkoutAddresses.map((address, index) => {
                    const optionValue = `${address?.addressId ?? address?.id ?? "null"}::${index}`;
                    const label = [
                      formatFullAddress(address),
                      address?.receiverName ? `• ${address.receiverName}` : "",
                      address?.phone ? `• ${address.phone}` : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <option key={optionValue} value={optionValue}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="rounded-2xl bg-surface-container-low p-4 space-y-2">
                <p className="text-sm font-semibold text-on-surface">
                  Thông tin người nhận
                </p>
                <p className="text-sm text-on-surface">
                  <span className="font-medium">Tên:</span>{" "}
                  {selectedCheckoutAddress?.receiverName?.trim() || "-"}
                </p>
                <p className="text-sm text-on-surface">
                  <span className="font-medium">Số điện thoại:</span>{" "}
                  {selectedCheckoutAddress?.phone?.trim() || "-"}
                </p>
                <p className="text-sm text-on-surface">
                  <span className="font-medium">Địa chỉ:</span>{" "}
                  {formatFullAddress(selectedCheckoutAddress) ||
                    selectedCheckoutAddress?.detailAddress ||
                    selectedCheckoutAddress?.address ||
                    "-"}
                </p>
              </div>

              <div className="rounded-2xl bg-surface-container-low p-4">
                <p className="mb-3 text-sm font-semibold text-on-surface">
                  Sản phẩm trong đơn hàng
                </p>
                <div className="flex items-center justify-between text-sm text-on-surface-variant">
                  <span>
                    {book.title} x {quantity}
                  </span>
                  <span>
                    {(getBookDiscountedPrice(book) * quantity).toLocaleString(
                      "vi-VN",
                    )}
                    đ
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-surface-container-low p-4 space-y-2 text-sm">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Tạm tính</span>
                  <span>
                    {(getBookDiscountedPrice(book) * quantity).toLocaleString(
                      "vi-VN",
                    )}
                    đ
                  </span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Giảm giá</span>
                  <span>0đ</span>
                </div>
                <div className="flex justify-between font-semibold text-on-surface">
                  <span>Tổng thanh toán</span>
                  <span>
                    {(getBookDiscountedPrice(book) * quantity).toLocaleString(
                      "vi-VN",
                    )}
                    đ
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="rounded-2xl border border-outline px-4 py-3 font-semibold text-on-surface-variant transition hover:border-primary hover:text-primary"
              >
                Thoát
              </button>
              <button
                type="button"
                onClick={handleConfirmCheckout}
                className="rounded-2xl bg-primary px-4 py-3 font-semibold text-on-primary transition hover:bg-primary-container"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mb-16">
        <div className="flex border-b border-outline-variant/30 mb-8 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab("desc")}
            className={`px-6 py-4 font-bold whitespace-nowrap transition-colors relative ${activeTab === "desc" ? "text-primary" : "text-on-surface-variant hover:text-primary"}`}
          >
            Mô tả sách
            {activeTab === "desc" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("details")}
            className={`px-6 py-4 font-bold whitespace-nowrap transition-colors relative ${activeTab === "details" ? "text-primary" : "text-on-surface-variant hover:text-primary"}`}
          >
            Thông tin chi tiết
            {activeTab === "details" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`px-6 py-4 font-bold whitespace-nowrap transition-colors relative ${activeTab === "reviews" ? "text-primary" : "text-on-surface-variant hover:text-primary"}`}
          >
            Đánh giá ({book.reviewCount ?? 0})
            {activeTab === "reviews" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>
            )}
          </button>
        </div>

        {activeTab === "desc" && (
          <div className="prose prose-slate max-w-none text-on-surface leading-relaxed text-sm md:text-base">
            <p>
              {book.description ??
                "Mô tả chi tiết đang được cập nhật. Đây là nội dung mẫu để hiển thị chi tiết sản phẩm."}
            </p>
          </div>
        )}

        {activeTab === "details" && (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <tbody>
                <tr className="border-b border-outline-variant/20">
                  <th className="py-3 px-4 md:px-6 bg-surface-container-low w-1/3 font-semibold text-on-surface">
                    Tác giả
                  </th>
                  <td className="py-3 px-4 md:px-6">{getAuthorName(book)}</td>
                </tr>
                <tr className="border-b border-outline-variant/20">
                  <th className="py-3 px-4 md:px-6 bg-surface-container-low w-1/3 font-semibold text-on-surface">
                    Thể loại
                  </th>
                  <td className="py-3 px-4 md:px-6">
                    {/* ❤️ Hiển thị đầy đủ tất cả thể loại cách nhau bằng dấu phẩy hoặc dạng danh sách trong bảng */}
                    {book.categories && book.categories.length > 0
                      ? book.categories.map((cat) => cat.name).join(", ")
                      : (book.category ?? "Khác")}
                  </td>
                </tr>
                <tr className="border-b border-outline-variant/20">
                  <th className="py-3 px-4 md:px-6 bg-surface-container-low w-1/3 font-semibold text-on-surface">
                    Nhà xuất bản
                  </th>
                  <td className="py-3 px-4 md:px-6">
                    {getPublisherName(book)}
                  </td>
                </tr>
                <tr className="border-b border-outline-variant/20">
                  <th className="py-3 px-4 md:px-6 bg-surface-container-low w-1/3 font-semibold text-on-surface">
                    Số trang
                  </th>
                  <td className="py-3 px-4 md:px-6">
                    {book.pageCount ?? "Chưa cập nhật"}
                  </td>
                </tr>
                <tr>
                  <th className="py-3 px-4 md:px-6 bg-surface-container-low w-1/3 font-semibold text-on-surface">
                    Kích thước
                  </th>
                  <td className="py-3 px-4 md:px-6">
                    {book.size ?? "Chưa cập nhật"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-8">
            <div className="rounded-3xl border border-outline-variant/30 bg-surface-container-low p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-on-surface">
                    Đánh giá sản phẩm
                  </h3>
                  <p className="text-sm text-on-surface-variant mt-1">
                    {reviewStats.totalReviews > 0
                      ? `Điểm trung bình ${reviewStats.averageRating.toFixed(1)} trên ${reviewStats.totalReviews} đánh giá.`
                      : "Chưa có đánh giá nào cho sản phẩm này."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {renderStarDisplay(reviewStats.averageRating)}
                  <span className="text-sm font-semibold text-on-surface">
                    {reviewStats.totalReviews > 0
                      ? `${reviewStats.averageRating.toFixed(1)}/5`
                      : "0.0/5"}
                  </span>
                </div>
              </div>
            </div>

            {isAuthenticated ? (
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6">
                <h3 className="text-xl font-semibold text-on-surface mb-4">
                  Gửi đánh giá
                </h3>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-on-surface">
                      Đánh giá sao
                    </label>
                    {renderStarSelector(reviewRating, setReviewRating)}
                    <span className="text-sm text-on-surface-variant">
                      Bạn đã chọn {reviewRating} sao
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-on-surface">
                      Bình luận (không bắt bu)
                    </label>
                    <textarea
                      value={reviewText}
                      onChange={(event) => setReviewText(event.target.value)}
                      rows={4}
                      className="w-full rounded-3xl border border-outline p-4 bg-surface-container text-on-surface focus:border-primary focus:outline-none"
                      placeholder="Chia sẻ cảm nhận của bạn về cuốn sách này"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                  </button>
                </form>
              </div>
            ) : (
              <div className="rounded-3xl border border-primary/20 bg-primary/10 p-6 text-sm text-primary">
                Bạn cần đăng nhập để gửi đánh giá cho sản phẩm này.
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-on-surface">
                Các đánh giá gần đây
              </h3>
              {loadingReviews ? (
                <div className="rounded-3xl border border-outline-variant/30 bg-surface-container-low p-6 text-sm text-on-surface-variant">
                  Đang tải đánh giá...
                </div>
              ) : productReviews.length > 0 ? (
                productReviews.map((review, index) => (
                  <div
                    key={review.id ?? `review-${index}`}
                    className="rounded-3xl border border-outline-variant/30 bg-surface-container-low p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-on-surface">
                          {review.user?.fullName ??
                            review.user?.name ??
                            review.userName ??
                            "Khách hàng"}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          {renderStarDisplay(review.rating ?? 0)}
                          <span className="text-sm text-on-surface-variant">
                            {review.rating ?? 0}/5
                          </span>
                        </div>
                      </div>
                      {review.createdAt && (
                        <span className="text-xs text-on-surface-variant">
                          {new Date(review.createdAt).toLocaleDateString(
                            "vi-VN",
                          )}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                      {review.comment?.trim() ||
                        "Khách hàng không để lại bình luận."}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-outline-variant/30 bg-surface-container-low p-6 text-sm text-on-surface-variant">
                  Chưa có đánh giá nào cho sản phẩm này.
                </div>
              )}
            </div>

            {!isAuthenticated && (
              <div className="rounded-3xl border border-error/20 bg-error/10 p-6 text-sm text-error">
                Vui lòng{" "}
                <Link
                  to="/login"
                  className="font-semibold text-error underline"
                >
                  đăng nhập
                </Link>{" "}
                để gửi đánh giá.
              </div>
            )}
          </div>
        )}
      </div>

      {relatedBooks.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-8">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary">
              Có thể bạn sẽ thích
            </h2>
            <Link
              to={`/products?category=${getCategoryName(book)}`}
              className="text-primary font-bold hover:text-primary-container transition-colors hidden sm:block"
            >
              Xem thêm {getCategoryName(book)}
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {relatedBooks.map((relatedBook) => (
              <BookCard key={relatedBook.id} book={relatedBook} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
