import type { ReactNode } from 'react';
import { Stack } from '@components/layout/Stack';
import { Input } from '@ui/Input';

interface FilterToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters: ReactNode;
  tabs?: ReactNode;
  className?: string;
}

export const FilterToolbar = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters,
  tabs,
  className,
}: FilterToolbarProps) => (
  <div className={`surface-toolbar ${className ?? ''}`}>
    <Stack gap={12} direction="row" className="surface-toolbar__row">
      <Input
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
      />
      {filters}
    </Stack>
    {tabs && <div className="surface-toolbar__tabs">{tabs}</div>}
  </div>
);
