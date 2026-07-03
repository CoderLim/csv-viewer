import Papa from 'papaparse';

import type { ParsedCsv } from './types';

export class CsvParseError extends Error {
  constructor(
    message: string,
    public readonly code: 'invalid_type' | 'empty' | 'parse_failed'
  ) {
    super(message);
    this.name = 'CsvParseError';
  }
}

function isCsvFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith('.csv') || file.type === 'text/csv' || file.type === 'application/vnd.ms-excel';
}

export function parseCsvFile(file: File): Promise<ParsedCsv> {
  if (!isCsvFile(file)) {
    return Promise.reject(new CsvParseError('Invalid file type', 'invalid_type'));
  }

  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new CsvParseError('Failed to parse CSV file', 'parse_failed'));
          return;
        }

        const data = results.data as string[][];
        if (!data.length) {
          reject(new CsvParseError('The file is empty', 'empty'));
          return;
        }

        const [headerRow, ...bodyRows] = data;
        const headers = headerRow.map((cell, index) => {
          const value = cell?.trim();
          return value || `Column ${index + 1}`;
        });

        const rows = bodyRows.map((row) =>
          headers.map((_, index) => row[index] ?? '')
        );

        resolve({
          headers,
          rows,
          fileName: file.name,
        });
      },
      error: () => {
        reject(new CsvParseError('Failed to parse CSV file', 'parse_failed'));
      },
    });
  });
}
