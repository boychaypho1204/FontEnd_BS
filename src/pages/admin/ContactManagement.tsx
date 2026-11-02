import React, { useEffect, useMemo, useState } from "react";
import { Search, Mail, Phone, MessageSquare, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";
import {
  getContacts,
  updateContactStatus,
} from "../../services/contactService";

interface ContactItem {
  id?: string | number;
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  status?: string;
  createdAt?: string;
  [key: string]: any;
}

export function ContactManagement() {
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageInfo, setPageInfo] = useState({
    number: 0,
    totalPages: 0,
    totalElements: 0,
    size: 10,
  });

  const fetchContacts = async (nextPage = page, keyword = search) => {
    setLoading(true);
    try {
      const response = await getContacts(nextPage, 10, keyword);
      const payload = response.data?.data ?? response.data;
      const content = payload?.content ?? payload?.data ?? [];
      setContacts(content);
      setPageInfo({
        number: payload?.number ?? nextPage,
        totalPages: payload?.totalPages ?? 0,
        totalElements: payload?.totalElements ?? content.length,
        size: payload?.size ?? 10,
      });
      setPage(payload?.number ?? nextPage);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to load contacts",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts(0, search);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => fetchContacts(0, search), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const handleMarkProcessed = async (contact: ContactItem) => {
    const contactId = contact.id;

    if (contactId == null || contactId === "") {
      toast.error("Contact id is missing");
      return;
    }

    try {
      await updateContactStatus(contactId, "PROCESSED");
      toast.success("Contact marked as processed");
      await fetchContacts(page, search);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to update contact",
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
            Contact & Support
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Manage customer inquiries and support tickets.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface p-4 rounded-xl border border-outline-variant flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center shrink-0">
            <MessageSquare size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-on-surface">
              {pageInfo.totalElements}
            </div>
            <div className="text-sm font-semibold text-on-surface-variant">
              Total Requests
            </div>
          </div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-outline-variant flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Mail size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-on-surface">
              {
                contacts.filter(
                  (c) =>
                    (c.status ?? "").toUpperCase() !== "PROCESSED" &&
                    (c.status ?? "").toUpperCase() !== "RESOLVED",
                ).length
              }
            </div>
            <div className="text-sm font-semibold text-on-surface-variant">
              Pending
            </div>
          </div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-outline-variant flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
            <Phone size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-on-surface">
              {
                contacts.filter(
                  (c) =>
                    (c.status ?? "").toUpperCase() === "PROCESSED" ||
                    (c.status ?? "").toUpperCase() === "RESOLVED",
                ).length
              }
            </div>
            <div className="text-sm font-semibold text-on-surface-variant">
              Processed
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface p-4 rounded-xl border border-outline-variant flex items-center gap-2">
        <Search size={18} className="text-outline" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts"
          className="w-full bg-transparent outline-none"
        />
      </div>

      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-surface-container-low border-b border-outline-variant text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-on-surface divide-y divide-outline-variant">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-on-surface-variant"
                  >
                    Loading...
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-on-surface-variant"
                  >
                    No contacts found.
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => {
                  const isProcessed =
                    (contact.status ?? "").toUpperCase() === "PROCESSED" ||
                    (contact.status ?? "").toUpperCase() === "RESOLVED";
                  return (
                    <tr key={String(contact.id)}>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold">
                            {contact.name ?? "-"}
                          </span>
                          <span className="text-xs text-on-surface-variant">
                            {contact.email ?? "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {contact.subject ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant max-w-[320px]">
                        {contact.message ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${isProcessed ? "bg-secondary/10 text-secondary" : "bg-error/10 text-error"}`}
                        >
                          {contact.status ?? "PENDING"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant text-xs">
                        {contact.createdAt ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isProcessed && (
                          <button
                            onClick={() => handleMarkProcessed(contact)}
                            className="text-primary hover:bg-primary/10 p-2 rounded"
                            title="Mark processed"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        )}
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
            Showing {contacts.length} entries
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => fetchContacts(Math.max(0, page - 1), search)}
              disabled={page <= 0}
              className="p-2 border border-outline-variant rounded-lg text-on-surface hover:bg-surface-variant disabled:opacity-50"
            >
              &lt;
            </button>
            {pageNumbers.map((number) => (
              <button
                key={number}
                onClick={() => fetchContacts(number - 1, search)}
                className={`w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center ${page + 1 === number ? "bg-primary text-white" : "border border-outline-variant text-on-surface hover:bg-surface-variant"}`}
              >
                {number}
              </button>
            ))}
            <button
              onClick={() =>
                fetchContacts(
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
