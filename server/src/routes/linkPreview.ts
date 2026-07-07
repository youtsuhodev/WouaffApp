import type { Request, Response } from 'express';
import { Router } from 'express';

const router: Router = Router();

function parseMeta(html: string, name: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property="og:${name}"[^>]+content="([^"]*)"`, 'i'),
    new RegExp(`<meta[^>]+content="([^"]*)"[^>]+property="og:${name}"`, 'i'),
    new RegExp(`<meta[^>]+name="twitter:${name}"[^>]+content="([^"]*)"`, 'i'),
    new RegExp(`<meta[^>]+content="([^"]*)"[^>]+name="twitter:${name}"`, 'i'),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1];
  }
  return null;
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'Missing url' });
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WouaffBot/1.0; +https://wouaff.app)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!response.ok) {
      res.json({ url, error: 'fetch_failed' });
      return;
    }

    const html = await response.text();
    const title = parseMeta(html, 'title') || parseMeta(html, 'description') || '';
    const description = parseMeta(html, 'description') || '';
    const image = parseMeta(html, 'image') || '';
    const siteName = parseMeta(html, 'site_name') || new URL(url).hostname;

    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const fallbackTitle = titleMatch ? titleMatch[1] : '';

    res.json({
      url,
      title: title || fallbackTitle || siteName,
      description,
      image,
      siteName,
    });
  } catch {
    res.json({ url: req.body.url, error: 'fetch_failed' });
  }
});

export default router;
