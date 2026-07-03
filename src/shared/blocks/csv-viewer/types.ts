export interface ParsedCsv {
  headers: string[];
  rows: string[][];
  fileName: string;
}

export interface CsvUploadLabels {
  drop_title: string;
  drop_hint: string;
  file_type_hint: string;
  parsing: string;
  error_invalid_type: string;
  error_parse_failed: string;
  error_empty: string;
  row_count: string;
  column_count: string;
  reupload: string;
  page_info: string;
}

export type CsvWorkspaceStatus = 'idle' | 'parsing' | 'ready' | 'error';
