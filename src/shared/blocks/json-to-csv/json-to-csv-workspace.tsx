'use client';

import { useCallback, useRef, useState } from 'react';
import { Braces, FileJson, Loader2, Upload } from 'lucide-react';
import Papa from 'papaparse';

import { CsvTableView } from '@/shared/blocks/csv-viewer/csv-table-view';
import type { ParsedCsv } from '@/shared/blocks/csv-viewer/types';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/lib/utils';

import { JsonParseError, parseJsonFile, parseJsonToTabular } from './parse-json';
import type { InputMode, JsonToCsvLabels, JsonWorkspaceStatus } from './types';

const defaultLabels: JsonToCsvLabels = {
  tab_upload: 'Upload file',
  tab_paste: 'Paste JSON',
  paste_placeholder: 'Paste your JSON array here',
  convert: 'Convert',
  download_csv: 'Download CSV',
  drop_title: 'Drop your JSON file here',
  drop_hint: 'or click to browse',
  file_type_hint: 'Supports .json files',
  parsing: 'Converting...',
  error_invalid_type: 'Please upload a .json file',
  error_invalid_json: 'Invalid JSON format',
  error_not_array: 'JSON must be an array of objects',
  error_empty: 'JSON array is empty',
  error_parse_failed: 'Failed to parse JSON file',
  reupload: 'Convert another',
  row_count: '{count} rows',
  column_count: '{count} columns',
  page_info: 'Page {current} of {total}',
};

function downloadCsv(data: ParsedCsv) {
  const csv = Papa.unparse({ fields: data.headers, data: data.rows });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const baseName = data.fileName.replace(/\.json$/i, '') || 'converted';
  link.href = url;
  link.download = `${baseName}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

interface JsonToCsvWorkspaceProps {
  labels?: Partial<JsonToCsvLabels>;
  className?: string;
}

export function JsonToCsvWorkspace({
  labels: labelOverrides,
  className,
}: JsonToCsvWorkspaceProps) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const inputRef = useRef<HTMLInputElement>(null);

  const [inputMode, setInputMode] = useState<InputMode>('upload');
  const [status, setStatus] = useState<JsonWorkspaceStatus>('idle');
  const [parsedData, setParsedData] = useState<ParsedCsv | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const handleError = useCallback(
    (error: unknown) => {
      setParsedData(null);
      setStatus('error');

      if (error instanceof JsonParseError) {
        switch (error.code) {
          case 'invalid_type':
            setErrorMessage(labels.error_invalid_type);
            break;
          case 'invalid_json':
            setErrorMessage(labels.error_invalid_json);
            break;
          case 'not_array':
            setErrorMessage(labels.error_not_array);
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

  const handleConvert = useCallback(
    async (text: string, fileName?: string) => {
      setStatus('parsing');
      setErrorMessage(null);

      try {
        const result = parseJsonToTabular(text, fileName);
        setParsedData(result);
        setStatus('ready');
      } catch (error) {
        handleError(error);
      }
    },
    [handleError]
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      setStatus('parsing');
      setErrorMessage(null);

      try {
        const result = await parseJsonFile(file);
        setParsedData(result);
        setStatus('ready');
      } catch (error) {
        handleError(error);
      }
    },
    [handleError]
  );

  const handleReset = useCallback(() => {
    setParsedData(null);
    setErrorMessage(null);
    setPasteText('');
    setStatus('idle');
  }, []);

  const handlePasteConvert = useCallback(() => {
    void handleConvert(pasteText.trim(), 'pasted.json');
  }, [handleConvert, pasteText]);

  if (status === 'ready' && parsedData) {
    return (
      <CsvTableView
        data={parsedData}
        labels={labels}
        onReupload={handleReset}
        onDownload={() => downloadCsv(parsedData)}
        downloadLabel={labels.download_csv}
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
          <Braces className="mr-1 size-4" />
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
            accept=".json,application/json"
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
                <FileJson className="text-primary size-8" />
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
