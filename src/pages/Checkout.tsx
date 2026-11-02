import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createOrder } from "../services/orderService";
import { createVnpayUrl } from "../services/paymentService";
import { getCartItems } from "../services/cartService";
import { createUserAddress, getUserAddresses } from "../services/userService";
import type { CartItem } from "../types";
import { useCart } from "../contexts/CartContext";

export default function Checkout() {
  const location = useLocation();
  const { refreshCartCount } = useCart();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [addressId, setAddressId] = useState<number | string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "VNPAY">("COD");
  const [submitting, setSubmitting] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!fullName || !email || !phone || !address) {
      toast.error("Vui lòng điền đầy đủ thông tin giao hàng.");
      return;
    }

    if (!address.trim()) {
      toast.error("Vui lòng nhập địa chỉ nhận hàng trước khi xác nhận.");
      return;
    }

    if (!cartItems.length) {
      toast.error("Giỏ hàng trống.");
      return;
    }

    const selectedCheckoutItems =
      (location.state as { items?: CartItem[] } | undefined)?.items ??
      cartItems;

    console.log("location.state:", location.state);
    console.log(
      "selectedCheckoutItems from state/cart:",
      selectedCheckoutItems,
    );

    const normalizedItems = selectedCheckoutItems
      .map((item: any) => {
        const bookId =
          item?.bookId ?? item?.book?.bookId ?? item?.book?.id ?? item?.id;
        const quantity = Number(item?.quantity ?? 1);

        if (!bookId || !Number.isFinite(quantity) || quantity <= 0) {
          return null;
        }

        return {
          bookId: String(bookId),
          quantity,
        };
      })
      .filter(Boolean);

    if (!normalizedItems.length) {
      toast.error("Không tìm thấy sản phẩm hợp lệ để tạo đơn hàng.");
      return;
    }

    let finalAddressId =
      typeof addressId === "number"
        ? addressId
        : typeof addressId === "string" && /^\d+$/.test(addressId.trim())
          ? Number(addressId)
          : null;

    if (finalAddressId == null) {
      try {
        const addressResponse = await getUserAddresses();
        const backendAddresses = addressResponse?.data ?? [];
        const fallbackAddress = Array.isArray(backendAddresses)
          ? backendAddresses[0]
          : null;

        if (fallbackAddress?.addressId != null) {
          finalAddressId =
            typeof fallbackAddress.addressId === "number"
              ? fallbackAddress.addressId
              : Number(fallbackAddress.addressId);
          setAddressId(finalAddressId);
        } else {
          const createdAddressResponse = await createUserAddress({
            receiverName: fullName,
            phone,
            province: "N/A",
            district: "N/A",
            ward: "N/A",
            detailAddress: address,
            isDefault: true,
          });

          const createdAddressId = createdAddressResponse?.data?.addressId;
          if (createdAddressId != null) {
            finalAddressId =
              typeof createdAddressId === "number"
                ? createdAddressId
                : Number(createdAddressId);
            setAddressId(finalAddressId);
          }
        }
      } catch (error) {
        console.error(
          "Failed to fetch or create addresses for checkout",
          error,
        );
      }
    }

    if (finalAddressId == null) {
      toast.error("Không thể tạo hoặc tìm thấy địa chỉ nhận hàng hợp lệ.");
      return;
    }

    setSubmitting(true);
    try {
      const orderPayload = {
        ...(finalAddressId != null ? { addressId: finalAddressId } : {}),
        ...(address ? { address } : {}),
        paymentMethod: paymentMethod,
        voucherCode: location.state?.voucher ?? "",
        shippingFee: 30000,
        items: normalizedItems,
        orderItems: normalizedItems,
        bookItems: normalizedItems,
        books: normalizedItems,
      };

      console.log("Creating order with items:", normalizedItems);
      const response = await createOrder(orderPayload);
      const orderId =
        response.data?.orderId ??
        response.data?.id ??
        response.data?.data?.orderId ??
        response.data?.data?.id;

      // try to extract total price from response, fallback to cart calculation
      let totalPrice =
        response.data?.totalPrice ??
        response.data?.totalAmount ??
        response.data?.amount ??
        response.data?.data?.totalPrice ??
        null;

      if (totalPrice == null) {
        totalPrice = cartItems.reduce((s, it: any) => {
          const price =
            Number(
              it?.price ?? it?.unitPrice ?? it?.sellPrice ?? it?.amount ?? 0,
            ) || 0;
          const qty = Number(it?.quantity ?? 1) || 1;
          return s + price * qty;
        }, 0);
      }

      toast.success("Tạo đơn hàng thành công.");

      // Do not delete cart items from the client here.
      // Backend API currently does not expose a valid delete-cart-item endpoint,
      // and attempting to call it causes 404 errors during checkout.
      await refreshCartCount();

      if (paymentMethod === "VNPAY") {
        const payload = {
          amount: Number(totalPrice) || 0,
          orderId: String(orderId ?? ""),
          orderInfo: `Thanh toan don #${orderId}`,
          bankCode: "NCB",
          language: "vn",
        };

        try {
          const vnpayRes = await createVnpayUrl(payload);
          // backend may return the data object or axios response.data; support both
          const payUrl =
            vnpayRes?.paymentUrl ??
            vnpayRes?.url ??
            vnpayRes?.data?.paymentUrl ??
            vnpayRes?.data?.url ??
            null;

          if (payUrl) {
            window.location.href = payUrl;
            return;
          }

          toast.error("Không thể tạo đường dẫn thanh toán");
          return;
        } catch (err: any) {
          console.error("createVnpayUrl failed", err);
          const status = err?.response?.status ?? "?";
          const serverMsg =
            err?.response?.data?.message ??
            err?.response?.data ??
            err?.message ??
            "Không xác định";
          toast.error(
            `Không thể tạo đường dẫn thanh toán (${status}): ${String(serverMsg)}`,
          );
          return;
        }
      }

      navigate("/payment-success");
    } catch (error) {
      console.error("Checkout failed", error);
      toast.error("Thanh toán thất bại, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const prefilledData = location.state as
      | {
          profile?: { fullName?: string; email?: string; phone?: string };
          address?: string;
          addressId?: number | string | null;
          shippingRecipient?: {
            fullName?: string;
            phone?: string;
            address?: string;
          };
        }
      | undefined;

    const recipient = prefilledData?.shippingRecipient;

    if (prefilledData?.profile) {
      setFullName(recipient?.fullName ?? prefilledData.profile.fullName ?? "");
      setEmail(prefilledData.profile.email ?? "");
      setPhone(recipient?.phone ?? prefilledData.profile.phone ?? "");
    }

    const nextAddress = recipient?.address ?? prefilledData?.address ?? "";
    if (nextAddress) {
      setAddress(nextAddress);
      const incomingAddressId = (prefilledData as any).addressId;
      if (typeof incomingAddressId === "number") {
        setAddressId(incomingAddressId);
      } else if (
        typeof incomingAddressId === "string" &&
        /^\d+$/.test(incomingAddressId.trim())
      ) {
        setAddressId(Number(incomingAddressId));
      } else {
        setAddressId(null);
      }
    }

    const loadCart = async () => {
      setLoadingCart(true);
      try {
        const response = await getCartItems();
        const rawCartData =
          response?.data?.data ??
          response?.data?.content ??
          response?.data ??
          [];
        setCartItems(Array.isArray(rawCartData) ? rawCartData : []);
      } catch (error) {
        console.error("Failed to load cart items", error);
        toast.error("Không thể tải giỏ hàng.");
      } finally {
        setLoadingCart(false);
      }
    };

    loadCart();
  }, []);

  return (
    <div className="max-w-[720px] mx-auto px-4 md:px-10 py-10">
      <h1 className="font-serif text-3xl font-bold text-primary mb-6">
        Thanh toán
      </h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-surface rounded-xl border border-outline-variant p-5 sm:p-6 shadow-sm"
      >
        <div>
          <label className="block text-sm font-semibold text-on-surface mb-2">
            Họ và tên
          </label>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full rounded-3xl border border-outline p-4 bg-surface text-on-surface"
            placeholder="Nguyễn Văn A"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-on-surface mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-3xl border border-outline p-4 bg-surface text-on-surface"
            placeholder="example@gmail.com"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-on-surface mb-2">
            Số điện thoại
          </label>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="w-full rounded-3xl border border-outline p-4 bg-surface text-on-surface"
            placeholder="0912xxxxxx"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-on-surface mb-2">
            Địa chỉ giao hàng
          </label>
          <textarea
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            className="w-full rounded-3xl border border-outline p-4 bg-surface text-on-surface"
            rows={4}
            placeholder="Số nhà, đường, quận, thành phố"
          />
        </div>
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-on-surface mb-2">
            Phương thức thanh toán
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 rounded-3xl border border-outline p-4 cursor-pointer">
              <input
                type="radio"
                name="payment"
                value="VNPAY"
                checked={paymentMethod === "VNPAY"}
                onChange={() => setPaymentMethod("VNPAY")}
                className="accent-primary"
              />
              <span>Thanh toán VNPAY</span>
            </label>
            <label className="flex items-center gap-3 rounded-3xl border border-outline p-4 cursor-pointer">
              <input
                type="radio"
                name="payment"
                value="COD"
                checked={paymentMethod === "COD"}
                onChange={() => setPaymentMethod("COD")}
                className="accent-primary"
              />
              <span>Thanh toán khi nhận hàng</span>
            </label>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate("/cart")}
            className="flex-1 rounded-3xl border border-outline px-4 py-4 font-semibold text-on-surface-variant transition hover:border-primary hover:text-primary"
          >
            Trở về
          </button>
          <button
            type="submit"
            disabled={submitting || loadingCart || !cartItems.length}
            className="flex-1 rounded-3xl bg-primary text-on-primary py-4 font-bold hover:bg-primary-container transition disabled:opacity-60"
          >
            {submitting ? "Đang xử lý..." : "Xác nhận đơn hàng"}
          </button>
        </div>
      </form>
    </div>
  );
}
