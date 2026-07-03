'use client';

import { useRef, useState } from 'react';
import { FileSpreadsheet, Loader2, Upload } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

import type { CsvUploadLabels } from './types';

interface CsvUploadZoneProps {
  labels: CsvUploadLabels;
  isParsing?: boolean;
  errorMessage?: string | null;
  onFileSelect: (file: File) => void;
  className?: string;
}

export function CsvUploadZone({
  labels,
  isParsing = false,
  errorMessage,
  onFileSelect,
  className,
}: CsvUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = (file: File | undefined) => {
    if (!file || isParsing) return;
    onFileSelect(file);
  };

  return (
    <div className={cn('mx-auto w-full max-w-6xl px-4', className)}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !isParsing && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (!isParsing) inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!isParsing) setIsDragOver(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragOver(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragOver(false);
          if (isParsing) return;
          handleFile(event.dataTransfer.files[0]);
        }}
        className={cn(
          'flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors md:min-h-[360px]',
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/60 hover:bg-muted/40',
          isParsing && 'pointer-events-none opacity-70'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(event) => {
            handleFile(event.target.files?.[0]);
            event.target.value = '';
          }}
        />

        {isParsing ? (
          <>
            <Loader2 className="text-primary mb-4 size-12 animate-spin" />
            <p className="text-foreground text-lg font-medium">{labels.parsing}</p>
          </>
        ) : (
          <>
            <div className="bg-primary/10 mb-4 flex size-16 items-center justify-center rounded-full">
              <Upload className="text-primary size-8" />
            </div>
            <p className="text-foreground text-xl font-semibold">{labels.drop_title}</p>
            <p className="text-muted-foreground mt-2 text-base">{labels.drop_hint}</p>
            <p className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
              <FileSpreadsheet className="size-4" />
              {labels.file_type_hint}
            </p>
          </>
        )}

        {errorMessage && !isParsing && (
          <p className="text-destructive mt-4 text-sm">{errorMessage}</p>
        )}
      </div>
    </div>
  );
}
