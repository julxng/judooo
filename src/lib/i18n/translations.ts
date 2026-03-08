export type Locale = 'vi' | 'en';

type TermsPrivacyItem = { title: string; body: string };

type TranslationSchema = {
  nav: {
    artists: string;
    artworks: string;
    events: string;
    login: string;
    signup: string;
    signout: string;
  };
  footer: {
    tagline: string;
    about: string;
    contact: string;
    terms: string;
    privacy: string;
  };
  home: {
    hero: {
      titleLine1: string;
      titleHighlight: string;
      subtitle: string;
      browseArtworks: string;
      meetArtists: string;
    };
    featured: {
      title: string;
      viewAll: string;
    };
    cta: {
      title: string;
      subtitle: string;
      button: string;
    };
  };
  about: {
    title: string;
    body: string;
  };
  contact: {
    title: string;
    email: string;
    socialMedia: string;
  };
  terms: {
    title: string;
    intro: string;
    items: TermsPrivacyItem[];
    outro: string;
  };
  privacy: {
    title: string;
    intro: string;
    items: TermsPrivacyItem[];
    outro: string;
  };
};

export const translations: Record<Locale, TranslationSchema> = {
  vi: {
    nav: {
      artists: 'Nghệ sĩ',
      artworks: 'Tác phẩm',
      events: 'Sự kiện',
      login: 'Đăng nhập',
      signup: 'Đăng ký',
      signout: 'Đăng xuất',
    },
    footer: {
      tagline: 'Nền tảng nghệ thuật Việt Nam.',
      about: 'Về chúng mình',
      contact: 'Liên hệ',
      terms: 'Điều khoản',
      privacy: 'Bảo mật',
    },
    home: {
      hero: {
        titleLine1: 'Nghệ thuật Việt Nam,',
        titleHighlight: 'khám phá ngay.',
        subtitle:
          'Nền tảng kết nối người yêu nghệ thuật với các nghệ sĩ đương đại tài năng nhất Việt Nam.',
        browseArtworks: 'Khám phá tác phẩm',
        meetArtists: 'Gặp gỡ nghệ sĩ',
      },
      featured: {
        title: 'Nghệ sĩ nổi bật',
        viewAll: 'Xem tất cả →',
      },
      cta: {
        title: 'Bạn là nghệ sĩ?',
        subtitle:
          'Tham gia Judooo để giới thiệu tác phẩm và kết nối với người yêu nghệ thuật khắp Việt Nam và thế giới.',
        button: 'Tham gia với tư cách nghệ sĩ',
      },
    },
    about: {
      title: 'Về chúng mình',
      body: 'Xin chào, bọn mình là judooo, một dự án bản đồ nghệ thuật dành cho cộng đồng yêu nghệ thuật! Chúng mình tổng hợp, giới thiệu và lưu trữ các sự kiện nghệ thuật đã, đang và sẽ diễn ra ở Việt Nam. Hiểu rằng đôi khi việc tìm kiếm thông tin về các sự kiện nghệ thuật đôi khi khá khó khăn và mất thời gian, judooo là một nền tảng xoá đi những trở ngại đó cũng như trở thành cầu nối giữa mọi người và thế giới nghệ thuật Việt Nam.',
    },
    contact: {
      title: 'Liên hệ',
      email: 'Email',
      socialMedia: 'Mạng xã hội',
    },
    terms: {
      title: 'Điều khoản sử dụng',
      intro:
        'Chào bạn đến với judooo! Chúng mình là một nền tảng chia sẻ thông tin về các sự kiện nghệ thuật ở Việt Nam. Dưới đây là một vài điều khoản ngắn gọn để đảm bảo mọi người có trải nghiệm tốt nhất:',
      items: [
        {
          title: 'Sử dụng judooo',
          body: 'Bạn có thể tự do tìm kiếm và tham khảo thông tin trên judooo cho mục đích cá nhân.',
        },
        {
          title: 'Nội dung',
          body: 'Chúng mình sẽ cố gắng hết sức để đảm bảo thông tin chính xác và mới nhất. Tuy nhiên, sai xót đôi khi vẫn có thể xảy ra. Vì vậy, hãy kiểm tra lại thông tin nếu cần thiết nhé.',
        },
        {
          title: 'Liên kết ngoài',
          body: 'judooo có thể chứa các liên kết đến trang web khác. Chúng mình không chịu trách nhiệm về nội dung của các trang web đó.',
        },
        {
          title: 'Thay đổi',
          body: 'Chúng mình có thể cập nhật các điều khoản này theo thời gian. Chúng mình sẽ thông báo những thay đổi quan trọng trên nền tảng.',
        },
      ],
      outro:
        'Chúng mình mong muốn judooo là một không gian thân thiện và hữu ích cho cộng đồng yêu nghệ thuật. Nếu bạn có bất kỳ câu hỏi hoặc góp ý nào, đừng ngần ngại liên hệ với chúng mình nhé!',
    },
    privacy: {
      title: 'Chính sách bảo mật',
      intro:
        'Chào bạn! Tại judooo, chúng mình coi trọng quyền riêng tư của bạn. Đây là cách chúng mình xử lý thông tin của bạn:',
      items: [
        {
          title: 'Thông tin chúng mình thu thập',
          body: 'Chúng mình chỉ thu thập thông tin cần thiết để vận hành judooo một cách tốt nhất, ví dụ như thông tin bạn cung cấp khi liên hệ với chúng mình (như email). Chúng mình không tự động thu thập thông tin cá nhân nhạy cảm của bạn.',
        },
        {
          title: 'Cách chúng mình sử dụng thông tin',
          body: 'Thông tin bạn cung cấp giúp chúng mình trả lời câu hỏi của bạn, cải thiện judooo và giữ liên lạc với bạn (nếu bạn muốn). Chúng mình cam kết không chia sẻ thông tin của bạn với bất kỳ bên thứ ba nào mà không có sự đồng ý của bạn.',
        },
        {
          title: 'Cookies',
          body: 'Chúng mình có thể sử dụng cookies để cải thiện trải nghiệm của bạn trên judooo. Cookies là những tệp nhỏ được lưu trữ trên thiết bị của bạn. Bạn có thể tắt cookies trong cài đặt trình duyệt của mình nếu muốn.',
        },
        {
          title: 'Bảo mật',
          body: 'Chúng mình áp dụng các biện pháp bảo mật hợp lý để bảo vệ thông tin của bạn. Tuy nhiên, không có phương pháp truyền tải dữ liệu qua internet nào là hoàn toàn an toàn.',
        },
        {
          title: 'Liên hệ với chúng mình',
          body: 'Nếu bạn có bất kỳ câu hỏi nào về chính sách bảo mật này, đừng ngần ngại liên hệ với chúng mình nhé!',
        },
      ],
      outro:
        'Chúng mình luôn nỗ lực để bảo vệ quyền riêng tư của bạn và tạo ra một môi trường an toàn và tin cậy trên judooo.',
    },
  },

  en: {
    nav: {
      artists: 'Artists',
      artworks: 'Artworks',
      events: 'Events',
      login: 'Log in',
      signup: 'Sign up',
      signout: 'Sign out',
    },
    footer: {
      tagline: 'Vietnamese art marketplace.',
      about: 'About',
      contact: 'Contact',
      terms: 'Terms',
      privacy: 'Privacy',
    },
    home: {
      hero: {
        titleLine1: 'Vietnamese art,',
        titleHighlight: 'discovered.',
        subtitle:
          "A marketplace connecting collectors with Vietnam's most talented contemporary artists.",
        browseArtworks: 'Browse Artworks',
        meetArtists: 'Meet the Artists',
      },
      featured: {
        title: 'Featured Artists',
        viewAll: 'View all →',
      },
      cta: {
        title: 'Are you an artist?',
        subtitle:
          'Join Judooo to showcase your work and connect with collectors across Vietnam and beyond.',
        button: 'Join as Artist',
      },
    },
    about: {
      title: 'About Us',
      body: "Hello, we are judooo, an art map project for the art-loving community! We collect, introduce, and archive art events that have happened, are happening, and will happen in Vietnam. Understanding that finding information about art events can sometimes be difficult and time-consuming, judooo is a platform that removes those obstacles and becomes a bridge between people and the Vietnamese art world.",
    },
    contact: {
      title: 'Contact Us',
      email: 'Email',
      socialMedia: 'Social Media',
    },
    terms: {
      title: 'Terms and Conditions',
      intro:
        "Welcome to judooo! We're a platform sharing information about art events in Vietnam. Here are a few brief terms to ensure everyone has the best experience:",
      items: [
        {
          title: 'Using judooo',
          body: 'You are free to search and refer to information on judooo for personal use.',
        },
        {
          title: 'Content',
          body: 'We try our best to ensure accurate and up-to-date information. However, mistakes can sometimes happen. Therefore, please double-check information if necessary.',
        },
        {
          title: 'External Links',
          body: 'judooo may contain links to other websites. We are not responsible for the content of those websites.',
        },
        {
          title: 'Changes',
          body: 'We may update these terms from time to time. We will announce important changes on the platform.',
        },
      ],
      outro:
        "We want judooo to be a friendly and helpful space for the art-loving community. If you have any questions or feedback, please don't hesitate to contact us!",
    },
    privacy: {
      title: 'Privacy Policy',
      intro: "Hi there! At judooo, we value your privacy. Here's how we handle your information:",
      items: [
        {
          title: 'Information we collect',
          body: 'We only collect the information necessary to operate judooo effectively, such as information you provide when contacting us (like your email). We do not automatically collect your sensitive personal information.',
        },
        {
          title: 'How we use information',
          body: "The information you provide helps us answer your questions, improve judooo, and stay in touch with you (if you'd like). We promise not to share your information with any third parties without your consent.",
        },
        {
          title: 'Cookies',
          body: 'We may use cookies to improve your experience on judooo. Cookies are small files stored on your device. You can disable cookies in your browser settings if you prefer.',
        },
        {
          title: 'Security',
          body: 'We take reasonable security measures to protect your information. However, no method of data transmission over the internet is completely secure.',
        },
        {
          title: 'Contact us',
          body: "If you have any questions about this privacy policy, please don't hesitate to contact us!",
        },
      ],
      outro:
        'We are always working hard to protect your privacy and create a safe and trustworthy environment on judooo.',
    },
  },
};
