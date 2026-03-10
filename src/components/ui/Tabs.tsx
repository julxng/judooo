import { cn as cx } from '@/lib/utils';

interface TabOption<T extends string> {
  id: T;
  label: string;
}

interface TabsProps<T extends string> {
  value: T;
  options: TabOption<T>[];
  onChange: (value: T) => void;
}

export const Tabs = <T extends string>({ value, options, onChange }: TabsProps<T>) => (
  <div
    className="inline-flex w-full flex-wrap gap-2 border-b border-border pb-2 md:w-auto"
    role="tablist"
  >
    {options.map((option) => (
      <button
        key={option.id}
        type="button"
        role="tab"
        aria-selected={option.id === value}
        className={cx(
          'border-b border-transparent px-1 pb-2 text-sm font-medium text-muted-foreground transition-colors duration-200',
          option.id === value && 'border-foreground text-foreground',
        )}
        onClick={() => onChange(option.id)}
      >
        {option.label}
      </button>
    ))}
  </div>
);
