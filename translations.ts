
import { Language } from './types';

export const t = (key: string, lang: Language): string => {
  const dictionary: Record<string, { vn: string; en: string }> = {
    'nav.exhibitions': { vn: 'Triển lãm', en: 'Exhibitions' },
    'nav.marketplace': { vn: 'Thị trường', en: 'Marketplace' },
    'nav.watchlist': { vn: 'Yêu thích', en: 'Watchlist' },
    'nav.admin': { vn: 'Quản lý', en: 'Admin' },
    'nav.about': { vn: 'Về chúng mình', en: 'About' },
    'nav.join': { vn: 'Tham gia', en: 'Join' },
    'hero.exhibitions.title': { vn: 'Triển lãm', en: 'Exhibitions' },
    'hero.exhibitions.sub': { vn: 'Khám phá không gian nghệ thuật tại Việt Nam.', en: 'A curated window into the Vietnam art ecosystem.' },
    'hero.marketplace.title': { vn: 'Thị trường', en: 'Marketplace' },
    'hero.marketplace.sub': { vn: 'Sở hữu những tác phẩm nghệ thuật bản địa.', en: 'Collect verified masterpieces from top regional artists.' },
    'hero.watchlist.title': { vn: 'Yêu thích', en: 'Watchlist' },
    'hero.watchlist.sub': { vn: 'Hành trình nghệ thuật của riêng bạn.', en: 'Your curated journey through the creative spaces.' },
    'btn.search': { vn: 'Tìm kiếm mạng lưới', en: 'Search Network' },
    'btn.searching': { vn: 'Đang tìm...', en: 'Searching...' },
    'filter.genres': { vn: 'Thể loại', en: 'Genres' },
    'filter.current': { vn: 'Hiện tại', en: 'Current' },
    'filter.archived': { vn: 'Đã kết thúc', en: 'Archived' },
    'tab.index': { vn: 'Danh sách', en: 'Index' },
    'tab.map': { vn: 'Bản đồ', en: 'MapView' },
    'empty.events': { vn: 'Không tìm thấy triển lãm nào.', en: 'No exhibitions detected in the vicinity.' },
    'empty.market': { vn: 'Không có tác phẩm phù hợp.', en: 'No collection items match your filter.' },
    'empty.watchlist': { vn: 'Danh sách yêu thích trống.', en: 'Your watchlist is presently empty.' },
    'footer.desc': { vn: 'Triển lãm, bản đồ và lưu trữ nghệ thuật Việt Nam. Cầu nối giữa cộng đồng và thế giới sáng tạo.', en: "Vietnam's premier art map and archive. Bridging the community and the creative world." },
    'footer.links.about': { vn: 'Về chúng mình', en: 'About Us' },
    'footer.links.terms': { vn: 'Điều khoản', en: 'Terms' },
    'footer.links.privacy': { vn: 'Bảo mật', en: 'Privacy' },
    'footer.copy': { vn: '© 2024 Judooo Art Network. Nâng tầm tài năng khu vực.', en: '© 2024 Judooo Art Network. Elevating regional talent.' },
    'footer.heading.judooo': { vn: 'Về Judooo', en: 'About Judooo' },
    'footer.heading.social': { vn: 'Mạng xã hội', en: 'Social Media' }
  };

  return dictionary[key]?.[lang] || key;
};
