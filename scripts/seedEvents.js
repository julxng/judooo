import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://naoygdqjlkreypjwzqex.supabase.co';
const SUPABASE_KEY = 'sb_publishable_LnXGomnboVp61covNL6lRQ_yLoeMN7_';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Approximate coordinates for districts in HCMC and Hanoi
const DISTRICT_COORDS = {
  'District 1': { lat: 10.7769, lng: 106.7009 },
  'District 3': { lat: 10.7830, lng: 106.6961 },
  'District 4': { lat: 10.7570, lng: 106.7040 },
  'Thu Duc City': { lat: 10.8497, lng: 106.7533 },
  'Phu Nhuan District': { lat: 10.8010, lng: 106.6840 },
  'Binh Thanh District': { lat: 10.8100, lng: 106.7100 },
  'Ba Dinh District': { lat: 21.0333, lng: 105.8333 },
  'Hoan Kiem District': { lat: 21.0285, lng: 105.8542 },
  'Thanh Xuan District': { lat: 20.9980, lng: 105.8000 },
};

// Default coordinates for cities
const CITY_COORDS = {
  'Ho Chi Minh City': { lat: 10.7769, lng: 106.7009 },
  'Hanoi': { lat: 21.0285, lng: 105.8542 },
};

function getCoordinates(city, district) {
  if (district && DISTRICT_COORDS[district]) {
    return DISTRICT_COORDS[district];
  }
  if (city && CITY_COORDS[city]) {
    return CITY_COORDS[city];
  }
  return { lat: 10.7769, lng: 106.7009 }; // Default to HCMC
}

function extractOrganizer(description, address) {
  // Try to extract gallery/organizer name from description or address
  const galleryPatterns = [
    /(?:Gallery|Galerie|Gallery|Gallery)\s+([A-Z][a-zA-Z\s]+)/,
    /([A-Z][a-zA-Z\s]+)\s+(?:Gallery|Galerie)/,
    /([A-Z][a-zA-Z\s]+)\s+trân trọng/,
  ];
  
  for (const pattern of galleryPatterns) {
    const match = description?.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // Check address for gallery names
  if (address) {
    const addrMatch = address.match(/([A-Z][a-zA-Z\s]+(?:Gallery|Galerie|Art|Space|Museum|Salon))/);
    if (addrMatch) {
      return addrMatch[1].trim();
    }
  }
  
  return 'Gallery';
}

function mapCategory(eventType, placeType) {
  if (!eventType) return 'exhibition';
  const lower = eventType.toLowerCase();
  if (lower.includes('auction') || lower.includes('sale')) return 'auction';
  if (lower.includes('workshop') || lower.includes('studio')) return 'workshop';
  return 'exhibition';
}

// Raw data from spreadsheet
const rawEvents = [
  {
    name_vie: 'Trong Hư Vô, Cái Hiện Hữu',
    name_en: 'In Absence, Presence',
    description_vie: 'Nguyễn Art Foundation (NAF) trân trọng giới thiệu triển lãm nhóm Trong hư vô, cái hiện hữu, với sự tham của các nghệ sĩ Oanh Phi Phi, Nguyễn Thúy Hằng, Linh San và Lêna Bùi, do Bill Nguyễn giám tuyển. Song hành cùng chủ đề trọng tâm năm 2024 của NAF – Đổi mới & Cống hiến – triển lãm này tôn vinh các thực hành nghệ thuật có khả năng trình hiện và luận bàn những khía cạnh khác nhau của đời sống – con người thông qua các phương pháp sáng tạo và nghiên cứu mang tính đột phá. Triển lãm diễn ra đồng thời tại khuôn viên trường học EMASI Nam Long (Quận 7) và EMASI Vạn Phúc (TP. Thủ Đức) từ tháng 09 năm 2024 tới tháng 01 năm 2025.',
    description_en: '',
    image_url: '',
    socialvideo_url: '',
    start_date: '2024/09/01',
    end_date: '2025/01/01',
    Status: 'End',
    art_medium: '',
    event_type: 'Exhibition',
    place_type: 'Others',
    city: 'Ho Chi Minh City',
    district: 'Thu Duc City',
    is_virtual: 'Physical',
    registration_link: 'https://nguyenartfoundation.com/exhibitions/in-absence-presence/',
    address_vi: '',
    address_en: ''
  },
  {
    name_vie: 'Chín Ruột Chiều Đau',
    name_en: 'An Anatomy Of Sadness',
    description_vie: '"Hồi còn nhỏ nỗi ám ảnh của tôi là những giấc mơ xen lẫn giữa những cơn sốt nóng lạnh, lúc đó tôi cảm giác như mình đang bước vào một không gian ba chiều, cái giường gỗ gõ trở nên rộng thênh thang với cái chiếu cói in màu xanh đỏ nhìn như những đám ruộng trồng nhiều loại hoa màu khác nhau. Tôi nằm chênh vênh trơ trụi giữa \'cánh đồng giường\', tôi mở to mắt, cơ thể co rúm lại nheo mắt nhìn một \'bóng hình\' đen thẫm, di chuyển và biến đổi hình hài như những đám mây đen. Tôi khiếp hãi vì sợ bởi vì lúc đó cơ thể của tôi mềm nhũn ra, chao đảo trên chiếc giường cứ biến dạng liên tục. Cho tới lúc lớn lên…" Chính trong những giấc chiêm bao nối dài của cơ thể mệt lả, nhận thức và sau đó một cuộc giải phẫu hình thành. Không chỉ thừa nhận ý nghĩa trừu tượng được gán lên cơ thể, mà mổ xẻ xác thịt để thấy máu và tim gan, một phần đã từng gắn kết với cơ thể người mẹ. Kết cục? Đớn đau? Kinh tởm khi nhìn cái nội soi xa lạ với hình dung về bản thân? Chờ đợi cái chết? Chấp nhận. Nghệ sĩ Bùi Công Khánh và Sàn Art thân mời mọi người bước vào không gian của \'Chín chiều ruột đau\' để tham gia vào một cuộc giải phẫu và nghĩ về những câu hỏi ấy.',
    description_en: '',
    image_url: '',
    socialvideo_url: '',
    start_date: '2024/11/15',
    end_date: '2025/02/15',
    Status: 'End',
    art_medium: '',
    event_type: 'Exhibition',
    place_type: 'Gallery',
    city: 'Ho Chi Minh City',
    district: 'District 4',
    is_virtual: 'Physical',
    registration_link: '',
    address_vi: 'Sàn Art, Millennium Masteri, B6.17 & B6.16, 132 Bến Vân Đồn, Phường 6, Quận 4, Thành phố Hồ Chí Minh',
    address_en: 'Sàn Art, Millennium Masteri, B6.17 & B6.16, 132 Ben Van Don Street, Ward 6, District 4, Ho Chi Minh City'
  },
  {
    name_vie: 'Cõi Riêng',
    name_en: 'Secret World',
    description_vie: 'TomuraLee Gallery trân trọng thông báo triển lãm cá nhân mang tên "𝑪𝒐̃𝒊 𝑹𝒊𝒆̂𝒏𝒈" của họa sĩ Bùi Tiên - nữ hoạ sĩ trẻ đã tạo dựng cho mình một phong cách hội họa rất riêng, gắn liền với bản sắc văn hoá dân tộc Việt Nam nhưng cũng mang đậm dấu ấn cá nhân, phóng khoáng và độc bản.',
    description_en: '',
    image_url: '',
    socialvideo_url: '',
    start_date: '2024/11/29',
    end_date: '2024/12/29',
    Status: 'End',
    art_medium: '',
    event_type: 'Exhibition',
    place_type: 'Gallery',
    city: 'Ho Chi Minh City',
    district: 'Thu Duc City',
    is_virtual: 'Physical',
    registration_link: '',
    address_vi: 'TomuraLee Gallery, Số 24, Đường số 1, Phường An Khánh, Thành phố Thủ Đức, Thành phố Hồ Chí Minh',
    address_en: 'TomuraLee Gallery, No. 24, Street No. 1, An Khanh Ward, Thu Duc City, Ho Chi Minh City'
  },
  {
    name_vie: 'Nắng Phủ Mùa Hoa',
    name_en: 'Sunshine Over The Blooming Season',
    description_vie: 'Annam Gallery vui mừng giới thiệu triển lãm cá nhân của họa sĩ Đoàn Quốc mang tên "Nắng Phủ Mùa Hoa". Trong triển lãm lần này, hoạ sĩ gửi đến quý khán giả 15 tác phẩm màu nước trên giấy. Như một lời tự sự khiêm tốn của một người trẻ nhìn ngắm những vẻ đẹp xa xôi dĩ vãng của quá khứ và hiện tại.',
    description_en: '',
    image_url: '',
    socialvideo_url: '',
    start_date: '2024/12/06',
    end_date: '2025/01/12',
    Status: 'End',
    art_medium: '',
    event_type: 'Exhibition',
    place_type: 'Gallery',
    city: 'Ho Chi Minh City',
    district: 'District 3',
    is_virtual: 'Physical',
    registration_link: '',
    address_vi: 'Annam Gallery, 371/4 Hai Bà Trưng, Phường 8, Quận 3, Thành phố Hồ Chí Minh',
    address_en: '371/4 Hai Ba Trung Street, Ward 8, District 3, Ho Chi Minh City'
  },
  {
    name_vie: '',
    name_en: 'Episode 4: Dreams',
    description_vie: 'Dreams- Nơi của những giấc mơ. Tập 4: Dreams - Nơi của những giấc mơ, nơi giấc mơ trở thành những mảnh ghép mong manh, nhảy múa giữa ranh giới của thực và ảo. Đó là thế giới mà bạn không thể chạm tới, nhưng lại chẳng thể ngừng khao khát.',
    description_en: '',
    image_url: '',
    socialvideo_url: '',
    start_date: '2024/12/12',
    end_date: '2024/12/22',
    Status: 'End',
    art_medium: '',
    event_type: 'Exhibition',
    place_type: 'Others',
    city: 'Ho Chi Minh City',
    district: 'Phu Nhuan District',
    is_virtual: 'Physical',
    registration_link: 'https://www.lemai.com.vn/pages/exhibition',
    address_vi: 'Le Mai Artisanal Soap, 43R/10 Hồ Văn Huệ, Phường 9, Quận Phú Nhuận, Thành phố Hồ Chí Minh',
    address_en: 'Le Mai Artisanal Soap, 43R/10 Ho Van Hue, Ward 9, Phu Nhuan District, Ho Chi Minh City'
  },
  {
    name_vie: '',
    name_en: 'Once Upon A Time In Indochine',
    description_vie: 'Lần đầu tiên, De La Sól - Sun Life Việt Nam cộng tác cùng Xưởng Phim Màu Hồng giới thiệu tới công chúng triển lãm "Once Upon A Time In Indochine" - góc nhìn mới về thiết kế mỹ thuật trong phim điện ảnh "Công tử Bạc Liêu", một tác phẩm được lấy cảm hứng về giai thoại lịch sử kinh điển xứ Nam Kỳ những năm 90.',
    description_en: '',
    image_url: '',
    socialvideo_url: '',
    start_date: '2024/12/12',
    end_date: '2024/12/25',
    Status: 'End',
    art_medium: '',
    event_type: 'Exhibition',
    place_type: 'Art Space',
    city: 'Ho Chi Minh City',
    district: 'District 3',
    is_virtual: 'Physical',
    registration_link: '',
    address_vi: 'De La Sól - Sun Life Flagship, 244 Pasteur, Phường 6, Quận 3, Thành phố Hồ Chí Minh',
    address_en: 'De La Sól - Sun Life Flagship, 244 Pasteur Street, Ward 6, District 3, Ho Chi Minh City'
  },
  {
    name_vie: 'Mộng Mị Giữa Lưng Trời',
    name_en: '',
    description_vie: '"Mộng mị giữa lưng trời" là cuộc dạo chơi đưa ta đến với thế giới mơ màng của hai nghệ sĩ lụa Tống Ngọc và Đỗ Duyên. Trong thế giới hư ảo đầy nữ tính ấy, ta bắt gặp là những khoảnh khắc tự do bay bổng, đắm chìm miên man, hút sâu trong nỗi cô đơn, giằng xé với những khát khao, rồi bình thản lặng lẽ giữa cuộc đời.',
    description_en: '',
    image_url: '',
    socialvideo_url: '',
    start_date: '2024/12/12',
    end_date: '2025/01/12',
    Status: 'End',
    art_medium: '',
    event_type: 'Exhibition',
    place_type: 'Gallery',
    city: 'Ho Chi Minh City',
    district: 'Binh Thanh District',
    is_virtual: 'Physical',
    registration_link: '',
    address_vi: 'Ginger Gallery, 195/16 Xô Viết Nghệ Tĩnh, Phường 17, Quận Bình Thạnh, Thành phố Hồ Chí Minh',
    address_en: 'Ginger Gallery, 195/16 Xo Viet Nghe Tinh Street, Ward 17, Binh Thanh District, Ho Chi Minh City'
  },
  {
    name_vie: 'Đồng Chìm Đáy Nước',
    name_en: 'Beneath Deep Rivers, Fields Submerged',
    description_vie: 'Wiking Salon hân hạnh được giới thiệu với công chúng triển lãm cá nhân của Ca Lê Thắng: Đồng Chìm Đáy Nước, do Lê Thiên Bảo giám tuyển.',
    description_en: '',
    image_url: '',
    socialvideo_url: '',
    start_date: '2024/12/14',
    end_date: '2025/01/19',
    Status: 'End',
    art_medium: '',
    event_type: 'Exhibition',
    place_type: 'Gallery',
    city: 'Ho Chi Minh City',
    district: 'District 3',
    is_virtual: 'Physical',
    registration_link: '',
    address_vi: 'Wiking Salon, Tầng trệt, Tòa nhà Centec, 72 Nguyễn Thị Minh Khai, Phường 6, Quận 3, Thành phố Hồ Chí Minh',
    address_en: 'Wiking Salon, Ground Floor – Centec Tower, 72 Nguyen Thi Minh Khai, Ward 6, District 3, Ho Chi Minh City'
  },
  {
    name_vie: 'Hiện Tại Màu Lam',
    name_en: 'The Blue Of Now',
    description_vie: 'HIỆN TẠI MÀU LAM - ĐIỂM ĐẾN BÌNH YÊN. Triển lãm "Hiện tại màu lam" của họa sĩ Nguyễn Minh Quang (Andy Nguyen) là một ý niệm nghệ thuật bao trùm không gian Bảo tàng Mỹ thuật Thành phố bằng một màu lam nguyên thủy của hơn hai mươi tác phẩm tranh và tượng.',
    description_en: 'THE BLUE OF NOW - THE DESTINATION FOR SERENITY. The exhibition "THE BLUE OF NOW" by artist Nguyễn Minh Quang (Andy Nguyen) an artistic concept that envelops the Ho Chi Minh City Museum of Fine Arts in a primal blue hue through more than twenty paintings and sculptures.',
    image_url: '',
    socialvideo_url: '',
    start_date: '2024/12/21',
    end_date: '2024/12/25',
    Status: 'End',
    art_medium: '',
    event_type: 'Exhibition',
    place_type: 'Museum',
    city: 'Ho Chi Minh City',
    district: 'District 1',
    is_virtual: 'Physical',
    registration_link: '',
    address_vi: 'Bảo tàng Mỹ thuật Thành phố Hồ Chí Minh , 97 Phó Đức Chính, Phường Nguyễn Thái Bình, Quận 1, Thành phố Hồ Chí Minh',
    address_en: 'Ho Chi Minh City Museum of Fine Arts,  97 Pho Duc Chinh Street, Nguyen Thai Binh Ward, District 1, Ho Chi Minh City'
  },
  {
    name_vie: 'Chiến hay Chạy hay Trôi hay Chìm',
    name_en: 'Fight or Flight or Float or Fall',
    description_vie: 'Galerie Quynh hân hạnh giới thiệu Chiến hay Chạy hay Trôi hay Chìm – một triển lãm cá nhân với loạt tác phẩm mới của nghệ sĩ Tuấn Andrew Nguyễn. Phủ khắp bốn phòng trưng bày, bộ tác phẩm thử nghiệm lần này tập trung vào sắp đặt điêu khắc, kết hợp với những nghiên cứu của Tuấn về ký ức lịch sử, ký ức vật chất, và những chiến lược kháng cự liên quan đến cách lưu giữ ký ức.',
    description_en: 'We\'re pleased to announce Fight or Flight or Float or Fall – a solo exhibition of new work by Tuan Andrew Nguyen. Spanning four exhibition rooms, this experimental body of work focuses on sculptural installations that bring together some of Nguyen\'s ongoing research around historical memory, material memory, and strategies of resistance often related to how memory is retained.',
    image_url: '',
    socialvideo_url: '',
    start_date: '2024/12/24',
    end_date: '2025/02/28',
    Status: 'End',
    art_medium: '',
    event_type: 'Exhibition',
    place_type: 'Gallery',
    city: 'Ho Chi Minh City',
    district: 'District 1',
    is_virtual: 'Physical',
    registration_link: '',
    address_vi: 'Gallery Quynh, 118 Nguyễn Văn Thủ, Phường Đa Kao, Quận 1, Thành phố Hồ Chí Minh',
    address_en: 'Gallery Quynh, 118 Nguyen Van Thu Street, Da Kao Ward, District 1, Ho Chi Minh City'
  },
  {
    name_vie: 'Tết Tỵ 2025',
    name_en: '',
    description_vie: '',
    description_en: '',
    image_url: '',
    socialvideo_url: '',
    start_date: '2024/12/28',
    end_date: '2025/01/03',
    Status: 'End',
    art_medium: '',
    event_type: 'Exhibition',
    place_type: 'Museum',
    city: 'Hanoi',
    district: 'Ba Dinh District',
    is_virtual: 'Physical',
    registration_link: '',
    address_vi: 'Bảo tàng Mỹ thuật Việt Nam, 66 Phố Nguyễn Thái Học, Phường Điện Biên, Quận Ba Đình, Hà Nội',
    address_en: 'Vietnam Fine Arts Museum, 66 Nguyen Thai Hoc Street, Dien Bien Ward, Ba Dinh District, Hanoi'
  },
  {
    name_vie: 'Ở Đây & Bây Giờ',
    name_en: 'Now and Here',
    description_vie: '',
    description_en: '',
    image_url: '',
    socialvideo_url: '',
    start_date: '2024/12/31',
    end_date: '2025/01/05',
    Status: 'End',
    art_medium: '',
    event_type: 'Exhibition',
    place_type: 'Museum',
    city: 'Hanoi',
    district: 'Ba Dinh District',
    is_virtual: 'Physical',
    registration_link: '',
    address_vi: 'Bảo tàng Mỹ thuật Việt Nam, 66 Phố Nguyễn Thái Học, Phường Điện Biên, Quận Ba Đình, Hà Nội',
    address_en: 'Vietnam Fine Arts Museum, 66 Nguyen Thai Hoc Street, Dien Bien Ward, Ba Dinh District, Hanoi'
  },
  {
    name_vie: 'Tơ Óng - Màu Cây, Đường Thêu Nét Nhuộm Xưa - Nay',
    name_en: '',
    description_vie: '',
    description_en: '',
    image_url: '',
    socialvideo_url: '',
    start_date: '2024/12/19',
    end_date: '2025/01/17',
    Status: 'End',
    art_medium: '',
    event_type: '',
    place_type: 'Others',
    city: 'Hanoi',
    district: 'Hoan Kiem District',
    is_virtual: 'Physical',
    registration_link: '',
    address_vi: 'Đình Tú Thị, 2A Phố Yên Thái, Phường Hàng Gai, Quận Hoàn Kiếm, Hà Nội',
    address_en: 'Tu Thi Temple, 2A Yen Thai Street, Hang Gai Ward, Hoan Kiem District, Hanoi'
  },
  {
    name_vie: 'Khuấy Khoả',
    name_en: '',
    description_vie: '',
    description_en: '',
    image_url: '',
    socialvideo_url: '',
    start_date: '2024/12/28',
    end_date: '2025/01/05',
    Status: 'End',
    art_medium: '',
    event_type: '',
    place_type: '',
    city: 'Hanoi',
    district: 'Hoan Kiem District',
    is_virtual: 'Physical',
    registration_link: '',
    address_vi: 'Trung tâm Thông tin & Triển lãm Hà Nội, 93 Đường Đinh Tiên Hoàng, Phường Tràng Tiền, Quận Hoàn Kiếm, Hà Nội',
    address_en: 'Hanoi Information & Exhibition Center, 93 Dinh Tien Hoang Street, Trang Tien Ward, Hoan Kiem District, Hanoi'
  },
  {
    name_vie: 'Festival Mỹ Thuật Trẻ',
    name_en: '',
    description_vie: '',
    description_en: '',
    image_url: '',
    socialvideo_url: '',
    start_date: '2024/11/29',
    end_date: '2025/02/06',
    Status: 'End',
    art_medium: '',
    event_type: 'Exhibition',
    place_type: 'Art Space',
    city: 'Hanoi',
    district: 'Thanh Xuan District',
    is_virtual: '',
    registration_link: '',
    address_vi: 'Trung tâm Nghệ thuật Đương đại Vincom, B1–R3, Vincom Mega Mall Royal City, 72A Đường Nguyễn Trãi, Phường Thượng Đình, Quận Thanh Xuân, Hà Nội',
    address_en: 'Vincom Center for Contemporary Art (VCCA), B1–R3, Vincom Mega Mall Royal City, 72A Nguyen Trai Street, Thuong Dinh Ward, Thanh Xuan District, Hanoi'
  },
  {
    name_vie: 'Từ Nhà Ra Công Viên',
    name_en: '',
    description_vie: '',
    description_en: '',
    image_url: '',
    socialvideo_url: '',
    start_date: '2024/12/10',
    end_date: '2025/02/23',
    Status: 'End',
    art_medium: '',
    event_type: 'Exhibition',
    place_type: 'Gallery',
    city: 'Hanoi',
    district: 'Hoan Kiem District',
    is_virtual: 'Physical',
    registration_link: '',
    address_vi: 'Mơ Art Space, Tầng B3, 136 Phố Hàng Trống, Phường Hàng Trống, Quận Hoàn Kiếm, Hà Nội',
    address_en: 'Mơ Art Space, Floor B3, 136 Hang Trong Street, Hang Trong Ward, Hoan Kiem District, Hanoi'
  },
  {
    name_vie: 'Mê Man',
    name_en: '',
    description_vie: '',
    description_en: '',
    image_url: '',
    socialvideo_url: '',
    start_date: '2025/03/18',
    end_date: '2025/05/02',
    Status: 'End',
    art_medium: '',
    event_type: '',
    place_type: '',
    city: '',
    district: '',
    is_virtual: '',
    registration_link: '',
    address_vi: '',
    address_en: ''
  },
  {
    name_vie: '',
    name_en: '21 Years of Galerie Quynh Exhibition',
    description_vie: '',
    description_en: '',
    image_url: '',
    socialvideo_url: '',
    start_date: '2025/03/21',
    end_date: '2025/06/21',
    Status: 'End',
    art_medium: '',
    event_type: '',
    place_type: '',
    city: '',
    district: '',
    is_virtual: '',
    registration_link: '',
    address_vi: '',
    address_en: ''
  },
  {
    name_vie: 'Những Gam Màu Tự Do',
    name_en: '',
    description_vie: '',
    description_en: '',
    image_url: '',
    socialvideo_url: '',
    start_date: '2025/04/18',
    end_date: '2025/05/04',
    Status: 'End',
    art_medium: '',
    event_type: '',
    place_type: '',
    city: '',
    district: '',
    is_virtual: '',
    registration_link: '',
    address_vi: '',
    address_en: ''
  },
  {
    name_vie: '50 năm thống nhất – xây dựng và phát triển Thành phố Hồ Chí Minh',
    name_en: '',
    description_vie: '',
    description_en: '',
    image_url: '',
    socialvideo_url: '',
    start_date: '2025/04/09',
    end_date: '2025/05/02',
    Status: 'End',
    art_medium: '',
    event_type: '',
    place_type: '',
    city: '',
    district: '',
    is_virtual: '',
    registration_link: '',
    address_vi: '',
    address_en: ''
  },
  {
    name_vie: 'Giữa Cỏ Xanh, Dưới Trời Sương Mát',
    name_en: 'Amidst Green grass, Beneath Misty Skies',
    description_vie: '',
    description_en: '',
    image_url: '',
    socialvideo_url: '',
    start_date: '2025/04/23',
    end_date: '2025/05/02',
    Status: 'End',
    art_medium: '',
    event_type: '',
    place_type: '',
    city: '',
    district: '',
    is_virtual: '',
    registration_link: '',
    address_vi: '',
    address_en: ''
  }
];

function formatDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  // Handle YYYY/MM/DD format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
  }
  return dateStr;
}

function transformEvent(raw, index) {
  const title = raw.name_en || raw.name_vie || `Event ${index + 1}`;
  const description = raw.description_en || raw.description_vie || '';
  const address = raw.address_en || raw.address_vi || '';
  const location = address || `${raw.district || ''} ${raw.city || ''}`.trim() || 'Vietnam';
  
  const coords = getCoordinates(raw.city || '', raw.district || '');
  const organizer = extractOrganizer(description, address);
  
  const media = [];
  if (raw.socialvideo_url) {
    media.push({ type: 'video', url: raw.socialvideo_url });
  }
  if (raw.image_url) {
    media.push({ type: 'image', url: raw.image_url });
  }
  
  // Try camelCase first (as used in TypeScript types)
  const event = {
    id: `event-${Date.now()}-${index}`,
    title,
    organizer,
    startDate: formatDate(raw.start_date),
    endDate: formatDate(raw.end_date),
    location,
    lat: coords.lat,
    lng: coords.lng,
    imageUrl: raw.image_url || 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?auto=format&fit=crop&q=80&w=1200'
  };
  
  // Only add optional fields if they have values
  if (description) {
    event.description = description;
  }
  if (media.length > 0) {
    event.media = media;
  }
  
  return event;
}

async function seedEvents() {
  try {
    console.log('Connecting to Supabase...');
    
    // First, delete all existing events (sample data)
    console.log('Deleting existing events...');
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .neq('id', 'dummy'); // Delete all (neq with dummy ensures all are deleted)
    
    if (deleteError && deleteError.code !== 'PGRST116') { // PGRST116 = no rows to delete
      console.warn('Delete warning:', deleteError.message);
    }
    
    // Transform and insert events
    console.log('Transforming events...');
    const events = rawEvents
      .filter(raw => raw.name_vie || raw.name_en) // Only include events with names
      .map((raw, index) => transformEvent(raw, index));
    
    console.log(`Inserting ${events.length} events...`);
    
    // Insert in batches of 10 to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from('events')
        .insert(batch)
        .select();
      
      if (error) {
        console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
      } else {
        console.log(`✓ Inserted batch ${Math.floor(i / batchSize) + 1} (${batch.length} events)`);
      }
    }
    
    console.log('✅ Successfully seeded events!');
    console.log(`Total events inserted: ${events.length}`);
    
  } catch (error) {
    console.error('Error seeding events:', error);
    process.exit(1);
  }
}

seedEvents();
