import type { CsvUploadLabels } from '@/shared/blocks/csv-viewer/types';

export interface JsonToCsvLabels extends CsvUploadLabels {
  tab_upload: string;
  tab_paste: string;
  paste_placeholder: string;
  convert: string;
  download_csv: string;
  error_invalid_json: string;
  error_not_array: string;
}

export type JsonWorkspaceStatus = 'idle' | 'parsing' | 'ready' | 'error';

export type InputMode = 'upload' | 'paste';
