import React, { useEffect, useMemo, useState } from "react";
import { Search, EyeOff, Eye } from "lucide-react";
import { toast } from "react-toastify";
import {
  getReviews,
  updateReviewStatus,
  type ReviewItem,
} from "../../services/reviewService";

export function ReviewManagement() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageInfo, setPageInfo] = useState({
    number: 0,
    totalPages: 0,
    totalElements: 0,
    size: 10,
  });

  const parseReviewPayload = (payload: unknown) => {
    if (Array.isArray(payload)) {
      return {
        content: payload,
        page: 0,
        totalPages: 1,
        totalElements: payload.length,
        size: payload.length,
      };
    }

    const record = payload as Record<string, unknown> | undefined;
    if (!record) {
      return {
        content: [],
        page: 0,
        totalPages: 0,
        totalElements: 0,
        size: 10,
      };
    }

    const nested =
      record.data ?? record.content ?? record.result ?? record.items;
    const content = Array.isArray(nested)
      ? nested
      : Array.isArray(record.content)
        ? record.content
        : [];

    return {
      content,
      page: Number(record.number ?? record.page ?? 0) || 0,
      totalPages: Number(record.totalPages ?? 1) || 1,
      totalElements:
        Number(record.totalElements ?? content.length) || content.length,
      size: Number(record.size ?? 10) || 10,
    };
  };

  const fetchReviews = async (nextPage = page, keyword = search) => {
    setLoading(true);
    try {
      const response = await getReviews(nextPage, 10, keyword);
      const payload = response.data?.data ?? response.data;
      const parsed = parseReviewPayload(payload);
      setReviews(parsed.content as ReviewItem[]);
      setPageInfo({
        number: parsed.page,
        totalPages: parsed.totalPages,
        totalElements: parsed.totalElements,
        size: parsed.size,
      });
      setPage(parsed.page);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to load reviews",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(0, search);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => fetchReviews(0, search), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const handleToggleStatus = async (review: ReviewItem) => {
    try {
      const nextStatus = review.status === "VISIBLE" ? "HIDDEN" : "VISIBLE";
      await updateReviewStatus(review.id, nextStatus);
      toast.success("Review status updated");
      await fetchReviews(page, search);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to update review status",
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
      <div>
        <h2 className="text-2xl font-bold text-on-surface">
          Review Management
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Moderate customer reviews and hide inappropriate content.
        </p>
      </div>

      <div className="bg-surface p-4 rounded-xl border border-outline-variant flex items-center gap-2">
        <Search size={18} className="text-outline" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reviews"
          className="w-full bg-transparent outline-none"
        />
      </div>

      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-surface-container-low border-b border-outline-variant text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Book</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Comment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-on-surface divide-y divide-outline-variant">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-on-surface-variant"
                  >
                    Loading...
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-on-surface-variant"
                  >
                    No reviews found.
                  </td>
                </tr>
              ) : (
                reviews.map((review) => {
                  const isVisible =
                    review.status === "VISIBLE" ||
                    review.status === "Visible" ||
                    review.status === "ACTIVE" ||
                    review.isVisible === true;
                  const customerName =
                    review.fullName ??
                    review.user?.fullName ??
                    review.customerName ??
                    review.userName ??
                    review.user?.name ??
                    review.customer?.fullName ??
                    review.customer?.name ??
                    review.author?.fullName ??
                    review.author?.name ??
                    review.username ??
                    review.user?.username ??
                    review.customer?.username ??
                    review.author?.username ??
                    "-";
                  const bookTitle =
                    review.book?.title ??
                    review.bookTitle ??
                    review.bookName ??
                    "-";

                  return (
                    <tr key={String(review.id)}>
                      <td className="px-4 py-3 font-semibold">
                        {customerName}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        {bookTitle}
                      </td>
                      <td className="px-4 py-3">{review.rating ?? "-"}</td>
                      <td className="px-4 py-3 text-on-surface-variant max-w-[320px]">
                        {review.comment ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${isVisible ? "bg-secondary/10 text-secondary" : "bg-error/10 text-error"}`}
                        >
                          {review.status ?? (isVisible ? "VISIBLE" : "HIDDEN")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleToggleStatus(review)}
                          className={`p-2 rounded ${isVisible ? "text-error hover:bg-error/10" : "text-secondary hover:bg-secondary/10"}`}
                          title={isVisible ? "Hide review" : "Show review"}
                        >
                          {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
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
            Showing {reviews.length} entries
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => fetchReviews(Math.max(0, page - 1), search)}
              disabled={page <= 0}
              className="p-2 border border-outline-variant rounded-lg text-on-surface hover:bg-surface-variant disabled:opacity-50"
            >
              &lt;
            </button>
            {pageNumbers.map((number) => (
              <button
                key={number}
                onClick={() => fetchReviews(number - 1, search)}
                className={`w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center ${page + 1 === number ? "bg-primary text-white" : "border border-outline-variant text-on-surface hover:bg-surface-variant"}`}
              >
                {number}
              </button>
            ))}
            <button
              onClick={() =>
                fetchReviews(
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
    </div>
  );
}
