import { type Column } from '@tanstack/react-table';
import React from 'react';

// Re-export the ColumnFilter component from data-table.tsx
// This will be used to render filter cells below headers

interface ColumnFilterCellsProps<_TData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  headerGroups: any[];
  ColumnFilterComponent: React.ComponentType<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    column: Column<any, unknown>;
  }>;
}

export function ColumnFilterCells<TData>({
  headerGroups,
  ColumnFilterComponent,
}: ColumnFilterCellsProps<TData>) {
  return (
    <>
      {headerGroups.map((headerGroup) => (
        <tr
          key={`${headerGroup.id}-filters`}
          className="border-b border-border"
        >
          {headerGroup.headers.map(
            (
              header: {
                id: string;
                column: Column<TData, unknown>;
                getContext: () => unknown;
                isPlaceholder: boolean;
                colSpan: number;
              },
              headerIndex: number
            ) => {
              const isPinned = header.column.getIsPinned();
              const columnWidth =
                (header.column.columnDef.meta as Record<string, unknown>)?.[
                  'width'
                ] || 192;

              // Calculate sticky position for pinned columns
              let stickyLeft = 0;
              let stickyRight = 0;

              if (isPinned === 'left') {
                // Sum widths of all previous pinned left columns
                for (let i = 0; i < headerIndex; i++) {
                  const prevHeader = headerGroup.headers[i];
                  if (prevHeader.column.getIsPinned() === 'left') {
                    const prevWidth =
                      (
                        prevHeader.column.columnDef.meta as Record<
                          string,
                          unknown
                        >
                      )?.['width'] || 192;
                    stickyLeft += Number(prevWidth);
                  }
                }
              } else if (isPinned === 'right') {
                // Sum widths of all following pinned right columns
                for (
                  let i = headerIndex + 1;
                  i < headerGroup.headers.length;
                  i++
                ) {
                  const nextHeader = headerGroup.headers[i];
                  if (nextHeader.column.getIsPinned() === 'right') {
                    const nextWidth =
                      (
                        nextHeader.column.columnDef.meta as Record<
                          string,
                          unknown
                        >
                      )?.['width'] || 192;
                    stickyRight += Number(nextWidth);
                  }
                }
              }

              const stickyStyle = isPinned
                ? {
                    position: 'sticky' as const,
                    ...(isPinned === 'left' ? { left: `${stickyLeft}px` } : {}),
                    ...(isPinned === 'right'
                      ? { right: `${stickyRight}px` }
                      : {}),
                    zIndex: 10,
                  }
                : {};

              return (
                <td
                  key={header.id}
                  className="px-2 py-2 bg-inner-container"
                  style={{
                    width: `${columnWidth}px`,
                    minWidth: '80px',
                    maxWidth: `${columnWidth}px`,
                    ...stickyStyle,
                  }}
                >
                  {header.column.getCanFilter() ? (
                    <ColumnFilterComponent column={header.column} />
                  ) : null}
                </td>
              );
            }
          )}
        </tr>
      ))}
    </>
  );
}
