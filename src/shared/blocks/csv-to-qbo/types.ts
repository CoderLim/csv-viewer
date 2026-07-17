import type { CsvUploadLabels } from '@/shared/blocks/csv-viewer/types';

export type AmountMode = 'single' | 'split';

export type AccountType = 'CHECKING' | 'CREDITCARD';

export interface ColumnMapping {
  dateColumn: string;
  descriptionColumn: string;
  amountMode: AmountMode;
  amountColumn?: string;
  debitColumn?: string;
  creditColumn?: string;
}

export interface QboOptions {
  accountType: AccountType;
  currency: string;
  bankName: string;
}

export interface NormalizedTransaction {
  date: Date;
  description: string;
  amount: number;
  rowIndex: number;
}

export interface CsvToQboLabels extends CsvUploadLabels {
  tab_upload: string;
  tab_paste: string;
  paste_placeholder: string;
  convert: string;
  continue: string;
  download_qbo: string;
  generating: string;
  error_invalid_csv: string;
  mapping_title: string;
  mapping_description: string;
  column_date: string;
  column_description: string;
  column_amount: string;
  column_debit: string;
  column_credit: string;
  amount_mode_single: string;
  amount_mode_split: string;
  advanced_options: string;
  account_type: string;
  account_type_checking: string;
  account_type_creditcard: string;
  currency: string;
  bank_name: string;
  select_column: string;
  error_mapping_incomplete: string;
  error_no_valid_rows: string;
  error_invalid_date: string;
  error_invalid_amount: string;
  preview_date: string;
  preview_description: string;
  preview_amount: string;
}

export type CsvToQboStatus = 'idle' | 'parsing' | 'mapping' | 'ready' | 'error';

export type InputMode = 'upload' | 'paste';
