import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Banknote,
  Book,
  Truck,
  Users,
  TrendingUp,
  AlertTriangle,
  MoreVertical,
} from "lucide-react";
import { getBooks } from "../../services/bookService";
import {
  getRevenueByDateRange,
  getStatsSummary,
} from "../../services/dashboardService";

interface SummaryStats {
  totalRevenue?: number;
  totalOrders?: number;
  totalBooks?: number;
  totalCustomers?: number;
  activeOrders?: number;
  [key: string]: any;
}

interface RevenuePoint {
  name?: string;
  month?: string;
  date?: string;
  day?: string;
  revenue?: number;
  totalRevenue?: number;
  [key: string]: any;
}

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function Dashboard() {
  const location = useLocation();
  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);

  const [summary, setSummary] = useState<SummaryStats>({});
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState(formatDateInput(firstDayOfMonth));
  const [toDate, setToDate] = useState(formatDateInput(new Date()));

  const toNumber = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const getFirstDefinedValue = (
    source: Record<string, unknown> | undefined,
    keys: string[],
  ) => {
    if (!source) {
      return undefined;
    }

    for (const key of keys) {
      const value = source[key];
      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }

    return undefined;
  };

  const extractRevenueValue = (payload: unknown): number => {
    if (payload === null || payload === undefined) {
      return 0;
    }

    if (typeof payload === "number") {
      return Number.isFinite(payload) ? payload : 0;
    }

    if (typeof payload === "string") {
      const numericValue = Number(payload.replace(/,/g, ""));
      return Number.isFinite(numericValue) ? numericValue : 0;
    }

    if (Array.isArray(payload)) {
      return payload.reduce((sum, item) => sum + extractRevenueValue(item), 0);
    }

    if (typeof payload === "object") {
      const directValue = getFirstDefinedValue(
        payload as Record<string, unknown>,
        [
          "totalRevenue",
          "revenue",
          "totalSales",
          "sales",
          "amount",
          "total",
          "value",
        ],
      );

      if (directValue !== undefined) {
        return toNumber(directValue);
      }

      const nestedKeys = ["data", "result", "content", "items", "records"];
      for (const key of nestedKeys) {
        const nestedValue = (payload as Record<string, unknown>)[key];
        const nestedRevenue = extractRevenueValue(nestedValue);
        if (nestedRevenue > 0) {
          return nestedRevenue;
        }
      }
    }

    return 0;
  };

  const formatAxisLabel = (value?: string) => {
    if (!value) {
      return "";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const formatCurrencyVnd = (value: number | string | null | undefined) => {
    const numericValue = Number(value ?? 0);

    if (!Number.isFinite(numericValue)) {
      return "0 ₫";
    }

    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(numericValue);
  };

  const getDateRangeRevenue = async (
    startDate = fromDate,
    endDate = toDate,
  ) => {
    setLoading(true);
    try {
      const [summaryRes, revenueRes, booksRes] = await Promise.all([
        getStatsSummary(),
        getRevenueByDateRange(startDate, endDate),
        getBooks({ page: 0, size: 1 }),
      ]);

      const summaryPayload = summaryRes.data?.data ?? summaryRes.data ?? {};
      const revenuePayload = revenueRes.data?.data ?? revenueRes.data ?? [];
      const booksPayload =
        booksRes.data && typeof booksRes.data === "object"
          ? (booksRes.data as unknown as Record<string, unknown>)
          : {};

      const directRevenueTotal = extractRevenueValue(revenuePayload);

      const normalizedRevenue = Array.isArray(revenuePayload)
        ? revenuePayload
        : Array.isArray(revenuePayload?.content)
          ? revenuePayload.content
          : [];

      const preparedRevenue = normalizedRevenue.map((item: RevenuePoint) => {
        const itemDate =
          item.date ?? item.day ?? item.createdAt ?? item.name ?? item.month;

        return {
          ...item,
          date: itemDate ? itemDate.toString().split("T")[0] : "",
          label: itemDate ? formatAxisLabel(itemDate.toString()) : "",
          revenue: Number(item.revenue ?? item.totalRevenue ?? 0),
        };
      });

      const totalRevenueFromSummary = toNumber(
        getFirstDefinedValue(summaryPayload, [
          "totalRevenue",
          "revenue",
          "totalSales",
          "sales",
          "amount",
        ]),
      );
      const totalRevenueFromChart = preparedRevenue.reduce(
        (sum, item) => sum + toNumber(item.revenue),
        0,
      );
      const totalBooks = toNumber(
        getFirstDefinedValue(summaryPayload, [
          "totalBooks",
          "totalBook",
          "booksCount",
          "bookCount",
        ]) ??
          booksPayload?.totalElements ??
          booksPayload?.total ??
          0,
      );
      const activeOrders = toNumber(
        getFirstDefinedValue(summaryPayload, [
          "activeOrders",
          "activeOrder",
          "pendingOrders",
          "processingOrders",
        ]) ??
          summaryPayload?.totalOrders ??
          0,
      );

      setSummary({
        ...(summaryPayload ?? {}),
        totalRevenue:
          directRevenueTotal > 0
            ? directRevenueTotal
            : totalRevenueFromChart > 0
              ? totalRevenueFromChart
              : totalRevenueFromSummary,
        totalBooks,
        activeOrders,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.pathname === "/admin/dashboard") {
      getDateRangeRevenue();
    }
  }, [location.pathname]);

  useEffect(() => {
    const refreshOnFocus = () => {
      if (location.pathname === "/admin/dashboard") {
        getDateRangeRevenue();
      }
    };

    window.addEventListener("focus", refreshOnFocus);
    return () => {
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, [location.pathname, fromDate, toDate]);

  const handleFilter = () => {
    if (!fromDate && !toDate) {
      return;
    }

    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      window.alert("Từ ngày phải nhỏ hơn hoặc bằng Đến ngày");
      return;
    }

    getDateRangeRevenue(fromDate, toDate);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-surface border border-outline-variant rounded-xl p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
              Từ ngày
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-background px-3 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex-1 min-w-0">
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
              Đến ngày
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-background px-3 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button
            type="button"
            onClick={handleFilter}
            disabled={loading}
            className="inline-flex h-[46px] items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Đang lọc..." : "Lọc"}
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold tracking-wider text-on-surface-variant uppercase">
              Total Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Banknote size={20} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-on-surface">
              {loading ? "..." : formatCurrencyVnd(summary.totalRevenue)}
            </div>
            <div className="flex items-center gap-1 mt-2 text-secondary text-sm font-medium">
              <TrendingUp size={16} />
              <span>Live from backend</span>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold tracking-wider text-on-surface-variant uppercase">
              Total Books
            </span>
            <div className="w-8 h-8 rounded-lg bg-tertiary-container/10 flex items-center justify-center text-tertiary-container">
              <Book size={20} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-on-surface">
              {loading
                ? "..."
                : Number(summary.totalBooks ?? 0).toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-2 text-on-surface-variant text-sm font-medium">
              <Book size={16} />
              <span>Inventory count</span>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold tracking-wider text-on-surface-variant uppercase">
              Active Orders
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-on-primary-fixed">
              <Truck size={20} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-on-surface">
              {loading
                ? "..."
                : Number(summary.activeOrders ?? 0).toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-2 text-error text-sm font-medium">
              <AlertTriangle size={16} />
              <span>From summary API</span>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold tracking-wider text-on-surface-variant uppercase">
              Total Customers
            </span>
            <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-container">
              <Users size={20} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-on-surface">
              {loading
                ? "..."
                : Number(summary.totalCustomers ?? 0).toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-2 text-secondary text-sm font-medium">
              <TrendingUp size={16} />
              <span>Registered users</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                Doanh thu theo khoảng ngày
              </p>
              <h3 className="mt-2 text-2xl font-bold text-on-surface">
                {fromDate && toDate
                  ? `${fromDate} → ${toDate}`
                  : "Tất cả thời gian"}
              </h3>
            </div>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <div className="text-sm font-medium text-on-surface-variant">
              Tổng doanh thu
            </div>
            <div className="mt-3 text-4xl font-bold text-on-surface">
              {loading ? "..." : formatCurrencyVnd(summary.totalRevenue)}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 bg-surface border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-bold text-on-surface">Order Summary</h3>
            <button className="w-8 h-8 rounded-full hover:bg-surface-variant flex items-center justify-center text-on-surface-variant transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>
          <div className="flex flex-col gap-4 overflow-y-auto pr-2">
            <div className="flex items-center justify-between py-2 border-b border-outline-variant/50 last:border-0">
              <span className="text-sm text-on-surface-variant">
                Total Orders
              </span>
              <span className="text-sm font-semibold text-on-surface">
                {summary.totalOrders ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-outline-variant/50 last:border-0">
              <span className="text-sm text-on-surface-variant">Revenue</span>
              <span className="text-sm font-semibold text-on-surface">
                {formatCurrencyVnd(summary.totalRevenue)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-outline-variant/50 last:border-0">
              <span className="text-sm text-on-surface-variant">Customers</span>
              <span className="text-sm font-semibold text-on-surface">
                {summary.totalCustomers ?? 0}
              </span>
            </div>
          </div>
          <button className="w-full mt-2 py-2 text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors">
            View All Orders
          </button>
        </div>
      </section>
    </div>
  );
}
