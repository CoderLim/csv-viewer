import type { CsvUploadLabels } from '@/shared/blocks/csv-viewer/types';

export interface CsvToPdfLabels extends CsvUploadLabels {
  tab_upload: string;
  tab_paste: string;
  paste_placeholder: string;
  convert: string;
  download_pdf: string;
  generating: string;
  error_invalid_csv: string;
}

export type CsvToPdfStatus = 'idle' | 'parsing' | 'ready' | 'error';

export type InputMode = 'upload' | 'paste';
