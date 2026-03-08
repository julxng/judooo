import { useState, type ReactNode } from 'react';
import { Button } from './Button';

interface DropdownItem {
  id: string;
  label: string;
  onSelect: () => void;
}

interface DropdownProps {
  label: string;
  items: DropdownItem[];
  icon?: ReactNode;
}

export const Dropdown = ({ label, items, icon }: DropdownProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="ui-dropdown">
      <Button variant="ghost" size="sm" onClick={() => setOpen((value) => !value)}>
        {icon}
        {label}
      </Button>
      {open && (
        <div className="ui-dropdown__menu">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="ui-dropdown__item"
              onClick={() => {
                item.onSelect();
                setOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
