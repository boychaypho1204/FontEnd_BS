import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getCartItems,
  removeCartItem,
  updateCartItem,
  getVouchers,
  type Voucher,
} from "../services/cartService";
import { getUserAddresses, getUserProfile } from "../services/userService";
import { useCart } from "../contexts/CartContext";
// Nếu interface CartItem trong file types chưa cập nhật, bạn có thể dùng 'any' tạm thời hoặc mở file types ra sửa
import type { CartItem } from "../types";

type CheckoutAddress = {
  id: number | null;
  address: string;
  receiverName?: string;
  phone?: string;
  isDefault?: boolean;
};

type CartVoucher = Voucher & {
  usageLimit?: number;
  usedCount?: number;
};

const getCoverUrl = (image?: string) => {
  if (!image) {
    return "/images/placeholder-book.png";
  }

  if (/^(https?:\/\/|\/\/)/.test(image)) {
    return image;
  }

  if (image.startsWith("/")) {
    return image;
  }

  if (image.startsWith("uploads/")) {
    return `http://localhost:8080/${image}`;
  }

  return `http://localhost:8080/uploads/${image}`;
};

export default function Cart() {
  const navigate = useNavigate();
  const { refreshCartCount } = useCart();
  // Dùng any tạm ở đây nếu interface CartItem của bạn chưa được khai báo các biến mới như itemId, coverImage
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vouchers, setVouchers] = useState<CartVoucher[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState("");
  const [discount, setDiscount] = useState(0);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutProfile, setCheckoutProfile] = useState<{
    fullName: string;
    email: string;
    phone: string;
  } | null>(null);
  const [checkoutAddresses, setCheckoutAddresses] = useState<CheckoutAddress[]>(
    [],
  );
  const [selectedCheckoutAddress, setSelectedCheckoutAddress] =
    useState<CheckoutAddress | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const getItemIdentity = (item: any, index: number) =>
    String(item?.itemId ?? item?.id ?? `cart-item-${index}`);

  const loadCart = async () => {
    setLoading(true);
    try {
      const [cartRes, voucherRes] = await Promise.all([
        getCartItems(),
        getVouchers(),
      ]);
      // Bảo vệ đa tầng khi parse dữ liệu giỏ hàng
      const rawCartData =
        cartRes?.data?.data ?? cartRes?.data?.content ?? cartRes?.data ?? [];
      const cartData = Array.isArray(rawCartData) ? rawCartData : [];
      setItems(cartData);

      const voucherData =
        voucherRes?.data?.data ??
        voucherRes?.data?.content ??
        voucherRes?.data ??
        [];
      setVouchers(
        (Array.isArray(voucherData) ? voucherData : []).filter(
          (voucher: any): voucher is CartVoucher => Boolean(voucher?.code),
        ),
      );

      setSelectedItemIds((currentSelected) => {
        const nextIds = cartData.map((item, index) =>
          getItemIdentity(item, index),
        );

        if (!currentSelected.length) {
          return nextIds;
        }

        const currentSet = new Set(currentSelected);
        return nextIds.filter((id) => currentSet.has(id));
      });
    } catch (error) {
      console.error("Failed to load cart", error);
      toast.error("Không thể tải giỏ hàng ngay bây giờ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const isVoucherExpired = (voucher: CartVoucher) => {
    if (String(voucher.status ?? "").toUpperCase() === "EXPIRED") {
      return true;
    }

    if (!voucher.endDate) {
      return false;
    }

    const endDate = new Date(voucher.endDate);
    return !Number.isNaN(endDate.getTime()) && endDate.getTime() <= Date.now();
  };

  useEffect(() => {
    const selected = vouchers.find(
      (voucher) => voucher.code.toUpperCase() === selectedVoucher.toUpperCase(),
    );

    if (selected && isVoucherExpired(selected)) {
      setSelectedVoucher("");
      setDiscount(0);
    }
  }, [selectedVoucher, vouchers]);

  // Đổi kiểu dữ liệu thành string | number | undefined để không bị lỗi đỏ
  const handleQuantityChange = async (
    itemId: string | number | undefined,
    quantity: number,
  ) => {
    if (!itemId || quantity < 1) return;

    try {
      await updateCartItem(String(itemId), quantity);
      // toast.success("Cập nhật số lượng thành công.");
      await loadCart();
      await refreshCartCount();
    } catch (error) {
      console.error("Update cart item failed", error);
      // toast.error("Cập nhật số lượng thất bại.");
    }
  };

  const handleRemoveItem = async (itemId: string | number | undefined) => {
    if (!itemId) return;

    try {
      await removeCartItem(String(itemId));
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng.");
      // Sửa lỗi ở đây: Đổi item.id thành (item.itemId ?? item.id)
      setItems((current) =>
        current.filter((item) => (item.itemId ?? item.id) !== itemId),
      );
      setSelectedItemIds((current) =>
        current.filter((id) => id !== String(itemId)),
      );
      await refreshCartCount();
    } catch (error) {
      console.error("Remove cart item failed", error);
      toast.error("Xóa sản phẩm thất bại.");
    }
  };

  const handleApplyVoucher = () => {
    if (!selectedVoucher) {
      toast.info("Vui lòng chọn mã giảm giá.");
      return;
    }

    const voucherCode = selectedVoucher.toUpperCase();
    const voucher = vouchers.find(
      (item) => item.code.toUpperCase() === voucherCode,
    );
    if (!voucher) {
      toast.error("Mã giảm giá không hợp lệ.");
      return;
    }

    if (isVoucherExpired(voucher)) {
      setSelectedVoucher("");
      setDiscount(0);
      toast.error("Mã giảm giá đã hết hạn sử dụng.");
      return;
    }

    setDiscount(10);
    toast.success(`Áp dụng mã ${voucherCode} thành công.`);
  };

  const formatFullAddress = (address: any) => {
    if (!address) return "";

    if (typeof address === "string") {
      return address.trim();
    }

    const fullAddressValue = String(address?.address ?? "").trim();
    const detailParts = [
      address?.detailAddress,
      address?.addressLine,
      address?.street,
    ].filter((part) => Boolean(String(part ?? "").trim()));
    const locationParts = [
      address?.ward,
      address?.district,
      address?.province,
    ].filter((part) => Boolean(String(part ?? "").trim()));

    const combinedValue = [...detailParts, ...locationParts]
      .filter(Boolean)
      .join(", ");

    if (fullAddressValue) {
      const normalizedFull = fullAddressValue.replace(/\s+/g, " ");
      const normalizedCombined = combinedValue.replace(/\s+/g, " ");

      if (
        !normalizedCombined ||
        normalizedFull.toLowerCase() === normalizedCombined.toLowerCase() ||
        normalizedFull.toLowerCase().includes(normalizedCombined.toLowerCase())
      ) {
        return normalizedFull;
      }

      return normalizedFull;
    }

    return combinedValue;
  };

  const parseAddresses = (profile: any, backendAddresses?: any[]) => {
    const normalizeAddressId = (value: unknown) => {
      if (typeof value === "number" && Number.isFinite(value)) {
        return value;
      }

      if (typeof value === "string") {
        const trimmed = value.trim();
        if (/^\d+$/.test(trimmed)) {
          return Number(trimmed);
        }
      }

      return null;
    };

    const normalizeAddress = (item: any): CheckoutAddress => {
      if (typeof item === "string") {
        return { id: null, address: item };
      }

      const addressText = formatFullAddress(item);

      return {
        id: normalizeAddressId(item?.id),
        address: addressText,
        receiverName: item?.receiverName ?? item?.fullName ?? "",
        phone: item?.phone ?? "",
        isDefault: Boolean(item?.isDefault ?? false),
      };
    };

    const fromBackend = Array.isArray(backendAddresses)
      ? backendAddresses
          .map((item: any): CheckoutAddress => {
            const addressText = formatFullAddress(item);

            return {
              id: normalizeAddressId(item?.addressId),
              address: addressText || item?.receiverName || "Địa chỉ nhận hàng",
              receiverName: item?.receiverName ?? "",
              phone: item?.phone ?? "",
              isDefault: Boolean(item?.isDefault ?? false),
            };
          })
          .filter((item) => item.address && item.address.trim())
      : [];

    const fromProfileArray = Array.isArray(profile?.addresses)
      ? profile.addresses
          .map(normalizeAddress)
          .filter((item) => item.address && item.address.trim())
      : [];

    const fromProfileString =
      typeof profile?.address === "string" && profile.address.trim()
        ? profile.address
            .split(/\n|\|/)
            .map((item: string) => item.trim())
            .filter(Boolean)
            .map((item) => ({ id: null, address: item }) as CheckoutAddress)
        : [];

    const merged = [...fromBackend, ...fromProfileArray, ...fromProfileString];
    const seen = new Set<string>();

    return merged.filter((item) => {
      if (!item.address || !item.address.trim()) {
        return false;
      }

      const key = `${item.id ?? "null"}::${item.address.trim()}`;
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItemIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId],
    );
  };

  const toggleSelectAll = () => {
    if (items.length === 0) return;

    const allIds = items.map((item, index) => getItemIdentity(item, index));
    const allSelected = allIds.every((id) => selectedItemIds.includes(id));

    setSelectedItemIds(allSelected ? [] : allIds);
  };

  const handleBuyNow = async () => {
    if (!items.length) {
      toast.info("Giỏ hàng trống. Hãy thêm sản phẩm trước khi mua.");
      return;
    }

    if (!selectedItems.length) {
      toast.info("Vui lòng chọn ít nhất một sản phẩm để mua.");
      return;
    }

    setCheckoutLoading(true);
    try {
      const [profileResponse, addressResponse] = await Promise.all([
        getUserProfile(),
        getUserAddresses(),
      ]);
      const profile = profileResponse.data ?? {};
      const fullName = profile.fullName?.trim() ?? "";
      const email = profile.email?.trim() ?? "";
      const phone = profile.phone?.trim() ?? "";
      const backendAddresses = addressResponse?.data ?? [];
      const addresses = parseAddresses(profile, backendAddresses);

      if (!fullName || !email || !phone || addresses.length === 0) {
        toast.info(
          "Bạn chưa có thông tin nhận hàng. Hãy cập nhật hồ sơ trước khi đặt hàng.",
        );
        navigate("/profile?from=cart");
        return;
      }

      const defaultAddress =
        addresses.find((address) => Boolean(address.isDefault)) ??
        addresses[0] ??
        null;

      setCheckoutProfile({ fullName, email, phone });
      setCheckoutAddresses(addresses);
      setSelectedCheckoutAddress(defaultAddress);
      setShowCheckoutModal(true);
    } catch (error) {
      console.error("Failed to load profile for checkout", error);
      toast.error("Không thể tải thông tin cá nhân. Vui lòng thử lại.");
      navigate("/profile?from=cart");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleConfirmCheckout = () => {
    const nextAddressId =
      selectedCheckoutAddress?.id != null ? selectedCheckoutAddress.id : null;
    const fullAddress =
      formatFullAddress(selectedCheckoutAddress) ||
      selectedCheckoutAddress?.address ||
      "";

    navigate("/checkout", {
      state: {
        profile: checkoutProfile,
        address: fullAddress,
        addressId: nextAddressId,
        shippingRecipient: {
          fullName:
            selectedCheckoutAddress?.receiverName?.trim() ||
            checkoutProfile?.fullName ||
            "",
          phone: selectedCheckoutAddress?.phone?.trim() || "",
          address: fullAddress,
        },
        items: selectedItems,
        subtotal,
        discountAmount,
        total,
        voucher: selectedVoucher,
      },
    });
    setShowCheckoutModal(false);
  };

  const selectedItems = items.filter((item, index) =>
    selectedItemIds.includes(getItemIdentity(item, index)),
  );

  // Tính tổng tiền an toàn: Tận dụng biến subtotal có sẵn của Backend
  const subtotal = selectedItems.reduce((sum, item) => {
    const itemTotal =
      item?.subtotal ?? (item?.price ?? 0) * (item?.quantity ?? 1);
    return sum + itemTotal;
  }, 0);

  const discountAmount = Math.round((subtotal * discount) / 100);
  const total = subtotal - discountAmount;

  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-10">
      <h1 className="font-serif text-3xl font-bold text-primary mb-6">
        Giỏ hàng của bạn
      </h1>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-24 rounded-3xl bg-surface-container-high animate-pulse"
            ></div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-outline-variant/30 bg-surface-container-low p-10 text-center">
          <p className="text-on-surface-variant">
            Giỏ hàng trống. Hãy thêm sách yêu thích vào giỏ nhé.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1.75fr_0.75fr] gap-6 xl:gap-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 shadow-sm">
              <label className="flex items-center gap-3 text-sm font-medium text-on-surface">
                <input
                  type="checkbox"
                  checked={
                    items.length > 0 &&
                    items.every((item, index) =>
                      selectedItemIds.includes(getItemIdentity(item, index)),
                    )
                  }
                  onChange={toggleSelectAll}
                  className="h-5 w-5 rounded border-outline-variant/50 text-primary focus:ring-primary"
                />
                <span>Chọn tất cả ({items.length})</span>
              </label>
              <span className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">
                Chỉ sản phẩm được chọn mới mua
              </span>
            </div>

            {items.map((item, index) => {
              const itemId = getItemIdentity(item, index);
              const isSelected = selectedItemIds.includes(itemId);

              return (
                <div
                  key={itemId}
                  className="rounded-3xl border border-outline-variant/30 bg-surface-container-low p-6 flex flex-col md:flex-row gap-6"
                >
                  <div className="flex items-start pt-2 md:pt-0">
                    <label className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/20 bg-surface-container-high shadow-sm transition hover:border-primary hover:shadow-md">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItemSelection(itemId)}
                        className="h-4 w-4 rounded border-outline-variant/50 text-primary focus:ring-primary"
                      />
                    </label>
                  </div>
                  <img
                    src={getCoverUrl(
                      item?.coverImage ??
                        item?.book?.coverImage ??
                        (item as { book?: { cover?: string } })?.book?.cover ??
                        (item as { cover?: string })?.cover,
                    )}
                    alt={item?.title ?? "Sách không xác định"}
                    className="w-full md:w-32 h-40 object-contain rounded-xl bg-surface shadow-sm"
                    onError={(e) => {
                      e.currentTarget.src = "/images/placeholder-book.png";
                    }}
                  />
                  <div className="min-w-0 flex-1 break-words">
                    <h2 className="font-serif text-xl font-bold text-primary mb-2">
                      {item?.title ?? "Sách không xác định"}
                    </h2>

                    <p className="text-sm text-on-surface-variant mb-2">
                      {item?.author ?? "Tác giả chưa cập nhật"}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-on-surface-variant mb-4">
                      <p className="break-words">
                        <span className="font-medium">Thể loại:</span>{" "}
                        {item?.category ?? "Chưa cập nhật"}
                      </p>
                      <p className="break-words">
                        <span className="font-medium">NXB:</span>{" "}
                        {item?.publisher ?? "Chưa cập nhật"}
                      </p>
                      <p className="break-words">
                        <span className="font-medium">Tình trạng:</span>{" "}
                        {item?.stockQuantity > 0 ? (
                          <span className="text-green-800 font-medium">
                            Còn hàng
                            {/* ({item.stockQuantity}) */}
                          </span>
                        ) : (
                          <span className="text-error font-medium">
                            Hết hàng
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-on-surface">
                      <button
                        onClick={() =>
                          handleQuantityChange(
                            item?.itemId,
                            (item?.quantity ?? 1) - 1,
                          )
                        }
                        className="px-3 py-2 rounded-xl border border-outline-variant/30 hover:border-primary transition"
                      >
                        -
                      </button>
                      <span className="px-3 py-2 rounded-xl bg-surface text-on-surface">
                        {item?.quantity ?? 1}
                      </span>
                      <button
                        onClick={() =>
                          handleQuantityChange(
                            item?.itemId,
                            (item?.quantity ?? 1) + 1,
                          )
                        }
                        className="px-3 py-2 rounded-xl border border-outline-variant/30 hover:border-primary transition"
                      >
                        +
                      </button>
                      <button
                        onClick={() => handleRemoveItem(item?.itemId)}
                        className="px-3 py-2 rounded-xl text-error border border-error/20 hover:bg-error/10 transition"
                      >
                        Xóa
                      </button>
                    </div>
                    <p className="mt-4 text-lg font-semibold text-primary">
                      {(
                        item?.subtotal ??
                        (item?.price ?? 0) * (item?.quantity ?? 1)
                      ).toLocaleString("vi-VN")}
                      đ
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-3xl border border-outline-variant/30 bg-surface-container-low p-4 sm:p-5 lg:p-6 space-y-5 lg:space-y-6 max-w-[360px] xl:justify-self-end w-full">
            <div>
              <h2 className="text-xl font-bold text-primary mb-3">
                Tóm tắt đơn hàng
              </h2>
              <p className="text-sm text-on-surface-variant mb-3">
                Đã chọn {selectedItems.length}/{items.length} sản phẩm
              </p>
              <div className="flex justify-between text-sm text-on-surface-variant mb-2">
                <span>Tạm tính</span>
                <span>{subtotal.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex justify-between text-sm text-on-surface-variant mb-2">
                <span>Giảm giá</span>
                <span>{discountAmount.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex justify-between font-semibold text-on-surface mb-4">
                <span>Tổng</span>
                <span>{total.toLocaleString("vi-VN")}đ</span>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium text-on-surface-variant">
                Mã giảm giá
              </label>
              <div className="flex gap-3">
                <select
                  value={selectedVoucher}
                  onChange={(event) => setSelectedVoucher(event.target.value)}
                  className="flex-1 rounded-2xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-on-surface shadow-sm"
                >
                  <option value="">Chọn mã</option>
                  {vouchers.map((voucher) => {
                    const expired = isVoucherExpired(voucher);

                    return (
                      <option
                        key={voucher.code}
                        value={voucher.code}
                        disabled={expired}
                        className={
                          expired
                            ? "bg-surface-variant text-on-surface-variant"
                            : ""
                        }
                      >
                        {voucher.code}
                        {expired ? " (Đã hết hạn)" : ""}
                      </option>
                    );
                  })}
                </select>
                <button
                  onClick={handleApplyVoucher}
                  className="rounded-2xl bg-primary text-on-primary px-4 py-3 font-semibold hover:bg-primary-container transition"
                >
                  Áp dụng
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleBuyNow()}
              disabled={checkoutLoading || selectedItems.length === 0}
              className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-on-primary hover:bg-primary-container transition-colors disabled:opacity-60"
            >
              {checkoutLoading ? "Đang kiểm tra..." : "Mua hàng"}
            </button>
          </div>
        </div>
      )}

      {showCheckoutModal && checkoutProfile ? (
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
                      ? `${selectedCheckoutAddress.id ?? "null"}::${checkoutAddresses.findIndex(
                          (address) => address === selectedCheckoutAddress,
                        )}`
                      : ""
                  }
                  onChange={(event) => {
                    const selectedValue = event.target.value;
                    const index = Number(selectedValue.split("::")[1]);
                    const nextAddress = checkoutAddresses[index] ?? null;
                    setSelectedCheckoutAddress(nextAddress ?? null);
                  }}
                  className="w-full rounded-2xl border border-outline-variant/30 bg-surface px-4 py-3 text-on-surface"
                >
                  {checkoutAddresses.map((address, index) => {
                    const optionValue = `${address.id ?? "null"}::${index}`;
                    const label = [
                      address.address,
                      address.receiverName ? `• ${address.receiverName}` : "",
                      address.phone ? `• ${address.phone}` : "",
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
                    selectedCheckoutAddress?.address ||
                    "-"}
                </p>
              </div>

              <div className="rounded-2xl bg-surface-container-low p-4">
                <p className="mb-3 text-sm font-semibold text-on-surface">
                  Sản phẩm trong đơn hàng
                </p>
                <div className="space-y-2">
                  {selectedItems.map((item, index) => (
                    <div
                      key={item?.itemId ?? `checkout-item-${index}`}
                      className="flex items-center justify-between text-sm text-on-surface-variant"
                    >
                      <span>
                        {item?.title ?? "Sản phẩm"} x {item?.quantity ?? 1}
                      </span>
                      <span>
                        {(
                          item?.subtotal ??
                          (item?.price ?? 0) * (item?.quantity ?? 1)
                        ).toLocaleString("vi-VN")}
                        đ
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-surface-container-low p-4 space-y-2 text-sm">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Tạm tính</span>
                  <span>{subtotal.toLocaleString("vi-VN")}đ</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Giảm giá</span>
                  <span>{discountAmount.toLocaleString("vi-VN")}đ</span>
                </div>
                <div className="flex justify-between font-semibold text-on-surface">
                  <span>Tổng thanh toán</span>
                  <span>{total.toLocaleString("vi-VN")}đ</span>
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
    </div>
  );
}
