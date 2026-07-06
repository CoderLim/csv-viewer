'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { ScrollArea, ScrollBar } from '@/shared/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { cn } from '@/shared/lib/utils';

import type { CsvUploadLabels, ParsedCsv } from './types';

const ROWS_PER_PAGE = 50;

interface CsvTableViewProps {
  data: ParsedCsv;
  labels: CsvUploadLabels;
  onReupload: () => void;
  onDownload?: () => void;
  downloadLabel?: string;
  className?: string;
}

function formatLabel(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, String(value)),
    template
  );
}

export function CsvTableView({
  data,
  labels,
  onReupload,
  onDownload,
  downloadLabel,
  className,
}: CsvTableViewProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.rows.length / ROWS_PER_PAGE));

  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return data.rows.slice(start, start + ROWS_PER_PAGE);
  }, [currentPage, data.rows]);

  const startRow = data.rows.length === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1;
  const endRow = Math.min(currentPage * ROWS_PER_PAGE, data.rows.length);

  return (
    <div className={cn('mx-auto w-full max-w-6xl px-4', className)}>
      <div className="border-border mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
        <div className="min-w-0 text-left">
          <p className="text-foreground truncate font-medium">{data.fileName}</p>
          <p className="text-muted-foreground text-sm">
            {formatLabel(labels.row_count, { count: data.rows.length })}
            {' · '}
            {formatLabel(labels.column_count, { count: data.headers.length })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onDownload && downloadLabel && (
            <Button variant="default" size="sm" onClick={onDownload}>
              <Download className="mr-1 size-4" />
              {downloadLabel}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onReupload}>
            {labels.reupload}
          </Button>
        </div>
      </div>

      <div className="border-border overflow-hidden rounded-lg border">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="text-muted-foreground sticky top-0 z-10 w-14 bg-muted text-center">
                  #
                </TableHead>
                {data.headers.map((header, index) => (
                  <TableHead
                    key={`${header}-${index}`}
                    className="sticky top-0 z-10 min-w-[120px] bg-muted whitespace-nowrap"
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((row, rowIndex) => {
                const absoluteRowNumber = startRow + rowIndex;
                return (
                  <TableRow key={absoluteRowNumber}>
                    <TableCell className="text-muted-foreground text-center text-xs">
                      {absoluteRowNumber}
                    </TableCell>
                    {row.map((cell, cellIndex) => (
                      <TableCell
                        key={`${absoluteRowNumber}-${cellIndex}`}
                        className="max-w-[240px] truncate"
                        title={cell}
                      >
                        {cell}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {data.rows.length > ROWS_PER_PAGE && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">
            {formatLabel(labels.page_info, { current: currentPage, total: totalPages })}
            {' · '}
            {startRow}-{endRow} / {data.rows.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
