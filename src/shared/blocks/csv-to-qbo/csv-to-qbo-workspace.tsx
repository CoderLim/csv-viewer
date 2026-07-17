'use client';

import { useCallback, useRef, useState } from 'react';
import { ClipboardList, FileText, Loader2, Upload } from 'lucide-react';

import { CsvParseError } from '@/shared/blocks/csv-viewer/parse-csv';
import { parseCsvFile } from '@/shared/blocks/csv-viewer/parse-csv';
import { CsvTableView } from '@/shared/blocks/csv-viewer/csv-table-view';
import type { ParsedCsv } from '@/shared/blocks/csv-viewer/types';
import { parseCsvText } from '@/shared/blocks/csv-to-pdf/parse-csv-input';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/lib/utils';

import { ColumnMappingForm } from './column-mapping-form';
import { detectColumnMapping, isMappingComplete } from './detect-columns';
import { downloadQboFile } from './generate-qbo';
import {
  NormalizeError,
  normalizeTransactions,
  transactionsToPreviewData,
} from './normalize-transactions';
import type {
  ColumnMapping,
  CsvToQboLabels,
  CsvToQboStatus,
  InputMode,
  NormalizedTransaction,
  QboOptions,
} from './types';

const defaultLabels: CsvToQboLabels = {
  tab_upload: 'Upload file',
  tab_paste: 'Paste CSV',
  paste_placeholder:
    'Paste your bank CSV here, e.g.\nDate,Description,Amount\n01/15/2025,ACME HARDWARE,-42.50',
  convert: 'Convert',
  continue: 'Continue to preview',
  download_qbo: 'Download QBO',
  generating: 'Generating QBO...',
  drop_title: 'Drop your CSV file here',
  drop_hint: 'or click to browse',
  file_type_hint: 'Supports .csv files from banks and credit cards',
  parsing: 'Parsing...',
  error_invalid_type: 'Please upload a .csv file',
  error_invalid_csv: 'Invalid CSV format',
  error_parse_failed: 'Failed to parse CSV file',
  error_empty: 'The CSV is empty',
  reupload: 'Upload another CSV',
  row_count: '{count} rows',
  column_count: '{count} columns',
  page_info: 'Page {current} of {total}',
  mapping_title: 'Map your columns',
  mapping_description:
    'Match your CSV columns to date, description, and amount fields for QuickBooks import.',
  column_date: 'Date column',
  column_description: 'Description column',
  column_amount: 'Amount column',
  column_debit: 'Debit column',
  column_credit: 'Credit column',
  amount_mode_single: 'Single amount column',
  amount_mode_split: 'Separate debit & credit',
  advanced_options: 'Advanced options',
  account_type: 'Account type',
  account_type_checking: 'Checking account',
  account_type_creditcard: 'Credit card',
  currency: 'Currency',
  bank_name: 'Bank name',
  select_column: 'Select column',
  error_mapping_incomplete: 'Please complete all required column mappings',
  error_no_valid_rows: 'No valid transactions found. Check your column mapping.',
  error_invalid_date: 'Could not parse dates in the selected column',
  error_invalid_amount: 'Could not parse amounts in the selected column',
  preview_date: 'Date',
  preview_description: 'Description',
  preview_amount: 'Amount',
};

const defaultOptions: QboOptions = {
  accountType: 'CHECKING',
  currency: 'USD',
  bankName: 'CSV Import',
};

interface CsvToQboWorkspaceProps {
  labels?: Partial<CsvToQboLabels>;
  className?: string;
}

export function CsvToQboWorkspace({
  labels: labelOverrides,
  className,
}: CsvToQboWorkspaceProps) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const inputRef = useRef<HTMLInputElement>(null);

  const [inputMode, setInputMode] = useState<InputMode>('upload');
  const [status, setStatus] = useState<CsvToQboStatus>('idle');
  const [parsedCsv, setParsedCsv] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [options, setOptions] = useState<QboOptions>(defaultOptions);
  const [transactions, setTransactions] = useState<NormalizedTransaction[]>([]);
  const [previewData, setPreviewData] = useState<ParsedCsv | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleError = useCallback(
    (error: unknown) => {
      setTransactions([]);
      setPreviewData(null);
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

      if (error instanceof NormalizeError) {
        switch (error.code) {
          case 'mapping_incomplete':
            setErrorMessage(labels.error_mapping_incomplete);
            break;
          case 'no_valid_rows':
            setErrorMessage(labels.error_no_valid_rows);
            break;
          case 'invalid_date':
            setErrorMessage(labels.error_invalid_date);
            break;
          case 'invalid_amount':
            setErrorMessage(labels.error_invalid_amount);
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

  const handleParsedCsv = useCallback((result: ParsedCsv) => {
    setParsedCsv(result);
    setMapping(detectColumnMapping(result.headers));
    setErrorMessage(null);
    setStatus('mapping');
  }, []);

  const handleFileSelect = useCallback(
    async (file: File) => {
      setStatus('parsing');
      setErrorMessage(null);

      try {
        const result = await parseCsvFile(file);
        handleParsedCsv(result);
      } catch (error) {
        handleError(error);
      }
    },
    [handleError, handleParsedCsv]
  );

  const handlePasteConvert = useCallback(() => {
    setStatus('parsing');
    setErrorMessage(null);

    try {
      const result = parseCsvText(pasteText.trim());
      handleParsedCsv(result);
    } catch (error) {
      handleError(error);
    }
  }, [handleError, handleParsedCsv, pasteText]);

  const handleMappingSubmit = useCallback(() => {
    if (!parsedCsv || !mapping) return;

    if (!isMappingComplete(mapping, parsedCsv.headers)) {
      setErrorMessage(labels.error_mapping_incomplete);
      return;
    }

    try {
      const normalized = normalizeTransactions(parsedCsv, mapping);
      setTransactions(normalized);
      setPreviewData(
        transactionsToPreviewData(normalized, parsedCsv.fileName)
      );
      setErrorMessage(null);
      setStatus('ready');
    } catch (error) {
      handleError(error);
      setStatus('mapping');
    }
  }, [handleError, labels.error_mapping_incomplete, mapping, parsedCsv]);

  const handleReset = useCallback(() => {
    setParsedCsv(null);
    setMapping(null);
    setTransactions([]);
    setPreviewData(null);
    setErrorMessage(null);
    setPasteText('');
    setOptions(defaultOptions);
    setStatus('idle');
  }, []);

  const handleDownload = useCallback(() => {
    if (!transactions.length || !parsedCsv || isGenerating) return;

    setIsGenerating(true);
    try {
      downloadQboFile(transactions, options, parsedCsv.fileName);
    } catch {
      setErrorMessage(labels.error_parse_failed);
    } finally {
      setIsGenerating(false);
    }
  }, [transactions, parsedCsv, isGenerating, options, labels.error_parse_failed]);

  if (status === 'ready' && previewData) {
    return (
      <CsvTableView
        data={previewData}
        labels={labels}
        onReupload={handleReset}
        onDownload={handleDownload}
        downloadLabel={isGenerating ? labels.generating : labels.download_qbo}
        className={className}
      />
    );
  }

  if (status === 'mapping' && parsedCsv && mapping) {
    return (
      <ColumnMappingForm
        headers={parsedCsv.headers}
        mapping={mapping}
        options={options}
        labels={labels}
        errorMessage={errorMessage}
        onMappingChange={setMapping}
        onOptionsChange={setOptions}
        onSubmit={handleMappingSubmit}
        onBack={handleReset}
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
