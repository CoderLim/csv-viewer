import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getThemePage } from '@/core/theme';
import { getMetadata } from '@/shared/lib/seo';
import { DynamicPage } from '@/shared/types/blocks/landing';

export const revalidate = 3600;

export const generateMetadata = getMetadata({
  metadataKey: 'pages.json-to-csv.metadata',
  canonicalUrl: '/json-to-csv',
});

export default async function JsonToCsvPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('pages.json-to-csv');
  const pageConfig = t.raw('page') as DynamicPage;

  const page: DynamicPage = {
    ...pageConfig,
    sections: {
      ...pageConfig.sections,
      hero: {
        ...pageConfig.sections?.hero,
        json_tool: t.raw('tool'),
      },
    },
  };

  const Page = await getThemePage('dynamic-page');

  return <Page locale={locale} page={page} />;
}
