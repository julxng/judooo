import { Card } from '@/components/ui/Card';

type LegalSection = {
  heading: string;
  body: string[];
};

interface LegalPageProps {
  title: string;
  intro: string;
  sections: LegalSection[];
}

export const LegalPage = ({ title, intro, sections }: LegalPageProps) => (
  <div className="space-y-8">
    <section className="border-b border-border pb-8">
      <p className="section-kicker">{title}</p>
      <h1 className="section-heading mt-4 max-w-3xl">{title}</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">{intro}</p>
    </section>

    <div className="space-y-4">
      {sections.map((section) => (
        <Card key={section.heading} className="p-6 sm:p-8">
          <h2 className="font-display text-[1.45rem] leading-[0.98] tracking-[-0.04em]">{section.heading}</h2>
          <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Card>
      ))}
    </div>
  </div>
);
