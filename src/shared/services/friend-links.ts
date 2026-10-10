export interface FriendLink {
  link: string;
  siteName: string;
}

function getSiteDomain(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  try {
    return appUrl ? new URL(appUrl).hostname : '';
  } catch {
    return '';
  }
}

export async function getFriendLinks(): Promise<FriendLink[]> {
  try {
    const response = await fetch('https://api.klotski.org/get-friend-links', {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.error('Failed to fetch friend links:', response.statusText);
      return [];
    }

    const data = (await response.json()) as FriendLink[];
    const siteDomain = getSiteDomain();

    if (!siteDomain) {
      return data;
    }

    return data.filter((item) => !item.link.includes(siteDomain));
  } catch (error) {
    console.error('Error fetching friend links:', error);
    return [];
  }
}
