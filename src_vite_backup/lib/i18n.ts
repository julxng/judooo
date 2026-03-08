import type { Language } from '@types';

const dictionary = {
  'nav.events': { vn: 'Triển lãm', en: 'Exhibitions' },
  'nav.marketplace': { vn: 'Thị trường', en: 'Marketplace' },
  'nav.saved': { vn: 'Lộ trình', en: 'Saved' },
  'nav.admin': { vn: 'Quản lý', en: 'Admin' },
  'nav.about': { vn: 'Về chúng mình', en: 'About' },
  'nav.join': { vn: 'Tham gia', en: 'Join' },
  'hero.events.title': { vn: 'Khám phá nghệ thuật', en: 'Art Discovery' },
  'hero.events.copy': {
    vn: 'Theo dõi triển lãm, workshop và đấu giá trên toàn mạng lưới nghệ thuật Việt Nam.',
    en: 'Track exhibitions, workshops, and auctions across the Vietnam art network.',
  },
  'hero.marketplace.title': { vn: 'Sưu tập đương đại', en: 'Contemporary Collection' },
  'hero.marketplace.copy': {
    vn: 'Khám phá các tác phẩm, lô đấu giá và hồ sơ nghệ sĩ trong cùng một luồng mua bán.',
    en: 'Browse works, auction lots, and artist stories inside a single commerce flow.',
  },
  'hero.saved.title': { vn: 'Lộ trình của bạn', en: 'Your Route' },
  'hero.saved.copy': {
    vn: 'Lưu những điểm dừng quan trọng rồi quay lại khi bạn sẵn sàng lên lịch.',
    en: 'Save key stops and return when you are ready to build your visit route.',
  },
  'hero.admin.title': { vn: 'Bàn điều khiển vận hành', en: 'Operations Console' },
  'hero.admin.copy': {
    vn: 'Quản lý sự kiện, danh mục tác phẩm và nhập dữ liệu hàng loạt từ một nơi.',
    en: 'Manage events, artworks, and bulk imports from one place.',
  },
  'hero.about.title': { vn: 'Về Judooo', en: 'About Judooo' },
  'hero.about.copy': {
    vn: 'Một lớp hạ tầng rõ ràng hơn cho cộng đồng nghệ thuật Việt Nam.',
    en: 'A clearer layer of infrastructure for the Vietnamese art community.',
  },
  'empty.events': { vn: 'Chưa có sự kiện phù hợp.', en: 'No events match the current filter.' },
  'empty.marketplace': { vn: 'Chưa có tác phẩm phù hợp.', en: 'No artworks match the current filter.' },
  'empty.saved': { vn: 'Bạn chưa lưu điểm dừng nào.', en: 'No saved stops yet.' },
  'footer.copy': {
    vn: 'Judooo xây dựng mạng lưới khám phá, sưu tập và lưu trữ nghệ thuật Việt Nam.',
    en: 'Judooo builds the discovery, collecting, and archive layer for Vietnam art.',
  },
  'filter.active': { vn: 'Đang diễn ra', en: 'Active' },
  'filter.past': { vn: 'Đã kết thúc', en: 'Past' },
  'filter.category': { vn: 'Thể loại', en: 'Category' },
  'filter.sale': { vn: 'Loại bán', en: 'Sale Type' },
  'filter.price': { vn: 'Giá', en: 'Price' },
  'tab.grid': { vn: 'Danh sách', en: 'Grid' },
  'tab.map': { vn: 'Bản đồ', en: 'Map' },
} as const;

export const t = (key: keyof typeof dictionary, language: Language): string => dictionary[key][language];
