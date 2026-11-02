import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  Ticket,
  Percent,
  Clock,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  createVoucher,
  deleteVoucher,
  getVouchers,
  updateVoucher,
  type VoucherPayload,
} from "../../services/voucherService";

interface VoucherRow {
  id?: string | number;
  voucherId?: string | number;
  code?: string;
  description?: string;
  discountValue?: number;
  discountType?: string;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  startDate?: string;
  endDate?: string;
  usageLimit?: number;
  usedCount?: number;
  status?: string;
  [key: string]: any;
}

interface VoucherFormState {
  code: string;
  description: string;
  discountType: string;
  discountValue: string;
  minOrderValue: string;
  maxDiscountAmount: string;
  startDate: string;
  endDate: string;
  usageLimit: string;
  status: string;
}

const emptyForm: VoucherFormState = {
  code: "",
  description: "",
  discountType: "PERCENT",
  discountValue: "",
  minOrderValue: "",
  maxDiscountAmount: "",
  startDate: "",
  endDate: "",
  usageLimit: "",
  status: "ACTIVE",
};

const formatDateTimeForInput = (value?: string) => {
  if (!value) {
    return "";
  }

  const normalized = String(value).replace(" ", "T");
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) {
    return normalized;
  }

  return normalized.slice(0, 16);
};

const formatDateTimeForPayload = (value?: string) => {
  if (!value) {
    return "";
  }

  const normalized = String(value).replace(" ", "T");
  if (!normalized.includes(":")) {
    return `${normalized}:00:00`;
  }

  const [datePart, timePart] = normalized.split("T");
  const [hours, minutes] = timePart.split(":");
  return `${datePart}T${hours}:${minutes}:00`;
};

export function VoucherManagement() {
  const [vouchers, setVouchers] = useState<VoucherRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageInfo, setPageInfo] = useState({
    number: 0,
    totalPages: 0,
    totalElements: 0,
    size: 10,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherRow | null>(null);
  const [form, setForm] = useState<VoucherFormState>(emptyForm);

  const fetchVouchers = async (nextPage = page, keyword = search) => {
    setLoading(true);
    try {
      const response = await getVouchers(nextPage, 10, keyword);
      const payload = response.data?.data ?? response.data;
      const content = payload?.content ?? payload?.data ?? [];
      setVouchers(content);
      setPageInfo({
        number: payload?.number ?? nextPage,
        totalPages: payload?.totalPages ?? 0,
        totalElements: payload?.totalElements ?? content.length,
        size: payload?.size ?? 10,
      });
      setPage(payload?.number ?? nextPage);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load vouchers",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers(0, search);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => fetchVouchers(0, search), 400);
    return () => window.clearTimeout(timer);
  }, [search]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingVoucher(null);
    setIsModalOpen(false);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (voucher: VoucherRow) => {
    setEditingVoucher(voucher);
    setForm({
      code: voucher.code ?? "",
      description: voucher.description ?? "",
      discountType: voucher.discountType ?? "PERCENT",
      discountValue: voucher.discountValue?.toString() ?? "",
      minOrderValue: voucher.minOrderValue?.toString() ?? "",
      maxDiscountAmount: voucher.maxDiscountAmount?.toString() ?? "",
      startDate: formatDateTimeForInput(voucher.startDate),
      endDate: formatDateTimeForInput(voucher.endDate),
      usageLimit: voucher.usageLimit?.toString() ?? "",
      status: voucher.status ?? "ACTIVE",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const toOptionalNumber = (value: string) => {
      if (!value.trim()) {
        return undefined;
      }
      return Number(value);
    };

    const payload: VoucherPayload = {
      code: form.code.trim() || undefined,
      description: form.description.trim() || undefined,
      discountType: form.discountType,
      discountValue: toOptionalNumber(form.discountValue),
      minOrderValue: toOptionalNumber(form.minOrderValue),
      maxDiscountAmount: toOptionalNumber(form.maxDiscountAmount),
      usageLimit: toOptionalNumber(form.usageLimit),
      startDate: formatDateTimeForPayload(form.startDate) || undefined,
      endDate: formatDateTimeForPayload(form.endDate) || undefined,
      status: form.status,
    };

    try {
      const targetId = editingVoucher?.id ?? editingVoucher?.voucherId;
      if (targetId) {
        await updateVoucher(targetId, payload);
        toast.success("Voucher updated successfully");
      } else {
        await createVoucher(payload);
        toast.success("Voucher created successfully");
      }
      await fetchVouchers(page, search);
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed");
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!window.confirm("Delete this voucher?")) {
      return;
    }

    try {
      await deleteVoucher(id);
      toast.success("Voucher deleted successfully");
      await fetchVouchers(page, search);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
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

  const summary = useMemo(() => {
    const activeCount = vouchers.filter((voucher) => {
      const status = String(voucher.status ?? "ACTIVE").toUpperCase();
      return status === "ACTIVE";
    }).length;

    const totalUsed = vouchers.reduce((sum, voucher) => {
      const used = Number(voucher.usedCount ?? voucher.timesUsed ?? 0);
      return sum + (Number.isFinite(used) ? used : 0);
    }, 0);

    const totalDiscounted = vouchers.reduce((sum, voucher) => {
      const used = Number(voucher.usedCount ?? voucher.timesUsed ?? 0);
      const discountValue = Number(voucher.discountValue ?? 0);
      if (!Number.isFinite(used) || !Number.isFinite(discountValue)) {
        return sum;
      }

      const discountAmount =
        voucher.discountType === "FIXED"
          ? discountValue * used
          : (discountValue / 100) * used;

      return sum + (Number.isFinite(discountAmount) ? discountAmount : 0);
    }, 0);

    const expiringSoon = vouchers.filter((voucher) => {
      if (!voucher.endDate) {
        return false;
      }

      const endDate = new Date(voucher.endDate);
      if (Number.isNaN(endDate.getTime())) {
        return false;
      }

      const diffDays = Math.ceil(
        (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      return diffDays >= 0 && diffDays <= 7;
    }).length;

    return {
      activeCount,
      totalUsed,
      totalDiscounted,
      expiringSoon,
    };
  }, [vouchers]);

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">
            Voucher Management
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Create and manage discount codes and promotions.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 justify-center transition-colors"
        >
          <Plus size={18} />
          Create Voucher
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-xl border border-outline-variant flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Active Vouchers
            </span>
            <Ticket className="text-primary" size={20} />
          </div>
          <div className="text-3xl font-bold text-on-surface mt-2">
            {summary.activeCount}
          </div>
        </div>
        <div className="bg-surface p-5 rounded-xl border border-outline-variant flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Total Used
            </span>
            <Percent className="text-secondary" size={20} />
          </div>
          <div className="text-3xl font-bold text-on-surface mt-2">
            {summary.totalUsed}
          </div>
        </div>
        <div className="bg-surface p-5 rounded-xl border border-outline-variant flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Total Discounted
            </span>
            <span className="text-tertiary-container font-bold">$</span>
          </div>
          <div className="text-3xl font-bold text-on-surface mt-2">
            {summary.totalDiscounted.toLocaleString("vi-VN")}
          </div>
        </div>
        <div className="bg-surface p-5 rounded-xl border border-outline-variant flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Expiring Soon
            </span>
            <Clock className="text-error" size={20} />
          </div>
          <div className="text-3xl font-bold text-on-surface mt-2">
            {summary.expiringSoon}
          </div>
        </div>
      </div>

      <div className="bg-surface p-4 rounded-xl border border-outline-variant flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"
            size={20}
          />
          <input
            type="text"
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg h-10 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            placeholder="Search voucher codes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-surface-container-low border-b border-outline-variant text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-on-surface divide-y divide-outline-variant">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-sm text-on-surface-variant"
                  >
                    Loading...
                  </td>
                </tr>
              ) : vouchers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-sm text-on-surface-variant"
                  >
                    No vouchers found.
                  </td>
                </tr>
              ) : (
                vouchers.map((voucher) => {
                  const voucherId = voucher.voucherId ?? voucher.id;
                  const discountValue = voucher.discountValue ?? 0;
                  const displayDiscount =
                    voucher.discountType === "FIXED"
                      ? `${discountValue.toLocaleString("vi-VN")}đ`
                      : `${discountValue}%`;

                  return (
                    <tr
                      key={String(voucherId ?? Math.random())}
                      className="hover:bg-surface-container-low transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20 w-fit">
                            {voucher.code}
                          </span>
                          <span className="text-xs text-on-surface-variant">
                            {voucher.description ?? "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {displayDiscount}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        {voucher.usedCount ?? 0}/{voucher.usageLimit ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${voucher.status === "ACTIVE" ? "bg-secondary/10 text-secondary border-secondary/20" : voucher.status === "SCHEDULED" ? "bg-tertiary-container/30 text-tertiary-container border-tertiary-container/30" : "bg-surface-variant text-on-surface-variant border-outline-variant"}`}
                        >
                          {voucher.status ?? "ACTIVE"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        {voucher.startDate ?? "-"} → {voucher.endDate ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(voucher)}
                            className="p-1 text-on-surface-variant hover:text-primary transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => {
                              if (voucherId !== undefined) {
                                handleDelete(voucherId);
                              }
                            }}
                            className="p-1 text-on-surface-variant hover:text-error transition-colors"
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
            Showing {vouchers.length} entries
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => fetchVouchers(Math.max(0, page - 1), search)}
              disabled={page <= 0}
              className="p-2 border border-outline-variant rounded-lg text-on-surface hover:bg-surface-variant disabled:opacity-50"
            >
              &lt;
            </button>
            {pageNumbers.map((number) => (
              <button
                key={number}
                onClick={() => fetchVouchers(number - 1, search)}
                className={`w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center ${page + 1 === number ? "bg-primary text-white" : "border border-outline-variant text-on-surface hover:bg-surface-variant"}`}
              >
                {number}
              </button>
            ))}
            <button
              onClick={() =>
                fetchVouchers(
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

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-surface p-6 shadow-xl border border-outline-variant">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-on-surface">
                {editingVoucher ? "Edit" : "Create"} Voucher
              </h3>
              <button
                onClick={resetForm}
                className="p-1 rounded hover:bg-surface-variant"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Code
                </label>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Discount Type
                </label>
                <select
                  value={form.discountType}
                  onChange={(e) =>
                    setForm({ ...form, discountType: e.target.value })
                  }
                  className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                >
                  <option value="PERCENT">Percent</option>
                  <option value="FIXED">Fixed</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Giảm 10% cho đơn hàng"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Discount Value
                </label>
                <input
                  type="number"
                  value={form.discountValue}
                  onChange={(e) =>
                    setForm({ ...form, discountValue: e.target.value })
                  }
                  className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Min Order Value
                </label>
                <input
                  type="number"
                  value={form.minOrderValue}
                  onChange={(e) =>
                    setForm({ ...form, minOrderValue: e.target.value })
                  }
                  className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Max Discount Amount
                </label>
                <input
                  type="number"
                  value={form.maxDiscountAmount}
                  onChange={(e) =>
                    setForm({ ...form, maxDiscountAmount: e.target.value })
                  }
                  className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Usage Limit
                </label>
                <input
                  type="number"
                  value={form.usageLimit}
                  onChange={(e) =>
                    setForm({ ...form, usageLimit: e.target.value })
                  }
                  className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                  className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                  className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>
              <div className="md:col-span-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded px-3 py-2 text-sm border border-outline-variant"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-primary px-3 py-2 text-sm font-semibold text-white"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
