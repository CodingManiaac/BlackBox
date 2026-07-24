import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  style?: React.CSSProperties;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  emptyMessage?: string;
}

export function Table<T>({ 
  columns, 
  data, 
  keyExtractor, 
  emptyMessage = 'No records found' 
}: TableProps<T>) {
  return (
    <div className="medx-table-container">
      {data.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          {emptyMessage}
        </div>
      ) : (
        <table className="medx-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={col.style}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={keyExtractor(row)}>
                {columns.map((col) => (
                  <td key={col.key} style={col.style}>
                    {col.render ? col.render(row) : (row[col.key as keyof T] as unknown as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
export default Table;
