import React, { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search, Image as ImageIcon } from "lucide-react";
import { toast } from "react-toastify";
import {
  createBanner,
  deleteBanner,
  getBanners,
  resolveBannerImageUrl,
  updateBanner,
  uploadBannerImage,
  updateBannerStatus,
  type BannerPayload,
} from "../../services/bannerService";

interface BannerItem {
  id?: string | number;
  title?: string;
  subtitle?: string; // Dùng biến này cho phần "chi tiết"
  imageUrl?: string;
  image?: string; // Bổ sung thêm biến image để khớp với Backend
  status?: string;
  [key: string]: any;
}

export function BannerManagement() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageInfo, setPageInfo] = useState({
    number: 0,
    totalPages: 0,
    totalElements: 0,
    size: 10,
  });
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // Rút gọn Form state chỉ còn đúng 4 trường bạn cần
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    status: "ACTIVE",
    imageFile: null as File | null,
  });

  const fetchBanners = async (nextPage = page, keyword = search) => {
    setLoading(true);
    try {
      const response = await getBanners(nextPage, 10, keyword);
      const payload = response.data?.data ?? response.data;
      const content = payload?.content ?? payload?.data ?? payload ?? [];
      const pagePayload =
        payload && typeof payload === "object" && "content" in payload
          ? payload
          : null;

      setBanners(Array.isArray(content) ? content : []);
      setPageInfo({
        number: pagePayload?.number ?? nextPage,
        totalPages: pagePayload?.totalPages ?? 1,
        totalElements: pagePayload?.totalElements ?? content.length,
        size: pagePayload?.size ?? 10,
      });
      setPage(pagePayload?.number ?? nextPage);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể tải danh sách banner",
        { hideProgressBar: true },
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners(0, search);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => fetchBanners(0, search), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (form.imageFile) {
      const url = URL.createObjectURL(form.imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }

    setPreviewUrl(
      resolveBannerImageUrl(editingBanner?.image ?? editingBanner?.imageUrl),
    );
  }, [form.imageFile, editingBanner]);

  const openCreate = () => {
    setEditingBanner(null);
    setForm({
      title: "",
      subtitle: "",
      status: "ACTIVE",
      imageFile: null,
    });
    setShowModal(true);
  };

  const openEdit = (banner: BannerItem) => {
    setEditingBanner(banner);
    setForm({
      title: banner.title ?? "",
      // Lấy chữ từ biến link của Backend đổ vào ô Chi tiết
      subtitle: banner.link ?? "",
      status: banner.status ?? "ACTIVE",
      imageFile: null,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string | number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa banner này?")) return;
    try {
      await deleteBanner(id);
      toast.success("Xóa banner thành công", { hideProgressBar: true });
      await fetchBanners(page, search);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể xóa banner", {
        hideProgressBar: true,
      });
    }
  };

  const handleToggleStatus = async (banner: BannerItem) => {
    // Tìm ID (đề phòng Backend trả về chữ bannerId thay vì id)
    const targetId = banner.id ?? banner.bannerId;

    if (!targetId) {
      toast.error("Lỗi: Banner này không có ID! Hãy kiểm tra lại Backend.", {
        hideProgressBar: true,
      });
      console.log("Dữ liệu banner bị lỗi thiếu ID:", banner);
      return;
    }

    const currentStatus =
      banner.status?.toUpperCase() === "ACTIVE" ? "ACTIVE" : "INACTIVE";
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    // Cập nhật UI ngay lập tức
    setBanners((prev) =>
      prev.map((b) =>
        (b.id ?? b.bannerId) === targetId ? { ...b, status: newStatus } : b,
      ),
    );

    try {
      await updateBannerStatus(targetId, newStatus);
      toast.success(
        `Đã ${newStatus === "ACTIVE" ? "bật" : "tắt"} hiển thị banner`,
        { hideProgressBar: true },
      );
    } catch (err) {
      console.error("Lỗi khi đổi trạng thái:", err);
      toast.error("Đổi trạng thái thất bại do API Backend chặn!", {
        hideProgressBar: true,
      });
      fetchBanners(page, search);
    }
  };

  const parseUploadedBannerImagePath = (data: unknown) => {
    if (!data) {
      return "";
    }

    if (typeof data === "string") {
      return data;
    }

    if (typeof data === "object" && data !== null) {
      const record = data as Record<string, unknown>;
      return String(
        record.path ?? record.image ?? record.imageUrl ?? record.data ?? "",
      );
    }

    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let uploadedImagePath = "";

      if (form.imageFile) {
        const uploadResponse = await uploadBannerImage(form.imageFile);
        uploadedImagePath = parseUploadedBannerImagePath(uploadResponse.data);
      }

      const payload = {
        title: form.title?.trim() || "",
        image: uploadedImagePath || "",
        link: form.subtitle ?? "",
        status: form.status ?? "ACTIVE",
      };

      if (!payload.title) {
        toast.error("Vui lòng nhập tiêu đề banner", { hideProgressBar: true });
        return;
      }

      if (!payload.image) {
        toast.error("Vui lòng chọn ảnh banner", { hideProgressBar: true });
        return;
      }

      await createBanner(payload);
      toast.success("Thêm banner thành công", { hideProgressBar: true });
      setShowModal(false);
      setEditingBanner(null);
      setForm({
        title: "",
        subtitle: "",
        status: "ACTIVE",
        imageFile: null,
      });
      await fetchBanners(page, search);
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Không thể thêm banner mới",
        { hideProgressBar: true },
      );
    }
  };
  const pageNumbers = useMemo(
    () =>
      Array.from(
        { length: Math.max(pageInfo.totalPages, 1) },
        (_, index) => index + 1,
      ),
    [pageInfo.totalPages],
  );

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">
            Banner Management
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Tạo và cập nhật banner hiển thị trên trang chủ.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition hover:bg-primary/90"
        >
          <Plus size={18} /> Thêm Banner
        </button>
      </div>

      <div className="bg-surface p-4 rounded-xl border border-outline-variant flex items-center gap-2 shadow-sm">
        <Search size={18} className="text-outline" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm banner..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden flex-1 flex flex-col shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-surface-container-low border-b border-outline-variant text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              <tr>
                <th className="px-4 py-4 w-32">Hình ảnh</th>
                <th className="px-4 py-4 w-1/4">Tiêu đề (Title)</th>
                <th className="px-4 py-4 flex-1">Chi tiết</th>
                <th className="px-4 py-4 text-center w-32">Trạng thái</th>
                <th className="px-4 py-4 text-right w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-sm text-on-surface divide-y divide-outline-variant">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-on-surface-variant"
                  >
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : banners.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-on-surface-variant"
                  >
                    Chưa có banner nào.
                  </td>
                </tr>
              ) : (
                banners.map((banner, index) => {
                  // Sửa lỗi Key undefined và đảm bảo lấy đúng nguồn ảnh
                  const rowKey =
                    banner.id ?? banner.bannerId ?? `banner-row-${index}`;
                  const imageSrc = resolveBannerImageUrl(
                    banner.image ?? banner.imageUrl,
                  );

                  return (
                    <tr
                      key={rowKey}
                      className="hover:bg-surface-variant/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={banner.title}
                            className="w-24 h-12 object-cover rounded-md border border-outline-variant shadow-sm"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src =
                                "https://placehold.co/400x200/png?text=No+Image";
                            }}
                          />
                        ) : (
                          <div className="w-24 h-12 rounded-md border border-outline-variant bg-surface-variant flex items-center justify-center text-outline">
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-primary">
                        {banner.title ?? "Chưa có tiêu đề"}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        <p className="line-clamp-2 text-xs">
                          {banner.link ?? banner.subtitle ?? "Không có mô tả"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleStatus(banner)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            banner.status?.toUpperCase() === "ACTIVE"
                              ? "bg-green-500"
                              : "bg-outline-variant"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              banner.status?.toUpperCase() === "ACTIVE"
                                ? "translate-x-6"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(banner)}
                            className="text-primary hover:bg-primary/10 p-2 rounded-lg transition"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => {
                              const targetId = banner.id ?? banner.bannerId;
                              if (targetId) {
                                handleDelete(targetId);
                              } else {
                                toast.error(
                                  "Lỗi: Không tìm thấy ID của banner này để xóa!",
                                  { hideProgressBar: true },
                                );
                              }
                            }}
                            className="text-error hover:bg-error/10 p-2 rounded-lg transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-outline-variant bg-background flex items-center justify-between mt-auto">
          <span className="text-sm text-on-surface-variant">
            Hiển thị {banners.length} / {pageInfo.totalElements} banner
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => fetchBanners(Math.max(0, page - 1), search)}
              disabled={page <= 0}
              className="p-2 border border-outline-variant rounded-lg text-on-surface hover:bg-surface-variant disabled:opacity-50"
            >
              &lt;
            </button>
            {pageNumbers.map((number) => (
              <button
                key={number}
                onClick={() => fetchBanners(number - 1, search)}
                className={`w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center ${page + 1 === number ? "bg-primary text-white" : "border border-outline-variant text-on-surface hover:bg-surface-variant"}`}
              >
                {number}
              </button>
            ))}
            <button
              onClick={() =>
                fetchBanners(
                  Math.min(pageInfo.totalPages - 1, page + 1),
                  search,
                )
              }
              disabled={page >= pageInfo.totalPages - 1}
              className="p-2 border border-outline-variant rounded-lg text-on-surface hover:bg-surface-variant disabled:opacity-50"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-outline-variant w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-primary mb-5 border-b pb-3">
              {editingBanner ? "Cập Nhật Banner" : "Thêm Banner Mới"}
            </h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Ô 1: Title */}
              <div>
                <label className="text-sm font-bold text-on-surface block mb-1">
                  Tiêu đề (Title)
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="Nhập tiêu đề banner..."
                  className="w-full border border-outline-variant bg-surface-container-low rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              {/* Ô 2: Chi tiết */}
              <div>
                <label className="text-sm font-bold text-on-surface block mb-1">
                  Chi tiết (Dòng chữ nhỏ)
                </label>
                <textarea
                  value={form.subtitle}
                  onChange={(e) =>
                    setForm({ ...form, subtitle: e.target.value })
                  }
                  rows={3}
                  placeholder="Nhập mô tả chi tiết..."
                  className="w-full border border-outline-variant bg-surface-container-low rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              {/* Ô 3: Trạng thái */}
              <div>
                <label className="text-sm font-bold text-on-surface block mb-1">
                  Trạng thái
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full border border-outline-variant bg-surface-container-low rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="ACTIVE">Kích hoạt (Hiển thị ngay)</option>
                  <option value="INACTIVE">Tắt (Chưa hiển thị)</option>
                </select>
              </div>

              {/* Ô 4: Ảnh */}
              <div>
                <label className="text-sm font-bold text-on-surface block mb-1">
                  Hình ảnh nền
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setForm({ ...form, imageFile: e.target.files?.[0] ?? null })
                  }
                  className="w-full border border-outline-variant bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
                {previewUrl ? (
                  <div className="mt-4">
                    <p className="text-sm text-on-surface-variant mb-2">
                      Xem trước ảnh
                    </p>
                    <img
                      src={previewUrl}
                      alt="Preview banner"
                      className="w-full h-44 rounded-2xl object-cover border border-outline-variant shadow-sm"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          "https://placehold.co/400x200/png?text=No+Image";
                      }}
                    />
                  </div>
                ) : null}
              </div>

              {/* Nút bấm */}
              <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-outline-variant/50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 rounded-xl border border-outline-variant hover:bg-surface-variant transition font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition shadow-md"
                >
                  {editingBanner ? "Lưu thay đổi" : "Lưu Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
