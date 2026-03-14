import type { ReactNode } from 'react';
import { cn } from '../cn';

interface SidebarItem {
  id: string;
  label: string;
  note?: string;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

interface JudoooSidebarProps {
  title: string;
  sections: SidebarSection[];
  activeItemId: string;
  onSelect: (id: string) => void;
  footer?: ReactNode;
}

export const JudoooSidebar = ({
  title,
  sections,
  activeItemId,
  onSelect,
  footer,
}: JudoooSidebarProps) => (
  <aside className="jd:flex jd:flex-col jd:gap-6 jd:rounded-[32px] jd:border jd:border-judooo-ink/8 jd:bg-judooo-paper jd:p-5 jd:shadow-judooo-card">
    <div>
      <p className="jd:m-0 jd:font-mono jd:text-[11px] jd:font-semibold jd:uppercase jd:tracking-[0.24em] jd:text-judooo-ember">
        Library
      </p>
      <h2 className="jd:mt-3 jd:mb-0 jd:font-serif jd:text-3xl jd:leading-none jd:text-judooo-ink">{title}</h2>
    </div>

    <div className="jd:flex jd:flex-col jd:gap-5">
      {sections.map((section) => (
        <section key={section.title} className="jd:flex jd:flex-col jd:gap-2">
          <p className="jd:m-0 jd:font-mono jd:text-[10px] jd:uppercase jd:tracking-[0.22em] jd:text-judooo-smoke">
            {section.title}
          </p>
          {section.items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn(
                'jd:flex jd:flex-col jd:gap-1 jd:rounded-2xl jd:border jd:px-4 jd:py-3 jd:text-left jd:transition-all',
                activeItemId === item.id
                  ? 'jd:border-judooo-ember jd:bg-judooo-ember/8'
                  : 'jd:border-transparent jd:bg-transparent hover:jd:border-judooo-ink/8 hover:jd:bg-judooo-canvas',
              )}
            >
              <span className="jd:font-mono jd:text-[11px] jd:font-semibold jd:uppercase jd:tracking-[0.18em] jd:text-judooo-ink">
                {item.label}
              </span>
              {item.note ? <span className="jd:text-xs jd:text-judooo-smoke">{item.note}</span> : null}
            </button>
          ))}
        </section>
      ))}
    </div>

    {footer ? <div className="jd:mt-auto">{footer}</div> : null}
  </aside>
);
