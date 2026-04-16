'use client';

import { useLanguage } from '@/app/providers';
import { Card } from '@/components/ui/Card';
import type { Locale as Language } from '@/lib/i18n/translations';

interface AboutPageProps {
  language?: Language;
}

const aboutPageCopy: Record<
  Language,
  {
    kicker: string;
    title: string;
    primaryBody: string;
    secondaryBody: string;
    whatWeDo: {
      kicker: string;
      title: string;
      body: string;
    };
    whyItMatters: {
      kicker: string;
      title: string;
      body: string;
    };
    contact: {
      kicker: string;
      title: string;
    };
  }
> = {
  en: {
    kicker: 'About Us',
    title:
      'judooo is building an art map for people who want Vietnamese art to feel easier to find, follow, and visit.',
    primaryBody:
      'judooo is an art map project for people who want a clearer way into the Vietnamese art scene. We collect, introduce, and archive events happening across the country so discovery takes less effort.',
    secondaryBody:
      'The goal is simple: remove the friction of finding good information, then help more people connect with artists, spaces, and cultural activity around Vietnam.',
    whatWeDo: {
      kicker: 'What We Do',
      title: 'Events, discovery, and route planning',
      body:
        'judooo brings exhibitions, performances, workshops, talks, and art auctions into one searchable place, then turns saved events into an actual route.',
    },
    whyItMatters: {
      kicker: 'Why It Matters',
      title: 'A bridge into Vietnamese art',
      body:
        'The platform is designed for people who love art but do not always know where to look, how to plan a visit, or which spaces to follow.',
    },
    contact: {
      kicker: 'Contact',
      title: 'Stay in touch',
    },
  },
  vi: {
    kicker: 'Về chúng mình',
    title:
      'judooo đang xây dựng bản đồ nghệ thuật cho những ai muốn việc tìm, theo dõi và ghé thăm nghệ thuật Việt Nam trở nên dễ hơn.',
    primaryBody:
      'judooo là dự án bản đồ nghệ thuật dành cho cộng đồng yêu nghệ thuật. Chúng mình tổng hợp, giới thiệu và lưu trữ các sự kiện nghệ thuật đang diễn ra trên khắp Việt Nam để việc khám phá bớt mất công hơn.',
    secondaryBody:
      'Mục tiêu rất rõ ràng: giảm bớt khó khăn khi tìm thông tin hữu ích, đồng thời giúp nhiều người kết nối với nghệ sĩ, không gian và đời sống văn hóa tại Việt Nam.',
    whatWeDo: {
      kicker: 'Chúng mình làm gì',
      title: 'Sự kiện, khám phá và lập lộ trình',
      body:
        'judooo đưa triển lãm, workshop, talk, performance và đấu giá nghệ thuật vào một nơi để tìm kiếm, sau đó biến danh sách đã lưu thành lộ trình tham quan thực tế.',
    },
    whyItMatters: {
      kicker: 'Vì sao quan trọng',
      title: 'Cầu nối vào nghệ thuật Việt Nam',
      body:
        'Nền tảng được thiết kế cho những người yêu nghệ thuật nhưng không phải lúc nào cũng biết cần tìm ở đâu, lên lịch thế nào hay nên theo dõi không gian nào.',
    },
    contact: {
      kicker: 'Liên hệ',
      title: 'Giữ liên lạc',
    },
  },
};

export const AboutPage = ({ language: languageProp }: AboutPageProps) => {
  const { language: activeLanguage } = useLanguage();
  const language = languageProp ?? activeLanguage;
  const copy = aboutPageCopy[language];

  return (
    <div className="space-y-10">
      <section className="border-b border-border pb-8">
        <p className="section-kicker">{copy.kicker}</p>
        <h1 className="section-heading mt-4 max-w-4xl">
          {copy.title}
        </h1>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <p className="text-sm leading-6 text-muted-foreground">{copy.primaryBody}</p>
          <p className="text-sm leading-6 text-muted-foreground">{copy.secondaryBody}</p>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <p className="section-kicker">{copy.whatWeDo.kicker}</p>
          <h2 className="mt-4 font-display text-[1.5rem] leading-[1.1] tracking-[-0.04em]">{copy.whatWeDo.title}</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {copy.whatWeDo.body}
          </p>
        </Card>
        <Card className="p-6">
          <p className="section-kicker">{copy.whyItMatters.kicker}</p>
          <h2 className="mt-4 font-display text-[1.5rem] leading-[1.1] tracking-[-0.04em]">{copy.whyItMatters.title}</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {copy.whyItMatters.body}
          </p>
        </Card>
        <Card className="p-6">
          <p className="section-kicker">{copy.contact.kicker}</p>
          <h2 className="mt-4 font-display text-[1.5rem] leading-[1.1] tracking-[-0.04em]">{copy.contact.title}</h2>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <p>judooovietnam@gmail.com</p>
            <p>Facebook: judooo.art</p>
            <p>Instagram: judooo.art</p>
            <p>Threads: @judooo.art</p>
            <p>TikTok: @judooo.art</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AboutPage;
