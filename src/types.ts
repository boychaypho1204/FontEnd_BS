export interface Author {
  id: string;
  name: string;
  biography?: string;
  nationality?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Publisher {
  id: string;
  name: string;
  address?: string;
  website?: string;
}

export interface Book {
  id: string;
  bookId: string;
  title: string;
  authors?: Author[];
  author?: string; // legacy fallback for static UI data
  categories?: Category[];
  categoryId?: string | number;
  category?: string; // legacy fallback for static UI data
  publisher?: Publisher | string;
  price: number;
  discountPercent?: number;
  originalPrice?: number;
  coverImage: string;
  badge?: string; // e.g., 'Mới', '-20%'
  rating?: number;
  reviewCount?: number;
  description?: string;
  publicationYear?: number;
  stockQuantity?: number;
  pageCount?: number;
  size?: string;
}

export interface CartItem {
  id: string;
  bookId: string;
  book: Book;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  priceAtPurchase?: number;
  addedAt?: string;
}

export interface Role {
  id: string;
  name: string;
}

export interface Authority {
  authority: string;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  memberTier?: string;
  roles: string[];
  authorities?: Authority[];
  enabled?: boolean;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
  addresses?: Address[];
}

export interface Address {
  id: string;
  label?: string;
  fullName: string;
  phone: string;
  addressLine: string;
  city?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
}

export interface OrderItem {
  id: string;
  bookId: string;
  book: Book;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderId?: string;
  orderNumber?: string;
  date: string;
  createdAt: string;
  updatedAt?: string;
  totalAmount: number;
  shippingFee?: number;
  paymentMethod?: "cash" | "COD" | "vnpay" | "VNPAY" | string;
  paymentStatus?: "PAID" | "PENDING" | "FAILED" | string;
  status:
    | "processing"
    | "completed"
    | "cancelled"
    | "pending"
    | "shipped"
    | "failed";
  items: OrderItem[];
  shippingAddress?: Address;
  billingAddress?: Address;
  customer?: User;
}
