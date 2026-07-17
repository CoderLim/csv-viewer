import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getThemePage } from '@/core/theme';
import { getMetadata } from '@/shared/lib/seo';
import { DynamicPage } from '@/shared/types/blocks/landing';

export const revalidate = 3600;

export const generateMetadata = getMetadata({
  metadataKey: 'pages.csv-to-qbo.metadata',
  canonicalUrl: '/csv-to-qbo',
});

export default async function CsvToQboPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('pages.csv-to-qbo');
  const pageConfig = t.raw('page') as DynamicPage;

  const page: DynamicPage = {
    ...pageConfig,
    sections: {
      ...pageConfig.sections,
      hero: {
        ...pageConfig.sections?.hero,
        csv_qbo_tool: t.raw('tool'),
      },
    },
  };

  const Page = await getThemePage('dynamic-page');

  return <Page locale={locale} page={page} />;
}
