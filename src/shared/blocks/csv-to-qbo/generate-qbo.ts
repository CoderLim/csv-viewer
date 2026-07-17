import type { NormalizedTransaction, QboOptions } from './types';

const DEFAULT_INTU_BID = '3000';
const DEFAULT_BANK_ID = '000000000';
const DEFAULT_ACCOUNT_ID = '0000000000';

function escapeOfx(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatOfxDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function formatOfxDateTime(date: Date): string {
  return `${formatOfxDate(date)}120000`;
}

function formatAmount(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const absolute = Math.abs(amount).toFixed(2);
  return `${sign}${absolute}`;
}

function generateFitId(transaction: NormalizedTransaction): string {
  const datePart = formatOfxDate(transaction.date);
  const amountPart = Math.abs(transaction.amount * 100).toFixed(0);
  const descPart = transaction.description
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 12)
    .toUpperCase();
  return `${datePart}${amountPart}${descPart}${String(transaction.rowIndex).padStart(4, '0')}`;
}

function getTransactionType(amount: number): 'DEBIT' | 'CREDIT' {
  return amount < 0 ? 'DEBIT' : 'CREDIT';
}

export function generateQboFile(
  transactions: NormalizedTransaction[],
  options: QboOptions
): string {
  const sorted = [...transactions].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
  const startDate = sorted[0].date;
  const endDate = sorted[sorted.length - 1].date;
  const now = new Date();
  const bankName = escapeOfx(options.bankName || 'CSV Import');
  const currency = escapeOfx(options.currency || 'USD');
  const accountType = options.accountType;

  const header = [
    'OFXHEADER:100',
    'DATA:OFXSGML',
    'VERSION:102',
    'SECURITY:NONE',
    'ENCODING:USASCII',
    'CHARSET:1252',
    'COMPRESSION:NONE',
    'OLDFILEUID:NONE',
    'NEWFILEUID:NONE',
    '',
  ].join('\n');

  const signOn = [
    '<OFX>',
    '<SIGNONMSGSRSV1><SONRS>',
    '<STATUS><CODE>0<SEVERITY>INFO</STATUS>',
    `<DTSERVER>${formatOfxDateTime(now)}`,
    '<LANGUAGE>ENG',
    `<FI><ORG>${bankName}<FID>${DEFAULT_INTU_BID}</FI>`,
    `<INTU.BID>${DEFAULT_INTU_BID}`,
    '<INTU.USERID>anonymous',
    '</SONRS></SIGNONMSGSRSV1>',
  ].join('');

  const accountBlock = [
    '<BANKMSGSRSV1><STMTTRNRS><TRNUID>0<STATUS><CODE>0<SEVERITY>INFO</STATUS><STMTRS>',
    `<CURDEF>${currency}`,
    `<BANKACCTFROM><BANKID>${DEFAULT_BANK_ID}<ACCTID>${DEFAULT_ACCOUNT_ID}<ACCTTYPE>${accountType}</BANKACCTFROM>`,
    '<BANKTRANLIST>',
    `<DTSTART>${formatOfxDate(startDate)}000000`,
    `<DTEND>${formatOfxDate(endDate)}235959`,
  ].join('');

  const transactionBlocks = sorted
    .map((transaction) => {
      const trnType = getTransactionType(transaction.amount);
      const dtPosted = formatOfxDate(transaction.date);
      const trnAmt = formatAmount(transaction.amount);
      const fitId = generateFitId(transaction);
      const name = escapeOfx(transaction.description.slice(0, 32));

      return [
        '<STMTTRN>',
        `<TRNTYPE>${trnType}`,
        `<DTPOSTED>${dtPosted}`,
        `<TRNAMT>${trnAmt}`,
        `<FITID>${fitId}`,
        `<NAME>${name}`,
        '</STMTTRN>',
      ].join('');
    })
    .join('');

  const footer = [
    '</BANKTRANLIST>',
    `<LEDGERBAL><BALAMT>0.00<DTASOF>${formatOfxDate(endDate)}`,
    '</LEDGERBAL>',
    '</STMTRS></STMTTRNRS></BANKMSGSRSV1>',
    '</OFX>',
  ].join('');

  return `${header}${signOn}${accountBlock}${transactionBlocks}${footer}`;
}

export function downloadQboFile(
  transactions: NormalizedTransaction[],
  options: QboOptions,
  fileName: string
): void {
  const content = generateQboFile(transactions, options);
  const blob = new Blob([content], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const baseName = fileName.replace(/\.csv$/i, '') || 'converted';
  link.href = url;
  link.download = `${baseName}.qbo`;
  link.click();
  URL.revokeObjectURL(url);
}
