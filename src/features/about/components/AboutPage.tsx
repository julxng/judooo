import { Card } from '@ui/Card';
import type { Locale as Language } from '@/lib/i18n/translations';

interface AboutPageProps {
  language: Language;
}

const aboutCopy = {
  vi: {
    intro:
      'judooo là một lớp hạ tầng khám phá nghệ thuật dành cho cộng đồng yêu nghệ thuật tại Việt Nam.',
    detail:
      'Chúng mình tổng hợp triển lãm, tác phẩm và những mối nối quan trọng giữa công chúng, nghệ sĩ và không gian trưng bày.',
  },
  en: {
    intro:
      'judooo is an art discovery infrastructure layer for the Vietnamese art community.',
    detail:
      'We aggregate exhibitions, artworks, and the connective tissue between audiences, artists, and exhibition spaces.',
  },
} as const;

export const AboutPage = ({ language }: AboutPageProps) => {
  const copy = aboutCopy[language];

  return (
    <div className="about-page">
      <Card className="hero-panel about-page__hero">
        <p className="eyebrow">About Judooo</p>
        <h2 className="section-title">{copy.intro}</h2>
        <p className="muted-text">{copy.detail}</p>
      </Card>

      <div className="about-page__grid">
        <Card className="detail-panel">
          <p className="eyebrow">Contact</p>
          <a href="mailto:judooovietnam@gmail.com">judooovietnam@gmail.com</a>
          <p className="muted-text">Facebook, Instagram, Threads, and TikTok: `@judooo.art`</p>
        </Card>
        <Card className="detail-panel">
          <p className="eyebrow">Privacy</p>
          <p className="muted-text">
            Judooo stores only the information needed to operate accounts, saved routes, and catalog workflows.
          </p>
        </Card>
        <Card className="detail-panel">
          <p className="eyebrow">Terms</p>
          <p className="muted-text">
            Public data is presented for discovery and reference. External links remain governed by their source sites.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default AboutPage;
