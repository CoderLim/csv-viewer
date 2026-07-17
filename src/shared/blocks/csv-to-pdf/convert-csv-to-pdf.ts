import type { ParsedCsv } from '@/shared/blocks/csv-viewer/types';

const FONT_URL = '/fonts/NotoSansSC-Regular.ttf';
const FONT_VFS_NAME = 'NotoSansSC-Regular.ttf';
const FONT_FAMILY = 'NotoSansSC';

let cachedFontBase64: string | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

async function loadFontBase64(): Promise<string> {
  if (cachedFontBase64) return cachedFontBase64;
  const response = await fetch(FONT_URL);
  if (!response.ok) {
    throw new Error(`Failed to load font: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  cachedFontBase64 = arrayBufferToBase64(buffer);
  return cachedFontBase64;
}

export async function downloadCsvAsPdf(data: ParsedCsv): Promise<void> {
  const [{ jsPDF }, autoTableModule, fontBase64] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    loadFontBase64(),
  ]);

  const autoTable = autoTableModule.default;

  // Wide tables read better in landscape.
  const orientation = data.headers.length > 4 ? 'landscape' : 'portrait';
  const doc = new jsPDF({ orientation, unit: 'pt', format: 'a4' });

  doc.addFileToVFS(FONT_VFS_NAME, fontBase64);
  doc.addFont(FONT_VFS_NAME, FONT_FAMILY, 'normal');
  doc.setFont(FONT_FAMILY);

  autoTable(doc, {
    head: [data.headers],
    body: data.rows,
    styles: {
      font: FONT_FAMILY,
      fontStyle: 'normal',
      fontSize: 8,
      cellPadding: 4,
      overflow: 'linebreak',
    },
    headStyles: {
      font: FONT_FAMILY,
      fontStyle: 'normal',
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
    },
    margin: { top: 32, right: 24, bottom: 32, left: 24 },
  });

  const baseName = data.fileName.replace(/\.csv$/i, '') || 'converted';
  doc.save(`${baseName}.pdf`);
}
