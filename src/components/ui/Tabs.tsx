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
  <div className="ui-tabs" role="tablist">
    {options.map((option) => (
      <button
        key={option.id}
        type="button"
        role="tab"
        aria-selected={option.id === value}
        className={cx('ui-tabs__tab', option.id === value && 'ui-tabs__tab--active')}
        onClick={() => onChange(option.id)}
      >
        {option.label}
      </button>
    ))}
  </div>
);
