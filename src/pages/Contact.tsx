import { useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import { postContact } from "../services/contactService";

export default function Contact() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fullName || !email || !message) {
      toast.error("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    setSubmitting(true);
    try {
      await postContact({ fullName, email, message });
      toast.success("Gửi liên hệ thành công.");
      setFullName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      console.error("Contact form failed", error);
      toast.error("Gửi liên hệ thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[720px] mx-auto px-4 md:px-10 py-10">
      <h1 className="font-serif text-3xl font-bold text-primary mb-6">
        Liên hệ
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
            Nội dung
          </label>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="w-full rounded-3xl border border-outline p-4 bg-surface text-on-surface"
            rows={5}
            placeholder="Nhập nội dung của bạn"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-3xl bg-primary text-on-primary py-4 font-bold hover:bg-primary-container transition disabled:opacity-60"
        >
          {submitting ? "Đang gửi..." : "Gửi liên hệ"}
        </button>
      </form>
    </div>
  );
}
