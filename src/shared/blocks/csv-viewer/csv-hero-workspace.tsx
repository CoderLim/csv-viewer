'use client';

import { useCallback, useState } from 'react';

import { CsvParseError, parseCsvFile } from './parse-csv';
import { CsvTableView } from './csv-table-view';
import { CsvUploadZone } from './csv-upload-zone';
import type { CsvUploadLabels, CsvWorkspaceStatus, ParsedCsv } from './types';

const defaultLabels: CsvUploadLabels = {
  drop_title: 'Drop your CSV file here',
  drop_hint: 'or click to browse',
  file_type_hint: 'Supports .csv files',
  parsing: 'Parsing...',
  error_invalid_type: 'Please upload a .csv file',
  error_parse_failed: 'Failed to parse CSV file',
  error_empty: 'The file is empty',
  row_count: '{count} rows',
  column_count: '{count} columns',
  reupload: 'Upload another file',
  page_info: 'Page {current} of {total}',
};

interface CsvHeroWorkspaceProps {
  labels?: Partial<CsvUploadLabels>;
  className?: string;
}

export function CsvHeroWorkspace({ labels: labelOverrides, className }: CsvHeroWorkspaceProps) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const [status, setStatus] = useState<CsvWorkspaceStatus>('idle');
  const [parsedData, setParsedData] = useState<ParsedCsv | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      setStatus('parsing');
      setErrorMessage(null);

      try {
        const result = await parseCsvFile(file);
        setParsedData(result);
        setStatus('ready');
      } catch (error) {
        setParsedData(null);
        setStatus('error');

        if (error instanceof CsvParseError) {
          if (error.code === 'invalid_type') {
            setErrorMessage(labels.error_invalid_type);
          } else if (error.code === 'empty') {
            setErrorMessage(labels.error_empty);
          } else {
            setErrorMessage(labels.error_parse_failed);
          }
          return;
        }

        setErrorMessage(labels.error_parse_failed);
      }
    },
    [labels]
  );

  const handleReupload = useCallback(() => {
    setParsedData(null);
    setErrorMessage(null);
    setStatus('idle');
  }, []);

  if (status === 'ready' && parsedData) {
    return (
      <CsvTableView
        data={parsedData}
        labels={labels}
        onReupload={handleReupload}
        className={className}
      />
    );
  }

  return (
    <CsvUploadZone
      labels={labels}
      isParsing={status === 'parsing'}
      errorMessage={errorMessage}
      onFileSelect={handleFileSelect}
      className={className}
    />
  );
}
