import React, { useEffect, useMemo, useState } from "react";
import { Search, Plus, Eye, Lock, Unlock } from "lucide-react";
import { toast } from "react-toastify";
import { getUsers, toggleUserStatus } from "../../services/customerService";

interface CustomerRow {
  id?: string | number;
  username?: string;
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
  [key: string]: any;
}

export function CustomerManagement() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageInfo, setPageInfo] = useState({
    number: 0,
    totalPages: 0,
    totalElements: 0,
    size: 10,
  });

  const fetchUsers = async (nextPage = page, keyword = search) => {
    setLoading(true);
    try {
      const response = await getUsers(nextPage, 10, keyword);
      const payload = response.data?.data ?? response.data;
      const content = payload?.content ?? payload?.data ?? [];
      setCustomers(content);
      setPageInfo({
        number: payload?.number ?? nextPage,
        totalPages: payload?.totalPages ?? 0,
        totalElements: payload?.totalElements ?? content.length,
        size: payload?.size ?? 10,
      });
      setPage(payload?.number ?? nextPage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(0, search);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => fetchUsers(0, search), 400);
    return () => window.clearTimeout(timer);
  }, [search]);

  const handleToggleStatus = async (
    id: string | number,
    currentStatus: string,
  ) => {
    try {
      const nextStatus =
        currentStatus === "ACTIVE" || currentStatus === "Active"
          ? "BANNED"
          : "ACTIVE";
      await toggleUserStatus(id, nextStatus);
      toast.success("User status updated successfully");
      await fetchUsers(page, search);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update user status",
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

  const getCustomerKey = (customer: CustomerRow, index: number) => {
    const rawId =
      customer.id ?? customer.userId ?? customer.username ?? customer.email;
    if (rawId !== undefined && rawId !== null && rawId !== "") {
      return String(rawId);
    }

    return `customer-${index}`;
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* --- START: TIÊU ĐỀ & NÚT ADD (Đồng bộ với Book Management) --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">
            Customer Management
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Manage user accounts, roles, and access statuses.
          </p>
        </div>
        <button className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 justify-center transition-colors">
          <Plus size={18} />
          Add New User
        </button>
      </div>
      {/* --- END: TIÊU ĐỀ --- */}

      {/* --- START: THANH TÌM KIẾM (Đồng bộ với Book Management) --- */}
      <div className="bg-surface border border-outline-variant rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            size={20}
          />
          <input
            type="text"
            className="w-full bg-background border border-outline-variant rounded-lg h-10 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            placeholder="Search by username, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      {/* --- END: THANH TÌM KIẾM --- */}

      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-200">
            <thead className="bg-surface-container-low border-b border-outline-variant text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-on-surface divide-y divide-outline-variant">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-sm text-on-surface-variant"
                  >
                    Loading...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-sm text-on-surface-variant"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                customers.map((customer, index) => {
                  const status = customer.status ?? "ACTIVE";
                  const isActive = status === "ACTIVE" || status === "Active";
                  return (
                    <tr
                      key={getCustomerKey(customer, index)}
                      className={`hover:bg-surface-container-low transition-colors ${isActive ? "" : "opacity-75"}`}
                    >
                      <td
                        className={`px-4 py-3 font-medium ${isActive ? "" : "line-through text-outline"}`}
                      >
                        {customer.username}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {customer.fullName ?? customer.name ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        {customer.email}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        {customer.phone}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${customer.role === "ADMIN" || customer.role === "Admin" ? "bg-primary-container text-primary" : "bg-surface-variant text-on-surface-variant"}`}
                        >
                          {customer.role ?? "Customer"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border ${isActive ? "bg-secondary/10 text-secondary border-secondary/20" : "bg-error/10 text-error border-error/20"}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-secondary" : "bg-error"}`}
                          ></span>
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="text-primary hover:bg-primary/10 p-1.5 rounded transition-colors"
                            title="View Details"
                          >
                            <Eye size={20} />
                          </button>
                          <button
                            onClick={() => {
                              if (customer.id !== undefined) {
                                handleToggleStatus(customer.id, status);
                              }
                            }}
                            className={
                              isActive
                                ? "text-error hover:bg-error/10 p-1.5 rounded transition-colors"
                                : "text-secondary hover:bg-secondary/10 p-1.5 rounded transition-colors"
                            }
                            title={isActive ? "Ban User" : "Unban User"}
                          >
                            {isActive ? (
                              <Lock size={20} />
                            ) : (
                              <Unlock size={20} />
                            )}
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
            Showing {customers.length} entries
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => fetchUsers(Math.max(0, page - 1), search)}
              disabled={page <= 0}
              className="p-2 border border-outline-variant rounded-lg text-on-surface hover:bg-surface-variant disabled:opacity-50"
            >
              &lt;
            </button>
            {pageNumbers.map((number) => (
              <button
                key={number}
                onClick={() => fetchUsers(number - 1, search)}
                className={`w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center ${page + 1 === number ? "bg-primary text-white" : "border border-outline-variant text-on-surface hover:bg-surface-variant"}`}
              >
                {number}
              </button>
            ))}
            <button
              onClick={() =>
                fetchUsers(Math.min(pageInfo.totalPages - 1, page + 1), search)
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
