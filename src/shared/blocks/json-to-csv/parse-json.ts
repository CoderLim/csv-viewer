import type { ParsedCsv } from '@/shared/blocks/csv-viewer/types';

export type JsonParseErrorCode =
  | 'invalid_json'
  | 'not_array'
  | 'empty'
  | 'invalid_type';

export class JsonParseError extends Error {
  code: JsonParseErrorCode;

  constructor(code: JsonParseErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = 'JsonParseError';
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cellValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function parseJsonToTabular(
  text: string,
  fileName = 'pasted.json'
): ParsedCsv {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new JsonParseError('invalid_json');
  }

  if (!Array.isArray(parsed)) {
    throw new JsonParseError('not_array');
  }

  if (parsed.length === 0) {
    throw new JsonParseError('empty');
  }

  const headers: string[] = [];
  const headerSet = new Set<string>();

  for (const item of parsed) {
    if (!isPlainObject(item)) {
      throw new JsonParseError('not_array');
    }
    for (const key of Object.keys(item)) {
      if (!headerSet.has(key)) {
        headerSet.add(key);
        headers.push(key);
      }
    }
  }

  const rows = parsed.map((item) => {
    const record = item as Record<string, unknown>;
    return headers.map((header) => cellValue(record[header]));
  });

  return { headers, rows, fileName };
}

export async function parseJsonFile(file: File): Promise<ParsedCsv> {
  const isJson =
    file.name.toLowerCase().endsWith('.json') ||
    file.type === 'application/json' ||
    file.type === 'text/json';

  if (!isJson) {
    throw new JsonParseError('invalid_type');
  }

  const text = await file.text();
  return parseJsonToTabular(text, file.name);
}
