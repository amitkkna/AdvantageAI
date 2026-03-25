'use client';

import { useState } from 'react';
import {
  ColumnDef, flexRender, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, SortingState, useReactTable, RowSelectionState,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  searchPlaceholder?: string;
  searchKey?: string;
  enableSelection?: boolean;
  onSelectionChange?: (rows: TData[]) => void;
}

export function DataTable<TData>({
  columns, data, searchPlaceholder = 'Search...', searchKey,
  enableSelection = false, onSelectionChange,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: (updater) => {
      const next = typeof updater === 'function' ? updater(rowSelection) : updater;
      setRowSelection(next);
      if (onSelectionChange) {
        const selectedRows = Object.keys(next).filter((k) => next[k]).map((k) => data[parseInt(k)]);
        onSelectionChange(selectedRows);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: enableSelection,
  });

  return (
    <div className="space-y-3">
      {searchKey !== undefined && (
        <Input
          placeholder={searchPlaceholder}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
      )}
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : header.column.getIsSorted() === 'desc' ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : header.column.getCanSort() ? (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />
                      ) : null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-t hover:bg-muted/30 transition-colors" data-state={row.getIsSelected() ? 'selected' : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">
                  No results found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-muted-foreground">
        {enableSelection && `${table.getFilteredSelectedRowModel().rows.length} of `}
        {table.getFilteredRowModel().rows.length} row(s)
      </div>
    </div>
  );
}
