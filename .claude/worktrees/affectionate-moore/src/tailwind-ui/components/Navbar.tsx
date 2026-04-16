import type { ReactNode } from 'react';
import { branding } from '@/assets/branding';
import { cn } from '../cn';

interface NavItem {
  label: string;
  active?: boolean;
}

interface JudoooNavbarProps {
  items: NavItem[];
  actions?: ReactNode;
}

export const JudoooNavbar = ({ items, actions }: JudoooNavbarProps) => (
  <header className="jd:sticky jd:top-0 jd:z-30 jd:border-b jd:border-judooo-ink/8 jd:bg-judooo-paper/90 jd:backdrop-blur-xl">
    <div className="jd:mx-auto jd:flex jd:w-full jd:max-w-7xl jd:flex-wrap jd:items-center jd:justify-between jd:gap-4 jd:px-5 jd:py-4 md:jd:flex-nowrap md:jd:px-8">
      <div className="jd:inline-flex jd:items-center jd:gap-3">
        <img src={branding.icon} alt="Judooo icon" className="jd:h-10 jd:w-10 jd:rounded-full" />
        <div className="jd:flex jd:flex-col">
          <img src={branding.logo} alt="Judooo" className="jd:h-6 jd:w-auto jd:object-contain" />
          <span className="jd:font-mono jd:text-[10px] jd:uppercase jd:tracking-[0.26em] jd:text-judooo-smoke">
            Arts network
          </span>
        </div>
      </div>

      <nav className="jd:flex jd:w-full jd:flex-wrap jd:items-center jd:gap-2 md:jd:w-auto">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            className={cn(
              'jd:h-10 jd:rounded-full jd:px-4 jd:font-mono jd:text-[11px] jd:font-semibold jd:uppercase jd:tracking-[0.22em] jd:transition-colors',
              item.active
                ? 'jd:bg-judooo-ink jd:text-judooo-paper'
                : 'jd:bg-transparent jd:text-judooo-smoke hover:jd:bg-judooo-mist hover:jd:text-judooo-ink',
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {actions ? <div className="jd:flex jd:items-center jd:gap-3">{actions}</div> : null}
    </div>
  </header>
);
