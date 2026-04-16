import type { ReactNode } from 'react';

interface Column<T> {
  key: keyof T | string;
  header: ReactNode;
  render: (row: T) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  emptyLabel?: string;
}

export const Table = <T extends { id: string }>({
  columns,
  rows,
  emptyLabel = 'No rows yet.',
}: TableProps<T>) => (
  <div className="ui-table">
    <table>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={String(column.key)}>{column.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={columns.length}>{emptyLabel}</td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => (
                <td key={String(column.key)}>{column.render(row)}</td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);
