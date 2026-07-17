import { NextResponse } from 'next/server';

import { getAllConfigs } from '@/shared/models/config';

const emptyAdsTxt = new NextResponse('', {
  status: 200,
  headers: {
    'Content-Type': 'text/plain',
  },
});

export async function GET() {
  const configs = await getAllConfigs();

  if (!configs.adsense_code) {
    return emptyAdsTxt;
  }

  try {
    const adsenseCode = configs.adsense_code.replace('ca-', '');
    const adsContent = `google.com, ${adsenseCode}, DIRECT, f08c47fec0942fa0`;

    return new NextResponse(adsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('get ads.txt failed:', error);
    return emptyAdsTxt;
  }
}
