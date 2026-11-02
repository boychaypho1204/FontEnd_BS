import { Book } from '../types';

export const mockBooks: Book[] = [
  {
    id: '1',
    title: 'Lời Mời Tử Thần',
    author: 'Agatha Christie',
    price: 125000,
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJDzteWT0S_226Ruhuio8KAsBu5NenvWi6QE-_FK6Znc4lYQY2_UmlMCBpMgMLZluZwNPTEK6-t3Ghw18d9tD9Ccpy-rTRDxtibMtCI-wmNCV4Gk9GUurupZeZ2kkAEKPc-meL_EQToaVsHfXjQVqTVIUCC-u9hsbd6CmeOHpG171g3Y_G6takTPBrPY9KHFOa_MhX7PcfB_zLnS-adJY4HnLfmEB8ZGFmmjcVmmbryZmy915Mhsyjh12D6zflXq4v9EhO5jPGgFE',
    category: 'Tiểu Thuyết',
    badge: 'Mới'
  },
  {
    id: '2',
    title: 'Lãnh Đạo Tỉnh Thức',
    author: 'Thích Nhất Hạnh',
    price: 160000,
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkeWrlIL-ogbvJEVq-Xw8PezSJmEdMmyuj0sibQDT1YiJnXLz5WE6lSvwH7ku2Yt2ElmDY5vE1I4RWC3JAsO1dvv2JRywzd2Il9fiCWCkchX6lR8Vmt2zXop-hu5TAUT98d2avwp6HGZBUtgKaHopx5Kttb9_4C-A_VN2MYlVeD1nNkgYA7HTd6tYYHjVI4A-E3jpF29K14Ntd4ni191Dp68XKBTRoBdNBZGA_F-M1rBIj16JlzoI021EWgfGmf_LPIODl2IVSP-0',
    category: 'Kinh doanh'
  },
  {
    id: '3',
    title: 'Nghệ Thuật Sống',
    author: 'Erich Fromm',
    price: 135000,
    originalPrice: 160000,
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZZzdfyHddBtM8Lgsen_PD0n-bzZNHnDukjtq-EltZohNWeeE3D9j6QH1y3HdLYkoo9zkdzG5LUBJZgDcSjX6UKHc3Sbgx_H-mQqp3iQ_4bo-c5RiAKoiws7hEz-Qp1C6ZNkbf_V8h9ofGngcBDl1CcN-6K1TMN_xXU8E2irizH0lHAGZoT-f8keDGvQUBU6eKBmii_mD0PME5-VOxm-ydl0Qt-pMRYlhn8Xp_mPFmJJkpYhE1RAybjASgPcN9T9IeKqWA0dPiGNI',
    category: 'Tâm lý',
    badge: '-15%'
  },
  {
    id: '4',
    title: 'Bản Đồ Mây',
    author: 'David Mitchell',
    price: 245000,
    originalPrice: 350000,
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD70sXOuQ7KtqZtaeUUE1XabPbopLbQ3kwX_W-N5ICFt_rQu6YvY_JTWGbWR5tipJHFOl1SjR5gDf26NXcqaxx2qPGZW2e2XiTqO8wxpEcXpGnbKmstyvJts6CNY3UgfQKGPjEQzP-QrVozWYFOmJ2j22fbNqSgzqg8IzAFXJ-kKcLBotNe8l4z7PQrbgWoi5NI2ChpFnN7tK5_AVnQzs4HEUtuluI00wA4W8MoiKRgRwv-VJQXfVKqNuTYXZ79MbO1dc3p1rbqGVY',
    category: 'Tiểu thuyết',
    badge: '-30%',
    rating: 4.8,
    reviewCount: 124
  },
  {
    id: '5',
    title: 'Cây Cam Ngọt Của Tôi',
    author: 'José Mauro de Vasconcelos',
    price: 86400,
    originalPrice: 108000,
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCglcsPfxCt0FRQvgiK1STrt3sEML4QbXlNFeWd59dxer0-ySUK2fCGA_H09-gp_pY4gPey0gBliH2YrzkdPBjlh-7PfblNgjWpYcaXHu6oZiUj-qg6hiMMIfbfg7IHTwayR8dHxlFz9j9fIRrBYRAqOMjoVttFzv7ZHOAwIRWRJTiojR679ginqSD1gPo6q0-WFGGpaPyG0nn7K5bYBUb_GT47OjiXkclON42C_6ahJvlh1GvcExMdiMydNa__eO0ygh05kevX5fY',
    category: 'Văn học',
    badge: '-20%'
  },
  {
    id: '6',
    title: 'Nhà Giả Kim',
    author: 'Paulo Coelho',
    price: 79000,
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdpAQkr35M7AJLEbtgR9aYElJijowt60QK4ILKlsZKDvG-QOpP50U17Ipjb8hgOo2T91TTjEhYwg_q_URimy_7YqZ5QjlXV9t-4bnPFTod_0fyhvyCZ7ASwYGqMQbR2UuGNy9XjN2w7fpU2xRK3Iw6N4eYrkxm3_yX-gq2TtjmXAWmupUnVZ4SN1FWnWyvdgfJ7N7x2ao5rdV50A8hnS-OAMmgTrCXlEjeR_xukXUXJZZetYwTdksrdU2R2QbCuLxaAyDOXWPveLQ',
    category: 'Văn học',
    badge: 'Bán chạy'
  }
];
