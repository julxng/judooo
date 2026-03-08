import { useMemo, useState } from 'react';
import './theme.css';
import { designTokens } from './designTokens';
import {
  JudoooButton,
  JudoooCard,
  JudoooInput,
  JudoooModal,
  JudoooNavbar,
  JudoooSidebar,
} from './components';

interface PreviewSidebarItem {
  id: string;
  label: string;
  note?: string;
}

interface PreviewSidebarSection {
  title: string;
  items: PreviewSidebarItem[];
}

const sidebarSections: PreviewSidebarSection[] = [
  {
    title: 'Foundations',
    items: [
      { id: 'overview', label: 'Overview', note: 'Brand cues and references' },
      { id: 'tokens', label: 'Tokens', note: 'Color, type, surface, spacing' },
    ],
  },
  {
    title: 'Components',
    items: [
      { id: 'button', label: 'Button', note: 'Editorial CTAs and quiet actions' },
      { id: 'input', label: 'Input', note: 'Search and form controls' },
      { id: 'card', label: 'Card', note: 'Image-first content blocks' },
      { id: 'modal', label: 'Modal', note: 'Detail surfaces and actions' },
      { id: 'navigation', label: 'Navigation', note: 'Navbar and sidebar' },
    ],
  },
];

const featureCards = [
  {
    eyebrow: 'Collection',
    title: 'Quiet luxury, then Judooo orange where action matters.',
    description:
      'The reference language is monochrome and editorial. Judooo shifts the accent system to ember orange so calls-to-action feel native to the brand instead of generic gallery black.',
  },
  {
    eyebrow: 'Typography',
    title: 'Serif for narrative. Mono for utility. Sans for everything else.',
    description:
      'This keeps the Artsy-inspired rhythm without pretending to be Artsy. The vibe becomes more tactile and a little warmer, which fits Judooo’s identity better.',
  },
];

const palette = [
  ['Ember', designTokens.brand.accent],
  ['Ember Deep', designTokens.brand.accentDeep],
  ['Ink', designTokens.brand.ink],
  ['Smoke', designTokens.brand.smoke],
  ['Paper', designTokens.brand.paper],
  ['Canvas', designTokens.brand.canvas],
  ['Mist', designTokens.brand.mist],
  ['Stone', designTokens.brand.stone],
] as const;

export const JudoooDesignSystemPage = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sectionTitle = useMemo(() => {
    const allItems = sidebarSections.flatMap((section) => section.items);
    return allItems.find((item) => item.id === activeSection)?.label ?? 'Overview';
  }, [activeSection]);

  return (
    <div className="judooo-ds">
      <JudoooNavbar
        items={[
          { label: 'Collect', active: true },
          { label: 'Shows' },
          { label: 'Artists' },
          { label: 'Library' },
        ]}
        actions={
          <>
            <div className="jd:hidden jd:w-72 md:jd:block">
              <JudoooInput aria-label="Search design system" placeholder="Search artists, fairs, works" />
            </div>
            <JudoooButton variant="primary">Join Judooo</JudoooButton>
          </>
        }
      />

      <div className="judooo-ds__grid">
        <div className="jd:mx-auto jd:grid jd:w-full jd:max-w-7xl jd:gap-6 jd:px-5 jd:py-6 md:jd:grid-cols-[300px_minmax(0,1fr)] md:jd:px-8">
          <JudoooSidebar
            title="Judooo Tailwind"
            sections={sidebarSections}
            activeItemId={activeSection}
            onSelect={setActiveSection}
            footer={
              <div className="jd:rounded-2xl jd:bg-judooo-canvas jd:p-4">
                <p className="jd:m-0 jd:font-mono jd:text-[11px] jd:uppercase jd:tracking-[0.22em] jd:text-judooo-smoke">
                  Reference
                </p>
                <p className="jd:mt-2 jd:mb-0 jd:text-sm jd:leading-6 jd:text-judooo-smoke">
                  Artsy-inspired proportions and restraint, but re-keyed to Judooo’s ember palette and warmer editorial tone.
                </p>
              </div>
            }
          />

          <main className="jd:flex jd:flex-col jd:gap-6">
            <section className="jd:relative jd:overflow-hidden jd:rounded-[36px] jd:border jd:border-judooo-ink/8 jd:bg-judooo-paper jd:p-6 jd:shadow-judooo-float md:jd:p-8">
              <div className="judooo-ds__hero-glow" />
              <div className="jd:relative jd:z-10 jd:grid jd:gap-8 lg:jd:grid-cols-[minmax(0,1.15fr)_320px]">
                <div className="jd:flex jd:flex-col jd:gap-5">
                  <p className="jd:m-0 jd:font-mono jd:text-[11px] jd:font-semibold jd:uppercase jd:tracking-[0.28em] jd:text-judooo-ember">
                    Design System
                  </p>
                  <h1 className="jd:m-0 jd:max-w-4xl jd:font-serif jd:text-[clamp(3.25rem,7vw,6rem)] jd:leading-[0.88] jd:text-judooo-ink">
                    Editorial commerce for Judooo, not a full app redesign.
                  </h1>
                  <p className="jd:m-0 jd:max-w-2xl jd:text-base jd:leading-7 jd:text-judooo-smoke">
                    This library isolates an Artsy-like visual system into reusable React + Tailwind components, then bends it toward Judooo through warm neutrals, ember accents, and softer cultural-editorial framing.
                  </p>
                  <div className="jd:flex jd:flex-wrap jd:gap-3">
                    <JudoooButton variant="primary" size="lg" onClick={() => setIsModalOpen(true)}>
                      Open Modal Demo
                    </JudoooButton>
                    <JudoooButton variant="secondary" size="lg">
                      Export Tokens
                    </JudoooButton>
                    <JudoooButton variant="ghost" size="lg">
                      Browse Components
                    </JudoooButton>
                  </div>
                </div>

                <div className="jd:flex jd:flex-col jd:gap-3 jd:rounded-[28px] jd:border jd:border-judooo-ink/8 jd:bg-judooo-canvas jd:p-5">
                  <p className="jd:m-0 jd:font-mono jd:text-[11px] jd:font-semibold jd:uppercase jd:tracking-[0.24em] jd:text-judooo-smoke">
                    Current Section
                  </p>
                  <h2 className="jd:m-0 jd:font-serif jd:text-4xl jd:leading-none jd:text-judooo-ink">{sectionTitle}</h2>
                  <p className="jd:m-0 jd:text-sm jd:leading-6 jd:text-judooo-smoke">
                    Components are intentionally quiet, image-led, and typography-forward so the art remains the focus.
                  </p>
                  <div className="jd:grid jd:grid-cols-2 jd:gap-3 jd:pt-3">
                    <div className="jd:rounded-2xl jd:bg-judooo-paper jd:p-4">
                      <strong className="jd:block jd:font-serif jd:text-3xl jd:leading-none">6</strong>
                      <span className="jd:font-mono jd:text-[10px] jd:uppercase jd:tracking-[0.22em] jd:text-judooo-smoke">
                        core components
                      </span>
                    </div>
                    <div className="jd:rounded-2xl jd:bg-judooo-paper jd:p-4">
                      <strong className="jd:block jd:font-serif jd:text-3xl jd:leading-none">3</strong>
                      <span className="jd:font-mono jd:text-[10px] jd:uppercase jd:tracking-[0.22em] jd:text-judooo-smoke">
                        font roles
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="jd:grid jd:gap-6 xl:jd:grid-cols-2">
              {featureCards.map((card) => (
                <JudoooCard
                  key={card.title}
                  eyebrow={card.eyebrow}
                  title={card.title}
                  description={card.description}
                  footer={
                    <>
                      <span className="jd:font-mono jd:text-[11px] jd:uppercase jd:tracking-[0.22em] jd:text-judooo-smoke">
                        reference: {designTokens.reference.source}
                      </span>
                      <span className="jd:h-2 jd:w-2 jd:rounded-full jd:bg-judooo-ember" />
                    </>
                  }
                />
              ))}
            </section>

            <section className="jd:grid jd:gap-6 xl:jd:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
              <div className="jd:flex jd:flex-col jd:gap-6">
                <JudoooCard
                  eyebrow="Buttons"
                  title="Actions"
                  description="Primary actions stay dark and assertive. Secondary actions stay paper-white with quiet borders. Ember appears on hover and focus."
                >
                  <div className="jd:flex jd:flex-wrap jd:gap-3">
                    <JudoooButton variant="primary">Bid now</JudoooButton>
                    <JudoooButton variant="secondary">View details</JudoooButton>
                    <JudoooButton variant="ghost">Save</JudoooButton>
                  </div>
                </JudoooCard>

                <JudoooCard
                  eyebrow="Inputs"
                  title="Search + forms"
                  description="Inputs are minimal and generous, with soft corners and a warm paper field rather than hard enterprise-gray form chrome."
                >
                  <div className="jd:grid jd:gap-4 md:jd:grid-cols-2">
                    <JudoooInput label="Search" placeholder="Artist, show, or medium" hint="Mono labels keep forms feeling curated." />
                    <JudoooInput label="Email" placeholder="collector@judooo.art" />
                  </div>
                </JudoooCard>

                <JudoooCard
                  eyebrow="Navigation"
                  title="Shell patterns"
                  description="Navigation is light and editorial. Labels read like sections in a magazine rather than app tabs."
                >
                  <div className="jd:flex jd:flex-wrap jd:gap-3">
                    <span className="jd:rounded-full jd:bg-judooo-ink jd:px-4 jd:py-2 jd:font-mono jd:text-[11px] jd:uppercase jd:tracking-[0.22em] jd:text-judooo-paper">
                      active
                    </span>
                    <span className="jd:rounded-full jd:bg-judooo-mist jd:px-4 jd:py-2 jd:font-mono jd:text-[11px] jd:uppercase jd:tracking-[0.22em] jd:text-judooo-smoke">
                      default
                    </span>
                    <span className="jd:rounded-full jd:bg-judooo-ember/10 jd:px-4 jd:py-2 jd:font-mono jd:text-[11px] jd:uppercase jd:tracking-[0.22em] jd:text-judooo-ember">
                      accent
                    </span>
                  </div>
                </JudoooCard>
              </div>

              <JudoooCard
                eyebrow="Palette"
                title="Warm monochrome with ember accents."
                description="The reference uses black, white, and restraint. Judooo keeps the restraint but swaps the emotional center from pure black to ember orange plus warmer papers."
              >
                <div className="jd:grid jd:grid-cols-2 jd:gap-3">
                  {palette.map(([label, value]) => (
                    <div key={label} className="jd:flex jd:items-center jd:gap-3 jd:rounded-2xl jd:bg-judooo-canvas jd:p-3">
                      <span className="jd:block jd:h-10 jd:w-10 jd:rounded-full jd:ring-1 jd:ring-judooo-ink/8" style={{ backgroundColor: value }} />
                      <div>
                        <p className="jd:m-0 jd:font-mono jd:text-[11px] jd:uppercase jd:tracking-[0.18em] jd:text-judooo-ink">{label}</p>
                        <p className="jd:m-0 jd:text-xs jd:text-judooo-smoke">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </JudoooCard>
            </section>

            <section className="jd:grid jd:gap-6 xl:jd:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
              <JudoooCard
                eyebrow="Cards"
                title="Image-first surfaces"
                description="Cards keep the image dominant, then switch to serif narrative below. This is the clearest borrowed pattern from the reference, but the warmer palette keeps it feeling like Judooo."
                media={
                  <img
                    src="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1200&q=80"
                    alt="Gallery wall"
                    className="jd:h-full jd:w-full jd:object-cover"
                  />
                }
                footer={
                  <>
                    <span className="jd:font-mono jd:text-[11px] jd:uppercase jd:tracking-[0.2em] jd:text-judooo-smoke">
                      Ho Chi Minh City
                    </span>
                    <JudoooButton variant="secondary" size="sm">
                      View work
                    </JudoooButton>
                  </>
                }
              >
                <div className="jd:flex jd:items-center jd:justify-between jd:gap-4">
                  <div>
                    <p className="jd:m-0 jd:text-sm jd:text-judooo-smoke">Current bid</p>
                    <p className="jd:m-0 jd:font-serif jd:text-3xl jd:leading-none jd:text-judooo-ink">18,500,000 VND</p>
                  </div>
                  <span className="jd:rounded-full jd:bg-judooo-ember/10 jd:px-3 jd:py-2 jd:font-mono jd:text-[11px] jd:uppercase jd:tracking-[0.2em] jd:text-judooo-ember">
                    Auction
                  </span>
                </div>
              </JudoooCard>

              <div className="jd:grid jd:gap-6">
                <JudoooCard
                  eyebrow="Typography"
                  title="Type roles"
                  description="Playfair Display handles story and atmosphere, IBM Plex Mono handles metadata, and Inter carries interface copy."
                >
                  <div className="jd:grid jd:gap-4">
                    <div className="jd:rounded-2xl jd:bg-judooo-canvas jd:p-4">
                      <p className="jd:m-0 jd:font-serif jd:text-4xl jd:leading-none">Curated Collection</p>
                    </div>
                    <div className="jd:rounded-2xl jd:bg-judooo-canvas jd:p-4">
                      <p className="jd:m-0 jd:font-mono jd:text-[11px] jd:uppercase jd:tracking-[0.24em]">Collector utilities</p>
                    </div>
                    <div className="jd:rounded-2xl jd:bg-judooo-canvas jd:p-4">
                      <p className="jd:m-0 jd:text-sm jd:leading-6">Readable interface copy with softer editorial rhythm.</p>
                    </div>
                  </div>
                </JudoooCard>

                <JudoooCard
                  eyebrow="Modal"
                  title="Detail panels"
                  description="Modals are framed as quiet editorial sheets rather than heavy app dialogs."
                  footer={
                    <>
                      <span className="jd:text-sm jd:text-judooo-smoke">Open the demo to inspect spacing and hierarchy.</span>
                      <JudoooButton variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
                        Preview modal
                      </JudoooButton>
                    </>
                  }
                />
              </div>
            </section>
          </main>
        </div>
      </div>

      <JudoooModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Judooo modal system"
        subtitle="Built for artwork and event detail flows: quiet framing, serif hierarchy, mono metadata, and strong action clustering."
        footer={
          <>
            <JudoooButton variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </JudoooButton>
            <JudoooButton variant="primary">Continue</JudoooButton>
          </>
        }
      >
        <div className="jd:grid jd:gap-6 md:jd:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <img
            src="https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80"
            alt="Exhibition room"
            className="jd:h-full jd:min-h-72 jd:w-full jd:rounded-[24px] jd:object-cover"
          />
          <div className="jd:flex jd:flex-col jd:gap-4">
            <div className="jd:flex jd:flex-wrap jd:gap-2">
              {designTokens.reference.traits.map((trait) => (
                <span
                  key={trait}
                  className="jd:rounded-full jd:bg-judooo-canvas jd:px-3 jd:py-2 jd:font-mono jd:text-[10px] jd:uppercase jd:tracking-[0.18em] jd:text-judooo-smoke"
                >
                  {trait}
                </span>
              ))}
            </div>
            <p className="jd:m-0 jd:text-sm jd:leading-7 jd:text-judooo-smoke">
              This component library is meant to be a foundation layer. It is not wired into the live Judooo screens unless you choose to adopt these pieces later.
            </p>
            <div className="jd:grid jd:grid-cols-2 jd:gap-3">
              <div className="jd:rounded-2xl jd:bg-judooo-canvas jd:p-4">
                <p className="jd:m-0 jd:font-mono jd:text-[10px] jd:uppercase jd:tracking-[0.22em] jd:text-judooo-smoke">
                  Accent
                </p>
                <p className="jd:mt-2 jd:mb-0 jd:font-serif jd:text-3xl jd:leading-none jd:text-judooo-ink">Ember</p>
              </div>
              <div className="jd:rounded-2xl jd:bg-judooo-canvas jd:p-4">
                <p className="jd:m-0 jd:font-mono jd:text-[10px] jd:uppercase jd:tracking-[0.22em] jd:text-judooo-smoke">
                  Tone
                </p>
                <p className="jd:mt-2 jd:mb-0 jd:font-serif jd:text-3xl jd:leading-none jd:text-judooo-ink">Editorial</p>
              </div>
            </div>
          </div>
        </div>
      </JudoooModal>
    </div>
  );
};
