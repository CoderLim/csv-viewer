import type { ParsedCsv } from '@/shared/blocks/csv-viewer/types';

import type { ColumnMapping, NormalizedTransaction } from './types';

export class NormalizeError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'invalid_date'
      | 'invalid_amount'
      | 'no_valid_rows'
      | 'mapping_incomplete'
  ) {
    super(message);
    this.name = 'NormalizeError';
  }
}

function columnIndex(headers: string[], column: string): number {
  return headers.indexOf(column);
}

function parseAmount(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '-' || trimmed === '—') return null;

  let negative = false;
  let value = trimmed;

  if (/^\(.*\)$/.test(value)) {
    negative = true;
    value = value.slice(1, -1);
  }

  value = value.replace(/[$€£¥,\s]/g, '');
  if (value.startsWith('-')) {
    negative = true;
    value = value.slice(1);
  } else if (value.startsWith('+')) {
    value = value.slice(1);
  }

  const amount = Number.parseFloat(value);
  if (Number.isNaN(amount)) return null;

  return negative ? -Math.abs(amount) : amount;
}

function parseDate(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const slashMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (slashMatch) {
    const [, part1, part2, yearPart] = slashMatch;
    const year =
      yearPart.length === 2
        ? Number(yearPart) + (Number(yearPart) > 50 ? 1900 : 2000)
        : Number(yearPart);

    let month = Number(part1);
    let day = Number(part2);

    if (part1.length === 4 || Number(part1) > 12) {
      day = Number(part1);
      month = Number(part2);
    } else if (Number(part2) > 12 && Number(part1) <= 12) {
      month = Number(part1);
      day = Number(part2);
    } else if (Number(part1) > 12) {
      day = Number(part1);
      month = Number(part2);
    }

    const usDate = new Date(year, month - 1, day);
    if (!Number.isNaN(usDate.getTime())) return usDate;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function resolveAmount(
  row: string[],
  mapping: ColumnMapping,
  headers: string[]
): number | null {
  if (mapping.amountMode === 'single') {
    const index = columnIndex(headers, mapping.amountColumn ?? '');
    if (index < 0) return null;
    return parseAmount(row[index] ?? '');
  }

  const debitIndex = columnIndex(headers, mapping.debitColumn ?? '');
  const creditIndex = columnIndex(headers, mapping.creditColumn ?? '');
  if (debitIndex < 0 || creditIndex < 0) return null;

  const debit = parseAmount(row[debitIndex] ?? '');
  const credit = parseAmount(row[creditIndex] ?? '');

  if (debit !== null && debit !== 0) return -Math.abs(debit);
  if (credit !== null && credit !== 0) return Math.abs(credit);
  if (debit !== null) return debit;
  if (credit !== null) return credit;

  return null;
}

export function normalizeTransactions(
  data: ParsedCsv,
  mapping: ColumnMapping
): NormalizedTransaction[] {
  const dateIndex = columnIndex(data.headers, mapping.dateColumn);
  const descriptionIndex = columnIndex(data.headers, mapping.descriptionColumn);

  if (dateIndex < 0 || descriptionIndex < 0) {
    throw new NormalizeError('Column mapping is incomplete', 'mapping_incomplete');
  }

  const transactions: NormalizedTransaction[] = [];

  data.rows.forEach((row, rowIndex) => {
    const date = parseDate(row[dateIndex] ?? '');
    if (!date) return;

    const amount = resolveAmount(row, mapping, data.headers);
    if (amount === null || amount === 0) return;

    const description = (row[descriptionIndex] ?? '').trim();
    if (!description) return;

    transactions.push({
      date,
      description,
      amount,
      rowIndex,
    });
  });

  if (!transactions.length) {
    throw new NormalizeError('No valid transaction rows found', 'no_valid_rows');
  }

  return transactions.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function transactionsToPreviewData(
  transactions: NormalizedTransaction[],
  fileName: string
): ParsedCsv {
  return {
    fileName,
    headers: ['Date', 'Description', 'Amount'],
    rows: transactions.map((transaction) => [
      transaction.date.toISOString().slice(0, 10),
      transaction.description,
      transaction.amount.toFixed(2),
    ]),
  };
}
