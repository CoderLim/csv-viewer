import Papa from 'papaparse';

import { CsvParseError } from '@/shared/blocks/csv-viewer/parse-csv';
import type { ParsedCsv } from '@/shared/blocks/csv-viewer/types';

export function parseCsvText(text: string, fileName = 'pasted.csv'): ParsedCsv {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new CsvParseError('The input is empty', 'empty');
  }

  const results = Papa.parse<string[]>(trimmed, {
    skipEmptyLines: true,
  });

  if (results.errors.length > 0) {
    throw new CsvParseError('Failed to parse CSV text', 'parse_failed');
  }

  const data = results.data as string[][];
  if (!data.length) {
    throw new CsvParseError('The input is empty', 'empty');
  }

  const [headerRow, ...bodyRows] = data;
  const headers = headerRow.map((cell, index) => {
    const value = cell?.trim();
    return value || `Column ${index + 1}`;
  });

  const rows = bodyRows.map((row) => headers.map((_, index) => row[index] ?? ''));

  return { headers, rows, fileName };
}
