// /api/goodreads — Vercel serverless function
//
// Pulls the "currently-reading" shelf RSS from Goodreads, parses it into clean
// JSON, and serves it from the Vercel edge cache. Cache-Control below means
// the CDN holds the response for 24h, so Goodreads is only hit ~once a day
// across all visitors.  Zero cron jobs, zero scheduled commits, zero state.
//
// If Goodreads is down or the parse fails, we still return a 200 with an empty
// books array so the static HTML fallback keeps rendering cleanly.

const USER_ID = '59268469';
const SHELF = 'currently-reading';

export default async function handler(req, res) {
  const url = `https://www.goodreads.com/review/list_rss/${USER_ID}?shelf=${encodeURIComponent(SHELF)}`;

  let books = [];
  let error = null;

  try {
    const r = await fetch(url, {
      headers: {
        // Goodreads sometimes 403s default UA strings
        'User-Agent': 'Mozilla/5.0 (compatible; portfolio-shelf-sync/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    });
    if (!r.ok) throw new Error(`upstream ${r.status}`);
    const xml = await r.text();
    books = parseRss(xml);
  } catch (e) {
    error = String(e && e.message || e);
  }

  // 24h fresh, serve stale for another 12h while revalidating in background.
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(200).json({
    shelf: SHELF,
    fetchedAt: new Date().toISOString(),
    error,
    books,
  });
}

// --- tiny RSS parser (no deps) ---------------------------------------------

function parseRss(xml) {
  const out = [];
  const itemRe = /<item\b[^>]*>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml))) {
    const block = m[1];
    const title = pick(block, 'title');
    const author = pick(block, 'author_name');
    if (!title) continue;
    out.push({
      title,
      author,
      year: pick(block, 'book_published'),
      image: pick(block, 'book_large_image_url') || pick(block, 'book_image_url'),
      link: pick(block, 'link'),
      isbn: pick(block, 'isbn'),
      note: stripHtml(pick(block, 'user_notes') || pick(block, 'user_review') || ''),
      dateAdded: pick(block, 'user_date_added'),
    });
  }
  return out;
}

function pick(block, tag) {
  const re = new RegExp('<' + tag + '\\b[^>]*>([\\s\\S]*?)<\\/' + tag + '>', 'i');
  const m = block.match(re);
  if (!m) return '';
  let v = m[1].trim();
  // unwrap CDATA
  v = v.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
  // decode the few entities Goodreads emits
  v = v
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
  return v;
}

function stripHtml(s) {
  return s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
