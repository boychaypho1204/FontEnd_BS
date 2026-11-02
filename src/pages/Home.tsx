import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Star, ChevronLeft, ChevronRight } from "lucide-react";
import BookCard from "../components/ui/BookCard";
import {
  getBanners,
  getCategories,
  getFeaturedBooks,
} from "../services/publicService";
import { resolveBannerImageUrl } from "../services/bannerService";
import type { Banner, Category } from "../services/publicService";
import type { Book } from "../types";
import { resolveAssetUrl } from "../lib/utils";

export default function Home() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const featuredBooksToShow = featuredBooks.slice(0, 10);

  // 1. Tạo Ref để điều khiển cuộn cho khối Danh mục
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // 2. BÍ KÍP TRƯỢT THEO TRANG: Trượt 1 phát bằng đúng chiều rộng của khung (tương đương 4 danh mục)
  // 2. BÍ KÍP TRƯỢT TỪNG THẺ: Đo chiều rộng của 1 thẻ để trượt
  const scrollCategories = (direction: "left" | "right") => {
    if (
      categoryScrollRef.current &&
      categoryScrollRef.current.firstElementChild
    ) {
      // Đo xem 1 thẻ danh mục hiện tại đang rộng bao nhiêu pixel
      const cardWidth = categoryScrollRef.current.firstElementChild.clientWidth;

      // Khai báo khoảng cách (gap) giữa 2 thẻ. CSS của em đang dùng md:gap-6 tương đương 24px
      const gap = 24;

      // Tính toán khoảng cách trượt: 1 thẻ + 1 khoảng trống
      const scrollAmount =
        direction === "left" ? -(cardWidth + gap) : cardWidth + gap;

      categoryScrollRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const loadHomeData = async () => {
      setIsLoading(true);
      try {
        const [bannerRes, categoryRes, bookRes] = await Promise.all([
          getBanners(),
          getCategories(),
          getFeaturedBooks(10),
        ]);

        const bannerPayload = bannerRes.data as
          | Record<string, unknown>
          | Banner[];
        const categoryPayload = categoryRes.data as
          | Record<string, unknown>
          | Category[];
        const featuredBookPayload = bookRes.data as
          | Record<string, unknown>
          | Book[];

        const bannerData = Array.isArray(bannerPayload)
          ? bannerPayload
          : ((bannerPayload as Record<string, unknown>)?.data ??
            (bannerPayload as Record<string, unknown>)?.content ??
            []);
        const categoryData = Array.isArray(categoryPayload)
          ? categoryPayload
          : ((categoryPayload as Record<string, unknown>)?.data ??
            (categoryPayload as Record<string, unknown>)?.content ??
            []);
        const featuredBookData = Array.isArray(featuredBookPayload)
          ? featuredBookPayload
          : ((featuredBookPayload as Record<string, unknown>)?.data ??
            (featuredBookPayload as Record<string, unknown>)?.content ??
            []);

        setBanners(Array.isArray(bannerData) ? bannerData : []);
        setCategories(Array.isArray(categoryData) ? categoryData : []);
        setFeaturedBooks(
          Array.isArray(featuredBookData) ? featuredBookData : [],
        );
      } catch (error) {
        console.error("Failed to load home page data", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const isBannerActive = (banner: Partial<Banner> | undefined) => {
    const status = banner?.status?.toString().toUpperCase();
    return (
      status === "ACTIVE" ||
      status === "ENABLED" ||
      status === "PUBLISHED" ||
      status === "1" ||
      banner?.isActive === true ||
      banner?.active === true
    );
  };

  const activeBanner = (banners.find((banner) => isBannerActive(banner)) ??
    banners[0]) as (Banner & { bannerId?: string | number }) | undefined;

  const getBannerImageUrl = (img?: string, bannerId?: string | number) => {
    if (!img) {
      return "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=2070&auto=format&fit=crop";
    }
    const resolved = resolveBannerImageUrl(img, bannerId);
    return (
      resolved ||
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=2070&auto=format&fit=crop"
    );
  };

  const heroBanner = activeBanner
    ? {
        id: activeBanner.id ?? activeBanner.bannerId ?? "db-banner",
        image: getBannerImageUrl(
          activeBanner.imageUrl ?? activeBanner.image,
          activeBanner.id ?? activeBanner.bannerId,
        ),
        title: activeBanner.title || "Khám Phá Thế Giới Qua Từng Trang Sách",
        subtitle:
          activeBanner.link ||
          activeBanner.subtitle ||
          "Nuôi dưỡng tâm hồn và mở mang trí tuệ.",
        ctaText: "Khám Phá Ngay",
        ctaLink: "/products",
      }
    : {
        id: "default",
        image:
          "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=2070&auto=format&fit=crop",
        title: "Khám Phá Thế Giới Qua Từng Trang Sách",
        subtitle:
          "Hàng ngàn tựa sách từ văn học kinh điển đến kiến thức hiện đại. Nuôi dưỡng tâm hồn và mở mang trí tuệ.",
        ctaText: "Mua Ngay",
        ctaLink: "/products",
      };

  return (
    <div className="flex flex-col gap-16 md:gap-24 pb-20 overflow-x-hidden -mt-16 md:-mt-20">
      {/* Hero Section */}
      <section className="relative z-0 w-[100vw] ml-[calc(50%-50vw)] overflow-hidden aspect-video">
        <img
          src={heroBanner.image}
          alt="Banner khuyến mãi"
          className="absolute inset-0 h-full w-full object-cover -z-20"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent -z-10"></div>
        <div className="absolute inset-x-0 bottom-4 w-full md:bottom-auto md:top-[66%] lg:top-[63%]">
          <div className="relative z-10 flex w-full justify-start px-[7.5%]">
            <Link
              to={heroBanner.ctaLink ?? "/products"}
              className="group/banner-cta inline-flex min-h-11 max-w-full items-center justify-center gap-2.5 rounded-lg border border-[#203420] bg-[#263D26] px-[18px] py-2 text-sm leading-6 font-semibold text-[#FFF8E7] shadow-[0_2px_6px_rgba(38,61,38,0.16)] transition-[background-color,box-shadow] duration-200 hover:bg-[#344F32] hover:shadow-[0_4px_10px_rgba(38,61,38,0.22)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FFF8E7] focus-visible:ring-4 focus-visible:ring-[#263D26] motion-reduce:transition-none md:min-h-12 md:px-6 md:text-[15px] lg:min-h-[50px] lg:px-[26px] lg:text-base"
            >
              {heroBanner.ctaText ?? "Khám Phá Ngay"}
              <ArrowRight className="h-5 w-5 shrink-0 transition-transform duration-200 motion-safe:group-hover/banner-cta:translate-x-[3px] motion-reduce:transition-none" />
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-[1440px] mx-auto px-4 md:px-10 w-full">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary">
              Danh mục nổi bật
            </h2>
            <p className="text-on-surface-variant max-w-xl">
              Khám phá từng thể loại sách phù hợp với cảm hứng và nhu cầu của
              bạn.
            </p>
          </div>
          <Link
            to="/products"
            className="text-primary font-bold hover:text-primary-container"
          >
            Xem tất cả
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-40 rounded-3xl bg-surface-container-high animate-pulse"
              ></div>
            ))}
          </div>
        ) : (
          <div className="relative group">
            <button
              type="button"
              onClick={() => scrollCategories("left")}
              className="pointer-events-none absolute left-0 top-1/2 z-20 hidden h-12 w-12 -translate-x-5 -translate-y-1/2 items-center justify-center rounded-lg border border-outline-variant bg-surface text-primary opacity-0 shadow-md transition-opacity duration-200 hover:bg-primary hover:text-on-primary group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 md:flex"
              aria-label="Cuộn sang trái"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              type="button"
              onClick={() => scrollCategories("right")}
              className="pointer-events-none absolute right-0 top-1/2 z-20 hidden h-12 w-12 translate-x-5 -translate-y-1/2 items-center justify-center rounded-lg border border-outline-variant bg-surface text-primary opacity-0 shadow-md transition-opacity duration-200 hover:bg-primary hover:text-on-primary group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 md:flex"
              aria-label="Cuộn sang phải"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* BÍ KÍP SNAP: Thêm snap-x snap-mandatory để nó khựng lại đúng vị trí như nam châm */}
            <div
              ref={categoryScrollRef}
              className="flex items-center gap-4 md:gap-6 overflow-x-auto scroll-smooth py-2 px-1 scrollbar-none snap-x snap-mandatory"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {categories.map((category: any, index) => (
                <Link
                  key={
                    category?.id ?? category?.categoryId ?? `category-${index}`
                  }
                  to={`/products?category=${encodeURIComponent(
                    category?.name ?? "",
                  )}`}
                  // BÍ KÍP CHIA CỘT CSS BẰNG TOÁN HỌC (Ép chính xác 4 cột trên PC, 3 cột trên Tablet, 2 cột trên Phone)
                  className="group/card block flex-shrink-0 snap-start w-[85%] sm:w-[calc(50%-8px)] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)] rounded-xl border border-outline-variant bg-surface p-6 shadow-sm transition-shadow duration-200 hover:shadow-md"
                >
                  <div className="mb-4 h-32 overflow-hidden rounded-3xl bg-surface-container-high">
                    {category?.imageUrl || category?.image ? (
                      <img
                        src={resolveAssetUrl(
                          category?.imageUrl ?? category?.image,
                        )}
                        alt={category.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/images/placeholder-book.png";
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-on-surface-variant">
                        No image
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-on-surface group-hover/card:text-primary transition-colors">
                    {category?.name ?? "Đang cập nhật"}
                  </h3>
                  <p className="text-sm text-on-surface-variant line-clamp-2">
                    {category?.description ||
                      "Khám phá những tựa sách hay nhất trong thể loại này."}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Featured Books */}
      {/* BÍ KÍP 2: Tăng max-w từ 1280px lên 1440px */}
      <section className="max-w-[1440px] mx-auto px-4 md:px-10 w-full">
        <div className="flex items-end justify-between mb-8 md:mb-10">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-3">
              Sách Nổi Bật
            </h2>
            <p className="text-on-surface-variant max-w-xl">
              Những tác phẩm được yêu thích nhất trong tháng, không thể bỏ lỡ.
            </p>
          </div>
          <Link
            to="/products"
            className="hidden md:flex items-center gap-2 text-primary font-bold hover:text-primary-container transition-colors group"
          >
            Xem tất cả
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {isLoading ? (
          // BÍ KÍP 3: Sửa lg:grid-cols-5 để show 5 sách 1 dòng.
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
            {/* Tạo khung mờ cho 10 quyển sách */}
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="h-96 rounded-3xl bg-surface-container-high animate-pulse"
              ></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
            {featuredBooksToShow.map((book: any, index) => (
              <BookCard
                key={book?.id ?? book?.bookId ?? `featured-${index}`}
                book={book}
              />
            ))}
          </div>
        )}

        <div className="mt-8 text-center md:hidden">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-surface-container-high text-primary rounded-full font-bold hover:bg-surface-container transition-colors"
          >
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
