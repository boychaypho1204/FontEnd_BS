import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function buildImageUrl(path?: string) {
  if (!path) return "";

  const normalizedPath = String(path).trim();
  if (!normalizedPath) return "";
  if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;
  if (normalizedPath.startsWith("/")) return normalizedPath;

  const rawBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  const baseUrl = rawBase.replace(/\/api\/?$/, "").replace(/\/$/, "");
  const cleanPath = normalizedPath.replace(/^\/+/, "");

  if (cleanPath.startsWith("uploads/")) {
    return `${baseUrl}/${cleanPath}`;
  }

  return `${baseUrl}/uploads/${cleanPath}`;
}
import {
  createUserAddress,
  getMyOrders,
  getOrderDetail,
  getUserProfile,
  getUserAddresses,
  setDefaultUserAddress,
  updateUserProfile,
  type UserAddress,
} from "../services/userService";
import { cancelOrder } from "../services/orderService";
import type { Order } from "../types";

const statusLabel: Record<string, string> = {
  processing: "Đang chờ",
  completed: "Đã hoàn thành",
  cancelled: "Đã hủy",
  pending: "Đang chờ",
  shipped: "Đang giao",
  failed: "Thanh toán thất bại",
  delivered: "Đã giao hàng",
  confirmed: "Đã xác nhận",
  paid: "Đã thanh toán",
  PENDING: "Đang chờ",
  DELIVERED: "Đã giao hàng",
  CONFIRMED: "Đã xác nhận",
  PAID: "Đã thanh toán",
};

const getPaymentMethodStyle = (method?: string) => {
  const normalized = String(method ?? "").toUpperCase();
  if (normalized === "VNPAY") {
    return "bg-blue-100 text-blue-800 border-blue-300";
  }
  if (normalized === "COD" || normalized === "CASH") {
    return "bg-green-100 text-green-800 border-green-300";
  }
  return "bg-gray-100 text-gray-800 border-gray-300";
};

const getPaymentMethodLabel = (method?: string) => {
  const normalized = String(method ?? "").toUpperCase();
  if (normalized === "VNPAY") {
    return "Thanh toán trực tuyến (VNPAY)";
  }
  if (normalized === "COD" || normalized === "CASH") {
    return "Thanh toán khi nhận hàng (COD)";
  }
  return method || "Chưa cập nhật";
};

function normalizeOrderDetail(rawOrder: any, fallbackOrder?: Order): Order {
  const source = rawOrder?.data ?? rawOrder;
  const itemsSource = Array.isArray(source?.items)
    ? source.items
    : Array.isArray(source?.orderItems)
      ? source.orderItems
      : Array.isArray(source?.details)
        ? source.details
        : Array.isArray(source?.orderDetails)
          ? source.orderDetails
          : [];

  const normalizedItems = itemsSource.map((item: any, index: number) => {
    const bookSource =
      item?.book ?? item?.bookInfo ?? item?.product ?? item?.productInfo ?? {};
    const unitPrice = Number(
      item?.unitPrice ??
        item?.price ??
        item?.bookPrice ??
        item?.subtotal / Math.max(Number(item?.quantity ?? 1), 1) ??
        bookSource?.price ??
        0,
    );
    const quantity = Number(item?.quantity ?? item?.qty ?? 1);
    const totalPrice = Number(
      item?.subtotal ?? item?.totalPrice ?? item?.total ?? unitPrice * quantity,
    );

    return {
      id:
        item?.detailId ??
        item?.id ??
        `${source?.id ?? fallbackOrder?.id ?? "order"}-item-${index}`,
      bookId: item?.bookId ?? bookSource?.id ?? bookSource?.bookId ?? "",
      book: {
        id: bookSource?.id ?? bookSource?.bookId ?? "",
        bookId: bookSource?.bookId ?? bookSource?.id ?? "",
        title:
          item?.title ??
          item?.bookTitle ??
          item?.productName ??
          bookSource?.title ??
          bookSource?.name ??
          "Sản phẩm",
        author:
          item?.author ??
          item?.authorName ??
          item?.bookAuthor ??
          item?.writer ??
          item?.creator ??
          item?.authors?.[0]?.name ??
          item?.authors?.[0]?.authorName ??
          item?.publisher?.name ??
          bookSource?.author ??
          bookSource?.authorName ??
          bookSource?.bookAuthor ??
          bookSource?.writer ??
          bookSource?.creator ??
          bookSource?.authors?.[0]?.name ??
          bookSource?.authors?.[0]?.authorName ??
          bookSource?.publisher?.name ??
          "Không rõ",
        price: unitPrice,
        coverImage:
          item?.coverImage ??
          bookSource?.coverImage ??
          bookSource?.imageUrl ??
          "",
      },
      quantity,
      unitPrice,
      totalPrice,
    } as Order["items"][number];
  });

  return {
    ...(fallbackOrder ?? {}),
    id: source?.id ?? source?.orderId ?? fallbackOrder?.id ?? "",
    orderId: source?.orderId ?? source?.id ?? fallbackOrder?.orderId,
    orderNumber:
      source?.orderNumber ?? source?.orderId ?? fallbackOrder?.orderNumber,
    date:
      source?.date ??
      source?.createdAt ??
      source?.orderedAt ??
      fallbackOrder?.date ??
      fallbackOrder?.createdAt ??
      "",
    createdAt:
      source?.createdAt ??
      source?.date ??
      source?.orderedAt ??
      fallbackOrder?.createdAt ??
      fallbackOrder?.date ??
      "",
    totalAmount: Number(
      source?.totalAmount ??
        source?.itemsTotal ??
        source?.totalPrice ??
        source?.total ??
        fallbackOrder?.totalAmount ??
        fallbackOrder?.total ??
        0,
    ),
    shippingFee: Number(source?.shippingFee ?? fallbackOrder?.shippingFee ?? 0),
    discountAmount: Number(source?.discountAmount ?? 0),
    itemsTotal: Number(source?.itemsTotal ?? 0),
    paymentMethod: source?.paymentMethod ?? fallbackOrder?.paymentMethod,
    paymentStatus: source?.paymentStatus ?? fallbackOrder?.paymentStatus,
    status: source?.status ?? fallbackOrder?.status ?? "pending",
    items: normalizedItems,
    shippingAddress: source?.shippingAddress ?? fallbackOrder?.shippingAddress,
    billingAddress: source?.billingAddress ?? fallbackOrder?.billingAddress,
    customer: source?.customer ?? fallbackOrder?.customer,
  };
}

export default function UserProfile() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"profile" | "orders">("profile");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profileSnapshot, setProfileSnapshot] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  const [newAddress, setNewAddress] = useState<UserAddress>({
    receiverName: "",
    phone: "",
    province: "",
    district: "",
    ward: "",
    detailAddress: "",
    isDefault: false,
  });
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<
    string | number | null
  >(null);

  const parseAddresses = (profile: any) => {
    if (Array.isArray(profile?.addresses) && profile.addresses.length > 0) {
      return profile.addresses.map((item: any) => ({
        addressId: item?.addressId ?? item?.id ?? item?.address_id,
        receiverName: item?.receiverName ?? item?.fullName ?? "",
        phone: item?.phone ?? "",
        province: item?.province ?? "",
        district: item?.district ?? "",
        ward: item?.ward ?? "",
        detailAddress:
          item?.detailAddress ?? item?.addressLine ?? item?.street ?? "",
        isDefault: Boolean(item?.isDefault ?? item?.default ?? false),
      }));
    }

    if (typeof profile?.address === "string" && profile.address.trim()) {
      return [
        {
          receiverName: fullName || "",
          phone: phone || "",
          province: "",
          district: "",
          ward: "",
          detailAddress: profile.address,
          isDefault: true,
        },
      ];
    }

    return [];
  };

  useEffect(() => {
    const loadProfile = async () => {
      setLoadingProfile(true);
      try {
        const response = await getUserProfile();
        const profile = response.data;

        if (profile) {
          const nextProfile = {
            fullName: profile.fullName ?? "",
            email: profile.email ?? "",
            phone: profile.phone ?? "",
          };

          setFullName(nextProfile.fullName);
          setEmail(nextProfile.email);
          setPhone(nextProfile.phone);
          setProfileSnapshot(nextProfile);
          setAddresses(parseAddresses(profile));
        }
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải thông tin cá nhân.");
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    if (activeTab !== "orders") {
      return;
    }

    const loadOrders = async () => {
      setLoadingOrders(true);
      try {
        const response = await getMyOrders();
        const orderData = Array.isArray(response.data)
          ? response.data
          : (response.data?.data ?? response.data?.content ?? []);
        setOrders(orderData);
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải lịch sử đơn hàng.");
      } finally {
        setLoadingOrders(false);
      }
    };

    loadOrders();
  }, [activeTab]);

  const totalOrders = useMemo(() => orders.length, [orders]);

  const canCancelOrder = (order: Order | null | undefined) => {
    const status = String(order?.status ?? "")
      .trim()
      .toUpperCase();
    return (
      status === "PENDING" ||
      status === "PROCESSING" ||
      status === "CREATED" ||
      status === "NEW"
    );
  };

  const handleCancelOrder = async (order: Order) => {
    const orderId = order.id ?? order.orderId ?? order.orderNumber;
    if (!orderId) return;

    setCancellingOrderId(orderId);
    try {
      const response = await cancelOrder(orderId);
      const updatedOrder = response.data ?? response;
      const nextStatus = updatedOrder?.status ?? "CANCELLED";

      setOrders((current) =>
        current.map((item) => {
          const currentId = item.id ?? item.orderId ?? item.orderNumber ?? "";
          const targetId = order.id ?? order.orderId ?? order.orderNumber ?? "";
          return currentId === targetId
            ? { ...item, status: nextStatus }
            : item;
        }),
      );

      setSelectedOrder((current) =>
        current &&
        (current.id ?? current.orderId ?? current.orderNumber ?? "") ===
          (order.id ?? order.orderId ?? order.orderNumber ?? "")
          ? { ...current, status: nextStatus }
          : current,
      );

      toast.success("Đã hủy đơn hàng thành công.");
    } catch (error: any) {
      console.error(error);
      const message =
        error?.message ??
        error?.response?.data?.message ??
        "Không thể hủy đơn hàng. Chỉ các đơn đang chờ xác nhận mới có thể hủy.";
      toast.error(message);
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleViewOrderDetail = async (order: Order) => {
    setLoadingOrderDetail(true);
    try {
      const response = await getOrderDetail(
        order.id ?? order.orderId ?? order.orderNumber ?? "",
      );
      setSelectedOrder(normalizeOrderDetail(response.data ?? response, order));
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải chi tiết đơn hàng.");
      setSelectedOrder({ ...order, items: order.items ?? [] });
    } finally {
      setLoadingOrderDetail(false);
    }
  };

  const detailOrder = selectedOrder as
    | (Order & {
        discountAmount?: number;
        itemsTotal?: number;
        shippingFee?: number;
        createdAt?: string;
        voucherCode?: string;
        addressId?: number | string;
      })
    | null;

  const handleSetDefaultAddress = async (
    addressItem: UserAddress,
    index: number,
  ) => {
    if (!addressItem.addressId) {
      setAddresses((current) =>
        current.map((item, itemIndex) => ({
          ...item,
          isDefault: itemIndex === index,
        })),
      );
      return;
    }

    try {
      await setDefaultUserAddress(addressItem.addressId);
      setAddresses((current) =>
        current.map((item, itemIndex) => ({
          ...item,
          isDefault: itemIndex === index,
        })),
      );
      toast.success("Đã đặt địa chỉ mặc định giao hàng.");
    } catch (error) {
      console.error(error);
      toast.error("Không thể cập nhật địa chỉ mặc định.");
    }
  };

  const normalizeAddressForSave = (item: UserAddress) => ({
    ...item,
    receiverName: String(item.receiverName ?? "").trim(),
    phone: String(item.phone ?? "").trim(),
    province: String(item.province ?? "").trim(),
    district: String(item.district ?? "").trim(),
    ward: String(item.ward ?? "").trim(),
    detailAddress: String(item.detailAddress ?? "").trim(),
  });

  const buildAddressIdentity = (item: UserAddress) => {
    const parts = [
      item.addressId ?? "",
      item.receiverName ?? "",
      item.phone ?? "",
      item.province ?? "",
      item.district ?? "",
      item.ward ?? "",
      item.detailAddress ?? "",
    ];
    return parts.join("::").trim();
  };

  const buildAddressSignature = (item: UserAddress) => {
    const normalized = normalizeAddressForSave(item);
    const parts = [
      normalized.receiverName ?? "",
      normalized.phone ?? "",
      normalized.province ?? "",
      normalized.district ?? "",
      normalized.ward ?? "",
      normalized.detailAddress ?? "",
    ];
    return parts.join("||").trim().toLowerCase();
  };

  const mergeAddresses = (source: UserAddress[], additions: UserAddress[]) => {
    const merged: UserAddress[] = [];
    const seen = new Set<string>();

    for (const item of [...source, ...additions]) {
      const normalized = normalizeAddressForSave(item);
      const identity = buildAddressIdentity(normalized);
      if (!identity) {
        continue;
      }
      if (seen.has(identity)) {
        continue;
      }
      seen.add(identity);
      merged.push(normalized);
    }

    return merged;
  };

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedFullName || !trimmedEmail || !trimmedPhone) {
      toast.error("Vui lòng điền đầy đủ họ tên, email và số điện thoại.");
      return;
    }

    setSaving(true);
    try {
      const profilePayload: Record<string, string> = {};

      if (trimmedFullName !== profileSnapshot.fullName) {
        profilePayload.fullName = trimmedFullName;
      }
      if (trimmedEmail !== profileSnapshot.email) {
        profilePayload.email = trimmedEmail;
      }
      if (trimmedPhone !== profileSnapshot.phone) {
        profilePayload.phone = trimmedPhone;
      }

      if (Object.keys(profilePayload).length === 0) {
        toast.info("Thông tin cá nhân chưa thay đổi.");
        return;
      }

      const response = await updateUserProfile(profilePayload);
      const updatedProfile = response.data;

      if (updatedProfile) {
        const nextProfile = {
          fullName: updatedProfile.fullName ?? trimmedFullName,
          email: updatedProfile.email ?? trimmedEmail,
          phone: updatedProfile.phone ?? trimmedPhone,
        };

        setFullName(nextProfile.fullName);
        setEmail(nextProfile.email);
        setPhone(nextProfile.phone);
        setProfileSnapshot(nextProfile);
      }

      const returnToCart =
        new URLSearchParams(location.search).get("from") === "cart";
      if (returnToCart) {
        navigate("/cart", { replace: true });
        return;
      }

      toast.success("Cập nhật thông tin cá nhân thành công.");
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Cập nhật thông tin cá nhân thất bại.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const receiverName = newAddress.receiverName?.trim() || fullName.trim();
    const phoneValue = newAddress.phone?.trim() || phone.trim();
    const province = newAddress.province?.trim() || "";
    const district = newAddress.district?.trim() || "";
    const ward = newAddress.ward?.trim() || "";
    const detailAddress = newAddress.detailAddress?.trim() || "";

    if (
      !receiverName ||
      !phoneValue ||
      !province ||
      !district ||
      !ward ||
      !detailAddress
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin địa chỉ nhận hàng.");
      return;
    }

    try {
      const createdResponse = await createUserAddress({
        receiverName,
        phone: phoneValue,
        province,
        district,
        ward,
        detailAddress,
        isDefault:
          addresses.length === 0 || !addresses.some((item) => item.isDefault),
      });

      const createdAddress = createdResponse.data ?? createdResponse;
      const normalizedAddress: UserAddress = {
        addressId:
          createdAddress?.addressId ??
          createdAddress?.id ??
          createdAddress?.address_id,
        receiverName: createdAddress?.receiverName ?? receiverName,
        phone: createdAddress?.phone ?? phoneValue,
        province: createdAddress?.province ?? province,
        district: createdAddress?.district ?? district,
        ward: createdAddress?.ward ?? ward,
        detailAddress: createdAddress?.detailAddress ?? detailAddress,
        isDefault:
          Boolean(createdAddress?.isDefault) ||
          (!addresses.some((item) => item.isDefault) && addresses.length === 0),
      };

      setAddresses((current) => {
        const next = [...current, normalizedAddress];
        if (!next.some((item) => item.isDefault)) {
          next[0].isDefault = true;
        }
        return next;
      });

      setNewAddress({
        receiverName: "",
        phone: "",
        province: "",
        district: "",
        ward: "",
        detailAddress: "",
        isDefault: false,
      });

      toast.success("Đã lưu địa chỉ nhận hàng thành công.");
    } catch (error) {
      console.error(error);
      toast.error("Lưu địa chỉ nhận hàng thất bại.");
    }
  };

  return (
    <div className="max-w-[980px] mx-auto px-4 md:px-10 py-10">
      <h1 className="text-3xl font-bold text-primary mb-6">
        Tài khoản của tôi
      </h1>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex flex-wrap gap-2 bg-surface rounded-xl border border-outline-variant p-2 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`rounded-3xl px-5 py-3 text-sm font-semibold transition ${
              activeTab === "profile"
                ? "bg-primary text-on-primary"
                : "bg-surface text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Thông tin cá nhân
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`rounded-3xl px-5 py-3 text-sm font-semibold transition ${
              activeTab === "orders"
                ? "bg-primary text-on-primary"
                : "bg-surface text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Lịch sử đơn hàng
          </button>
        </div>
        <div className="text-sm text-on-surface-variant">
          Tổng đơn hàng:{" "}
          <span className="font-semibold text-on-surface">{totalOrders}</span>
        </div>
      </div>

      {activeTab === "profile" ? (
        <div className="space-y-6">
          <form
            onSubmit={handleSaveProfile}
            className="space-y-6 bg-surface-container-low rounded-3xl border border-outline-variant/30 p-6"
          >
            <div className="grid gap-6 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-on-surface">
                  Họ và tên
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="w-full rounded-3xl border border-outline p-4 bg-surface text-on-surface"
                  placeholder="Nguyễn Văn A"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-on-surface">
                  Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-3xl border border-outline p-4 bg-surface text-on-surface"
                  placeholder="example@gmail.com"
                />
              </label>
            </div>

            <label className="space-y-2 block">
              <span className="text-sm font-semibold text-on-surface">
                Số điện thoại
              </span>
              <input
                type="text"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full rounded-3xl border border-outline p-4 bg-surface text-on-surface"
                placeholder="0912xxxxxx"
              />
            </label>

            <button
              type="submit"
              disabled={saving || loadingProfile}
              className="rounded-3xl bg-primary text-on-primary px-6 py-4 font-bold hover:bg-primary-container transition disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : "Lưu thông tin"}
            </button>
          </form>

          <div className="rounded-3xl border border-outline p-5 bg-surface">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-on-surface">
                Thêm địa chỉ nhận hàng
              </h2>
              <p className="text-sm text-on-surface-variant mt-1">
                Địa chỉ mới sẽ được lưu vào bảng addresses khi bạn nhấn lưu địa
                chỉ.
              </p>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm text-on-surface">
                    Tên người nhận
                  </span>
                  <input
                    type="text"
                    value={newAddress.receiverName ?? ""}
                    onChange={(event) =>
                      setNewAddress((current) => ({
                        ...current,
                        receiverName: event.target.value,
                      }))
                    }
                    className="w-full rounded-3xl border border-outline p-4 bg-surface text-on-surface"
                    placeholder="Nguyễn Văn A"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-on-surface">Số điện thoại</span>
                  <input
                    type="text"
                    value={newAddress.phone ?? ""}
                    onChange={(event) =>
                      setNewAddress((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    className="w-full rounded-3xl border border-outline p-4 bg-surface text-on-surface"
                    placeholder="0912xxxxxx"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-on-surface">
                    Tỉnh/Thành phố
                  </span>
                  <input
                    type="text"
                    value={newAddress.province ?? ""}
                    onChange={(event) =>
                      setNewAddress((current) => ({
                        ...current,
                        province: event.target.value,
                      }))
                    }
                    className="w-full rounded-3xl border border-outline p-4 bg-surface text-on-surface"
                    placeholder="Hà Nội"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-on-surface">Quận/Huyện</span>
                  <input
                    type="text"
                    value={newAddress.district ?? ""}
                    onChange={(event) =>
                      setNewAddress((current) => ({
                        ...current,
                        district: event.target.value,
                      }))
                    }
                    className="w-full rounded-3xl border border-outline p-4 bg-surface text-on-surface"
                    placeholder="Cầu Giấy"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-on-surface">Phường/Xã</span>
                  <input
                    type="text"
                    value={newAddress.ward ?? ""}
                    onChange={(event) =>
                      setNewAddress((current) => ({
                        ...current,
                        ward: event.target.value,
                      }))
                    }
                    className="w-full rounded-3xl border border-outline p-4 bg-surface text-on-surface"
                    placeholder="Dịch Vọng"
                  />
                </label>
                <label className="md:col-span-2 space-y-2">
                  <span className="text-sm text-on-surface">
                    Địa chỉ cụ thể
                  </span>
                  <input
                    type="text"
                    value={newAddress.detailAddress ?? ""}
                    onChange={(event) =>
                      setNewAddress((current) => ({
                        ...current,
                        detailAddress: event.target.value,
                      }))
                    }
                    className="w-full rounded-3xl border border-outline p-4 bg-surface text-on-surface"
                    placeholder="Số 123, đường ABC"
                  />
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-3xl bg-primary text-on-primary px-5 py-3 font-semibold hover:bg-primary-container transition"
                >
                  Lưu địa chỉ
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-3xl border border-outline p-5 bg-surface">
            <h3 className="text-lg font-semibold text-on-surface mb-4">
              Địa chỉ đã lưu
            </h3>
            {addresses.length === 0 ? (
              <p className="text-sm text-on-surface-variant">
                Chưa có địa chỉ nào được lưu.
              </p>
            ) : (
              <div className="space-y-3">
                {addresses.map((addressItem, index) => (
                  <div
                    key={`saved-address-${addressItem.addressId ?? index}`}
                    className="rounded-3xl border border-outline p-4 bg-surface-container-low"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-on-surface">
                          {addressItem.receiverName || "Người nhận"}
                        </p>
                        <p className="text-sm text-on-surface-variant">
                          {addressItem.phone}
                        </p>
                        <p className="text-sm text-on-surface-variant mt-1">
                          {[
                            addressItem.province,
                            addressItem.district,
                            addressItem.ward,
                            addressItem.detailAddress,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            void handleSetDefaultAddress(addressItem, index)
                          }
                          className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                            addressItem.isDefault
                              ? "bg-primary text-on-primary"
                              : "border border-outline text-on-surface hover:bg-primary/10"
                          }`}
                        >
                          {addressItem.isDefault ? "Mặc định" : "Đặt mặc định"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddresses((current) => {
                              const next = current.filter(
                                (_, itemIndex) => itemIndex !== index,
                              );
                              if (
                                next.length > 0 &&
                                !next.some((item) => item.isDefault)
                              ) {
                                next[0].isDefault = true;
                              }
                              return next.length ? next : [];
                            });
                          }}
                          className="rounded-full border border-outline px-3 py-2 text-sm font-semibold text-error hover:bg-error/10 transition"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-3xl bg-surface-container-low border border-outline-variant/30 p-6">
            <h2 className="text-xl font-semibold text-on-surface mb-3">
              Lịch sử đơn hàng
            </h2>
            {loadingOrders ? (
              <p className="text-on-surface-variant">Đang tải...</p>
            ) : !orders.length ? (
              <p className="text-on-surface-variant">
                Bạn chưa có đơn hàng nào.
              </p>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-3xl border border-outline p-4 bg-surface"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm text-on-surface-variant">
                          Mã đơn
                        </p>
                        <p className="font-semibold text-on-surface">
                          #{order.orderNumber ?? order.orderId ?? order.id}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-on-surface-variant">
                          Ngày đặt
                        </p>
                        <p className="font-semibold text-on-surface">
                          {new Date(
                            order.date ?? order.createdAt ?? Date.now(),
                          ).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-on-surface-variant">
                          Tổng tiền
                        </p>
                        <p className="font-semibold text-on-surface">
                          {(
                            order.totalAmount ??
                            order.total ??
                            0
                          ).toLocaleString("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-on-surface-variant">
                          Trạng thái
                        </p>
                        <p className="font-semibold text-primary">
                          {statusLabel[
                            String(order.status ?? "").toUpperCase()
                          ] ??
                            statusLabel[
                              String(order.status ?? "").toLowerCase()
                            ] ??
                            order.status}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
                      {canCancelOrder(order) ? (
                        <button
                          type="button"
                          onClick={() => void handleCancelOrder(order)}
                          disabled={cancellingOrderId != null}
                          className="rounded-full border border-error px-5 py-2 text-sm font-semibold text-error hover:bg-error/10 transition disabled:opacity-60"
                        >
                          {cancellingOrderId != null
                            ? "Đang hủy..."
                            : "Hủy đơn"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleViewOrderDetail(order)}
                        disabled={loadingOrderDetail}
                        className="rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary hover:bg-primary/10 transition disabled:opacity-60"
                      >
                        {loadingOrderDetail ? "Đang tải..." : "Xem chi tiết"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {detailOrder ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/70 p-4">
              <div className="w-full max-w-2xl max-h-[calc(100dvh-32px)] overflow-y-auto break-words rounded-xl border border-outline-variant bg-surface p-5 sm:p-6 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-primary">
                      Chi tiết đơn hàng
                    </h3>
                    <p className="text-sm text-on-surface-variant">
                      Mã đơn #
                      {detailOrder.orderNumber ??
                        detailOrder.orderId ??
                        detailOrder.id}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {canCancelOrder(detailOrder) ? (
                      <button
                        type="button"
                        onClick={() => void handleCancelOrder(detailOrder)}
                        disabled={cancellingOrderId != null}
                        className="rounded-full border border-error px-4 py-2 text-sm font-semibold text-error hover:bg-error/10 transition disabled:opacity-60"
                      >
                        {cancellingOrderId != null ? "Đang hủy..." : "Hủy đơn"}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(null)}
                      className="text-on-surface-variant hover:text-on-surface"
                    >
                      Đóng
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-outline p-4 bg-surface-container-low">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-on-surface-variant">
                          Mã đơn
                        </p>
                        <p className="font-semibold text-on-surface">
                          #
                          {detailOrder.orderNumber ??
                            detailOrder.orderId ??
                            detailOrder.id}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-on-surface-variant">
                          Ngày đặt
                        </p>
                        <p className="font-semibold text-on-surface">
                          {new Date(
                            detailOrder.createdAt ??
                              detailOrder.date ??
                              Date.now(),
                          ).toLocaleString("vi-VN")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-on-surface-variant">
                          Trạng thái
                        </p>
                        <p className="font-semibold text-on-surface">
                          {statusLabel[
                            String(detailOrder.status ?? "").toUpperCase()
                          ] ??
                            statusLabel[
                              String(detailOrder.status ?? "").toLowerCase()
                            ] ??
                            detailOrder.status}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-on-surface-variant">
                          Thanh toán
                        </p>
                        <p className="font-semibold text-on-surface">
                          {detailOrder.paymentStatus ?? "Chưa cập nhật"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-on-surface-variant">
                          Phương thức
                        </p>
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold border ${getPaymentMethodStyle(detailOrder.paymentMethod)}`}
                        >
                          {getPaymentMethodLabel(detailOrder.paymentMethod)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-on-surface-variant">
                          Tổng tiền hàng
                        </p>
                        <p className="font-semibold text-on-surface">
                          {(
                            detailOrder.itemsTotal ??
                            detailOrder.totalAmount ??
                            0
                          ).toLocaleString("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-on-surface-variant">
                          Giảm giá
                        </p>
                        <p className="font-semibold text-on-surface">
                          {(detailOrder.discountAmount ?? 0).toLocaleString(
                            "vi-VN",
                            {
                              style: "currency",
                              currency: "VND",
                            },
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-on-surface-variant">
                          Phí vận chuyển
                        </p>
                        <p className="font-semibold text-on-surface">
                          {(detailOrder.shippingFee ?? 0).toLocaleString(
                            "vi-VN",
                            {
                              style: "currency",
                              currency: "VND",
                            },
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-on-surface-variant">
                          Mã giảm giá
                        </p>
                        <p className="font-semibold text-on-surface">
                          {detailOrder.voucherCode ?? "Không có"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-on-surface-variant">
                          Địa chỉ ID
                        </p>
                        <p className="font-semibold text-on-surface">
                          {detailOrder.addressId ?? "Không có"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {detailOrder.items?.length ? (
                    detailOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-4 rounded-3xl border border-outline p-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="flex items-start gap-3">
                          {item.book?.coverImage ? (
                            <img
                              src={buildImageUrl(item.book.coverImage)}
                              alt={item.book?.title ?? "Sản phẩm"}
                              className="h-16 w-16 rounded-lg object-contain border border-outline-variant"
                              onError={(event) => {
                                const target =
                                  event.currentTarget as HTMLImageElement;
                                target.src =
                                  "https://placehold.co/160x160?text=No+Image";
                              }}
                            />
                          ) : null}
                          <div>
                            <p className="text-lg font-semibold text-on-surface">
                              {item.book?.title ?? "Sản phẩm"}
                            </p>
                            <p className="text-sm text-on-surface-variant">
                              Đơn giá:{" "}
                              {item.unitPrice.toLocaleString("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-on-surface-variant">
                            Số lượng: {item.quantity}
                          </span>
                          <span className="font-semibold text-on-surface">
                            {(
                              item.totalPrice ?? item.unitPrice * item.quantity
                            ).toLocaleString("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            })}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-on-surface-variant">
                      Không có sản phẩm trong đơn hàng này.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
