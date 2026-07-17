'use client';

import { useCallback, useRef, useState } from 'react';
import { ClipboardList, FileText, Loader2, Upload } from 'lucide-react';

import { CsvParseError } from '@/shared/blocks/csv-viewer/parse-csv';
import { CsvTableView } from '@/shared/blocks/csv-viewer/csv-table-view';
import { parseCsvFile } from '@/shared/blocks/csv-viewer/parse-csv';
import type { ParsedCsv } from '@/shared/blocks/csv-viewer/types';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/lib/utils';

import { downloadCsvAsPdf } from './convert-csv-to-pdf';
import { parseCsvText } from './parse-csv-input';
import type { CsvToPdfLabels, CsvToPdfStatus, InputMode } from './types';

const defaultLabels: CsvToPdfLabels = {
  tab_upload: 'Upload file',
  tab_paste: 'Paste CSV',
  paste_placeholder: 'Paste your CSV data here, e.g. name,age\nAlice,30',
  convert: 'Convert',
  download_pdf: 'Download PDF',
  generating: 'Generating PDF...',
  drop_title: 'Drop your CSV file here',
  drop_hint: 'or click to browse',
  file_type_hint: 'Supports .csv files',
  parsing: 'Parsing...',
  error_invalid_type: 'Please upload a .csv file',
  error_invalid_csv: 'Invalid CSV format',
  error_parse_failed: 'Failed to parse CSV file',
  error_empty: 'The CSV is empty',
  reupload: 'Convert another',
  row_count: '{count} rows',
  column_count: '{count} columns',
  page_info: 'Page {current} of {total}',
};

interface CsvToPdfWorkspaceProps {
  labels?: Partial<CsvToPdfLabels>;
  className?: string;
}

export function CsvToPdfWorkspace({
  labels: labelOverrides,
  className,
}: CsvToPdfWorkspaceProps) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const inputRef = useRef<HTMLInputElement>(null);

  const [inputMode, setInputMode] = useState<InputMode>('upload');
  const [status, setStatus] = useState<CsvToPdfStatus>('idle');
  const [parsedData, setParsedData] = useState<ParsedCsv | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleError = useCallback(
    (error: unknown) => {
      setParsedData(null);
      setStatus('error');

      if (error instanceof CsvParseError) {
        switch (error.code) {
          case 'invalid_type':
            setErrorMessage(labels.error_invalid_type);
            break;
          case 'empty':
            setErrorMessage(labels.error_empty);
            break;
          default:
            setErrorMessage(labels.error_parse_failed);
        }
        return;
      }

      setErrorMessage(labels.error_parse_failed);
    },
    [labels]
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      setStatus('parsing');
      setErrorMessage(null);

      try {
        const result = await parseCsvFile(file);
        setParsedData(result);
        setStatus('ready');
      } catch (error) {
        handleError(error);
      }
    },
    [handleError]
  );

  const handlePasteConvert = useCallback(() => {
    setStatus('parsing');
    setErrorMessage(null);

    try {
      const result = parseCsvText(pasteText.trim());
      setParsedData(result);
      setStatus('ready');
    } catch (error) {
      handleError(error);
    }
  }, [handleError, pasteText]);

  const handleReset = useCallback(() => {
    setParsedData(null);
    setErrorMessage(null);
    setPasteText('');
    setStatus('idle');
  }, []);

  const handleDownload = useCallback(async () => {
    if (!parsedData || isGenerating) return;
    setIsGenerating(true);
    try {
      await downloadCsvAsPdf(parsedData);
    } catch {
      setErrorMessage(labels.error_parse_failed);
    } finally {
      setIsGenerating(false);
    }
  }, [parsedData, isGenerating, labels.error_parse_failed]);

  if (status === 'ready' && parsedData) {
    return (
      <CsvTableView
        data={parsedData}
        labels={labels}
        onReupload={handleReset}
        onDownload={handleDownload}
        downloadLabel={isGenerating ? labels.generating : labels.download_pdf}
        className={className}
      />
    );
  }

  return (
    <div className={cn('mx-auto w-full max-w-6xl px-4', className)}>
      <div className="mb-4 flex justify-center gap-2">
        <Button
          variant={inputMode === 'upload' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setInputMode('upload');
            setErrorMessage(null);
            setStatus('idle');
          }}
        >
          <Upload className="mr-1 size-4" />
          {labels.tab_upload}
        </Button>
        <Button
          variant={inputMode === 'paste' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setInputMode('paste');
            setErrorMessage(null);
            setStatus('idle');
          }}
        >
          <ClipboardList className="mr-1 size-4" />
          {labels.tab_paste}
        </Button>
      </div>

      {inputMode === 'upload' ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => status !== 'parsing' && inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              if (status !== 'parsing') inputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (status !== 'parsing') setIsDragOver(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragOver(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragOver(false);
            if (status === 'parsing') return;
            const file = event.dataTransfer.files[0];
            if (file) void handleFileSelect(file);
          }}
          className={cn(
            'flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors md:min-h-[360px]',
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/60 hover:bg-muted/40',
            status === 'parsing' && 'pointer-events-none opacity-70'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFileSelect(file);
              event.target.value = '';
            }}
          />

          {status === 'parsing' ? (
            <>
              <Loader2 className="text-primary mb-4 size-12 animate-spin" />
              <p className="text-foreground text-lg font-medium">{labels.parsing}</p>
            </>
          ) : (
            <>
              <div className="bg-primary/10 mb-4 flex size-16 items-center justify-center rounded-full">
                <FileText className="text-primary size-8" />
              </div>
              <p className="text-foreground text-xl font-semibold">{labels.drop_title}</p>
              <p className="text-muted-foreground mt-2 text-base">{labels.drop_hint}</p>
              <p className="text-muted-foreground mt-4 text-sm">{labels.file_type_hint}</p>
            </>
          )}

          {errorMessage && status === 'error' && (
            <p className="text-destructive mt-4 text-sm">{errorMessage}</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <Textarea
            value={pasteText}
            onChange={(event) => setPasteText(event.target.value)}
            placeholder={labels.paste_placeholder}
            className="min-h-[280px] font-mono text-sm md:min-h-[360px]"
            disabled={status === 'parsing'}
          />
          <div className="flex flex-col items-center gap-3">
            <Button
              onClick={handlePasteConvert}
              disabled={!pasteText.trim() || status === 'parsing'}
            >
              {status === 'parsing' ? (
                <>
                  <Loader2 className="mr-1 size-4 animate-spin" />
                  {labels.parsing}
                </>
              ) : (
                labels.convert
              )}
            </Button>
            {errorMessage && status === 'error' && (
              <p className="text-destructive text-sm">{errorMessage}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
