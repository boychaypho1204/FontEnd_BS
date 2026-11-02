import {
  ArrowRight,
  BookOpen,
  Heart,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

const values = [
  {
    icon: BookOpen,
    title: "Đa dạng đầu sách",
    description:
      "Từ manga, light novel đến các bộ truyện tranh bản quyền mới nhất, chúng tôi luôn mang đến kho sách phong phú cho mọi sở thích.",
  },
  {
    icon: ShieldCheck,
    title: "Bản quyền 100%",
    description:
      "Mỗi sản phẩm đều được chọn lọc kỹ lưỡng để đảm bảo chất lượng, nguồn gốc rõ ràng và trải nghiệm mua sắm đáng tin cậy.",
  },
  {
    icon: Heart,
    title: "Phục vụ tận tâm",
    description:
      "Đội ngũ của chúng tôi luôn sẵn sàng hỗ trợ bạn tìm thấy những cuốn sách phù hợp nhất với tâm hồn và nhu cầu của mình.",
  },
  {
    icon: Sparkles,
    title: "Trải nghiệm hiện đại",
    description:
      "Giao diện dễ dùng, tìm kiếm nhanh và quy trình đặt hàng mượt mà giúp bạn khám phá thế giới sách thật dễ dàng.",
  },
];

export default function AboutUs() {
  return (
    // BÍ KÍP: Đổi max-w-[1280px] thành max-w-[1536px] w-full và đồng bộ padding 2 bên
    <div className="mx-auto flex w-full max-w-[1536px] flex-col gap-8 px-4 py-10 md:px-8 lg:px-12 md:py-16">
      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface p-5 sm:p-8 shadow-sm md:p-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 max-w-2xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              <span>Hành trình mang thế giới truyện tranh đến tay bạn</span>
            </div>
            <h1 className="font-serif text-4xl font-bold leading-tight text-primary md:text-5xl">
              Khơi nguồn đam mê đọc, một trang sách mỗi ngày.
            </h1>
            <p className="text-lg leading-8 text-on-surface-variant">
              Tại Lumina Books, chúng tôi tin rằng mỗi cuốn sách không chỉ là
              một món đồ mà còn là một cửa sổ mở ra những câu chuyện, cảm xúc và
              thế giới mới.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-on-primary transition hover:bg-primary-container"
              >
                Khám phá ngay
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-full border border-outline-variant/40 px-6 py-3 font-semibold text-on-surface transition hover:border-primary hover:text-primary"
              >
                Liên hệ với chúng tôi
              </Link>
            </div>
          </div>

          <div className="w-full max-w-md rounded-[2rem] border border-outline-variant/30 bg-surface p-3 shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=900&q=80"
              alt="Tủ sách và không gian đọc sách"
              className="h-[320px] w-full rounded-[1.5rem] object-cover"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-8 rounded-xl border border-outline-variant bg-surface p-5 sm:p-8 md:grid-cols-[1.05fr_0.95fr] md:p-10">
        <div className="overflow-hidden rounded-[1.5rem]">
          <img
            src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1000&q=80"
            alt="Tủ truyện tranh và sách manga"
            className="h-full min-h-[280px] w-full object-cover"
          />
        </div>

        <div className="flex flex-col justify-center space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
            Our Story
          </p>
          <h2 className="font-serif text-3xl font-bold text-primary md:text-4xl">
            Câu chuyện bắt đầu từ một tình yêu với từng trang giấy.
          </h2>
          <p className="text-base leading-8 text-on-surface-variant">
            Lumina Books được thành lập từ niềm đam mê với manga, comic và những
            câu chuyện có sức ảnh hưởng lâu dài. Chúng tôi nhận ra rằng nhiều
            người thích đọc nhưng lại khó tìm được nơi cung cấp sách chất lượng,
            bản quyền và phong cách phục vụ thật sự chu đáo.
          </p>
          <p className="text-base leading-8 text-on-surface-variant">
            Vì vậy, website này ra đời để trở thành một không gian vừa dễ dàng
            khám phá, vừa chân thành kết nối người đọc với những tác phẩm tuyệt
            vời nhất.
          </p>
        </div>
      </section>

      <section className="space-y-6">
        {/* BÍ KÍP: Đổi max-w-3xl thành w-full, thêm lg:whitespace-nowrap để chữ chạy thẳng tắp trên 1 dòng */}
        <div className="w-full space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
            Core Values
          </p>
          <h2 className="font-serif text-3xl font-bold text-primary md:text-4xl">
            Những giá trị làm nên trải nghiệm của chúng tôi.
          </h2>
          <p className="text-base leading-8 text-on-surface-variant">
            Mỗi quyết định và từng lựa chọn đều hướng tới việc mang lại sự tin
            cậy, sự sáng tạo và niềm vui cho người đọc.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <div
                key={index}
                className="rounded-xl border border-outline-variant bg-surface p-6 shadow-sm"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-on-surface">
                  {value.title}
                </h3>
                <p className="text-sm leading-7 text-on-surface-variant">
                  {value.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-outline-variant bg-surface-container p-5 sm:p-8 md:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* BÍ KÍP 1: Đổi max-w-2xl thành w-full */}
          <div className="min-w-0 w-full space-y-3">
            {/* BÍ KÍP 2: Thêm lg:whitespace-nowrap để cấm rớt dòng */}
            <h2 className="font-serif text-3xl font-bold text-primary">
              Sẵn sàng bước vào một hành trình đọc sách mới?
            </h2>
            <p className="text-base leading-8 text-on-surface-variant">
              Hãy quay lại và khám phá kho sách đa dạng, đầy cảm hứng của Lumina
              Books ngay hôm nay.
            </p>
          </div>

          <Link
            to="/products"
            // BÍ KÍP 3: Thêm shrink-0 để bảo vệ cái nút không bị bóp méo khi chữ quá dài
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-on-primary transition hover:bg-primary-container"
          >
            Khám phá ngay
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
