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
    kicker: 'Ve chung minh',
    title:
      'judooo dang xay dung ban do nghe thuat cho nhung ai muon viec tim, theo doi va ghe tham nghe thuat Viet Nam tro nen de hon.',
    primaryBody:
      'judooo la du an ban do nghe thuat danh cho cong dong yeu nghe thuat. Chung minh tong hop, gioi thieu va luu tru cac su kien nghe thuat dang dien ra tren khap Viet Nam de viec kham pha bot mat cong hon.',
    secondaryBody:
      'Muc tieu rat ro rang: giam bot kho khan khi tim thong tin huu ich, dong thoi giup nhieu nguoi ket noi voi nghe si, khong gian va doi song van hoa tai Viet Nam.',
    whatWeDo: {
      kicker: 'Chung minh lam gi',
      title: 'Su kien, kham pha va lap lo trinh',
      body:
        'judooo dua trien lam, workshop, talk, performance va dau gia nghe thuat vao mot noi de tim kiem, sau do bien danh sach da luu thanh lo trinh tham quan thuc te.',
    },
    whyItMatters: {
      kicker: 'Vi sao quan trong',
      title: 'Cau noi vao nghe thuat Viet Nam',
      body:
        'Nen tang duoc thiet ke cho nhung nguoi yeu nghe thuat nhung khong phai luc nao cung biet can tim o dau, len lich the nao hay nen theo doi khong gian nao.',
    },
    contact: {
      kicker: 'Lien he',
      title: 'Giu lien lac',
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
          <p className="text-sm leading-7 text-muted-foreground">{copy.primaryBody}</p>
          <p className="text-sm leading-7 text-muted-foreground">{copy.secondaryBody}</p>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <p className="section-kicker">{copy.whatWeDo.kicker}</p>
          <h2 className="mt-4 font-display text-[1.5rem] leading-[0.98] tracking-[-0.04em]">{copy.whatWeDo.title}</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {copy.whatWeDo.body}
          </p>
        </Card>
        <Card className="p-6">
          <p className="section-kicker">{copy.whyItMatters.kicker}</p>
          <h2 className="mt-4 font-display text-[1.5rem] leading-[0.98] tracking-[-0.04em]">{copy.whyItMatters.title}</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {copy.whyItMatters.body}
          </p>
        </Card>
        <Card className="p-6">
          <p className="section-kicker">{copy.contact.kicker}</p>
          <h2 className="mt-4 font-display text-[1.5rem] leading-[0.98] tracking-[-0.04em]">{copy.contact.title}</h2>
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
