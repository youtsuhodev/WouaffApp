export interface LinkPreview {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
  error?: string;
}

const URL_REGEX = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]}>'"])/gi;

export function parseUrls(text: string): string[] {
  const matches = text.match(URL_REGEX);
  return matches || [];
}

export function textToParts(text: string): Array<{ type: 'text'; value: string } | { type: 'url'; value: string }> {
  const parts: Array<{ type: 'text'; value: string } | { type: 'url'; value: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(URL_REGEX.source, 'gi');

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'url', value: match[0] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'text', value: text }];
}

const previewCache = new Map<string, LinkPreview>();

export async function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
  const cached = previewCache.get(url);
  if (cached) return cached;

  try {
    const res = await fetch('/api/link-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) return null;
    const data: LinkPreview = await res.json();
    if (data.error) return null;
    previewCache.set(url, data);
    return data;
  } catch {
    return null;
  }
}

export function isSocialUrl(url: string): boolean {
  const social = [
    'youtube.com',
    'youtu.be',
    'twitter.com',
    'x.com',
    'instagram.com',
    'tiktok.com',
    'facebook.com',
    'twitch.tv',
    'discord.com',
    'reddit.com',
    'linkedin.com',
    'spotify.com',
    'soundcloud.com',
  ];
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return social.some((s) => host === s || host.endsWith('.' + s));
  } catch {
    return false;
  }
}
