/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Serves a lightweight, server-rendered HTML page with baked-in Open Graph
 * meta tags for a single photo. This is ONLY ever hit by social-media link
 * crawlers (see the `has` header match in vercel.json that routes
 * /gallery/:id here for known bot user-agents) — real visitors always get
 * the normal React app. Crawlers don't execute JavaScript, so this is the
 * only way they'll ever see photo-specific title/description/image tags
 * instead of the generic index.html shell.
 */
import { loadDB, toPublicDB } from '../lib/db.js';

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderHtml(opts: { title: string; description: string; image: string; url: string }): string {
  const title = escapeHtml(opts.title);
  const description = escapeHtml(opts.description);
  const image = escapeHtml(opts.image);
  const url = escapeHtml(opts.url);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<meta name="description" content="${description}" />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Manx Media" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${image}" />
<meta property="og:url" content="${url}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${image}" />
</head>
<body>
<p>${title}</p>
<p>${description}</p>
<a href="${url}">View on Manx Media</a>
</body>
</html>`;
}

export default async function handler(req: any, res: any) {
  const rawId = req.query?.id;
  const id = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '';

  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const host = req.headers.host;
  const siteUrl = `${proto}://${host}`;

  try {
    const db = await loadDB();
    const publicDb = toPublicDB(db);
    const photo = publicDb.photos.find((p: any) => p.id === id);

    if (!photo) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(404).send(
        renderHtml({
          title: 'Manx Media | Isle of Man Photography',
          description: 'Fine-art landscapes, automotive, and portrait photography from the Isle of Man by Jacob Crowe.',
          image: `${siteUrl}/favicon.png`,
          url: `${siteUrl}/gallery`,
        })
      );
      return;
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400');
    res.status(200).send(
      renderHtml({
        title: `${photo.title} | Manx Media`,
        description: photo.description || 'Fine-art photography by Jacob Crowe, Manx Media.',
        image: photo.imageUrl,
        url: `${siteUrl}/gallery/${encodeURIComponent(photo.id)}`,
      })
    );
  } catch (err: any) {
    res.status(500).send('Error generating preview.');
  }
}
