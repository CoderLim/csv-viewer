import type { AmountMode, ColumnMapping } from './types';

const DATE_KEYWORDS = [
  'date',
  'transaction date',
  'posting date',
  'posted date',
  'trans date',
  'datum',
  'fecha',
];

const DESCRIPTION_KEYWORDS = [
  'description',
  'desc',
  'memo',
  'name',
  'payee',
  'details',
  'narrative',
  'merchant',
  'transaction',
];

const AMOUNT_KEYWORDS = ['amount', 'amt', 'value', 'sum', 'total'];

const DEBIT_KEYWORDS = ['debit', 'withdrawal', 'money out', 'payment'];

const CREDIT_KEYWORDS = ['credit', 'deposit', 'money in'];

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[_\s]+/g, ' ');
}

function findColumn(headers: string[], keywords: string[]): string | undefined {
  const normalized = headers.map((header) => ({
    original: header,
    normalized: normalizeHeader(header),
  }));

  for (const keyword of keywords) {
    const match = normalized.find(
      (entry) =>
        entry.normalized === keyword ||
        entry.normalized.includes(keyword) ||
        keyword.includes(entry.normalized)
    );
    if (match) return match.original;
  }

  return undefined;
}

export function detectColumnMapping(headers: string[]): ColumnMapping {
  const dateColumn = findColumn(headers, DATE_KEYWORDS) ?? headers[0] ?? '';
  const descriptionColumn =
    findColumn(headers, DESCRIPTION_KEYWORDS) ??
    headers.find((header) => header !== dateColumn) ??
    headers[1] ??
    '';
  const debitColumn = findColumn(headers, DEBIT_KEYWORDS);
  const creditColumn = findColumn(headers, CREDIT_KEYWORDS);
  const amountColumn = findColumn(headers, AMOUNT_KEYWORDS);

  if (debitColumn && creditColumn) {
    return {
      dateColumn,
      descriptionColumn,
      amountMode: 'split',
      debitColumn,
      creditColumn,
    };
  }

  return {
    dateColumn,
    descriptionColumn,
    amountMode: 'single',
    amountColumn:
      amountColumn ??
      headers.find(
        (header) => header !== dateColumn && header !== descriptionColumn
      ) ??
      headers[2] ??
      '',
  };
}

export function isMappingComplete(mapping: ColumnMapping, headers: string[]): boolean {
  const hasHeader = (column?: string) =>
    Boolean(column && headers.includes(column));

  if (!hasHeader(mapping.dateColumn) || !hasHeader(mapping.descriptionColumn)) {
    return false;
  }

  if (mapping.amountMode === 'single') {
    return hasHeader(mapping.amountColumn);
  }

  return hasHeader(mapping.debitColumn) && hasHeader(mapping.creditColumn);
}

export function getDefaultAmountMode(headers: string[]): AmountMode {
  const debit = findColumn(headers, DEBIT_KEYWORDS);
  const credit = findColumn(headers, CREDIT_KEYWORDS);
  return debit && credit ? 'split' : 'single';
}
