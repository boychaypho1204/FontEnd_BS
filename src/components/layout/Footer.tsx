import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="customer-footer mt-auto">
      <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          
          <div className="space-y-4 lg:col-span-1">
            <h3 className="font-serif text-2xl font-bold text-primary mb-6">Lumina Books</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Khám phá thế giới tri thức và tưởng tượng bất tận cùng Lumina. Chúng tôi tự hào mang đến những tác phẩm đặc sắc nhất cho mọi tâm hồn yêu sách.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-primary mb-4 md:mb-6 uppercase tracking-wider text-sm">Liên kết nhanh</h4>
            <ul className="space-y-3">
              <li><Link to="/products" className="text-on-surface-variant hover:text-primary transition-colors text-sm">Tất cả sách</Link></li>
              <li><Link to="/products?category=new" className="text-on-surface-variant hover:text-primary transition-colors text-sm">Sách mới</Link></li>
              <li><Link to="/products?category=bestseller" className="text-on-surface-variant hover:text-primary transition-colors text-sm">Bán chạy nhất</Link></li>
              <li><Link to="/about" className="text-on-surface-variant hover:text-primary transition-colors text-sm">Về chúng tôi</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-primary mb-4 md:mb-6 uppercase tracking-wider text-sm">Hỗ trợ</h4>
            <ul className="space-y-3">
              <li><Link to="/contact" className="text-on-surface-variant hover:text-primary transition-colors text-sm">Trung tâm hỗ trợ</Link></li>
              <li><Link to="/faq" className="text-on-surface-variant hover:text-primary transition-colors text-sm">Câu hỏi thường gặp</Link></li>
              <li><Link to="/shipping" className="text-on-surface-variant hover:text-primary transition-colors text-sm">Chính sách vận chuyển</Link></li>
              <li><Link to="/returns" className="text-on-surface-variant hover:text-primary transition-colors text-sm">Chính sách đổi trả</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-primary mb-4 md:mb-6 uppercase tracking-wider text-sm">Liên hệ</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-on-surface-variant text-sm">
                <MapPin className="w-5 h-5 shrink-0 text-primary" />
                <span>123 Đường Sách, Quận 1, TP.HCM</span>
              </li>
              <li className="flex items-center gap-3 text-on-surface-variant text-sm">
                <Phone className="w-5 h-5 shrink-0 text-primary" />
                <span>1900 1234</span>
              </li>
              <li className="flex items-center gap-3 text-on-surface-variant text-sm">
                <Mail className="w-5 h-5 shrink-0 text-primary" />
                <span>hello@luminabooks.vn</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 md:mt-16 pt-8 border-t border-outline-variant/30 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-on-surface-variant">
          <p>© {new Date().getFullYear()} Lumina Books. Tất cả quyền được bảo lưu.</p>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-primary transition-colors">Bảo mật</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Điều khoản</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
