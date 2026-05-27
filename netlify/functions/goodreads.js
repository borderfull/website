// /.netlify/functions/goodreads — Netlify function (same job as api/goodreads.js
// for Vercel). Pulls the currently-reading RSS, parses it, caches at the
// Netlify CDN for 24h. A redirect in netlify.toml maps /api/goodreads to this
// path so the page's fetch URL is identical on both platforms.

const USER_ID = '59268469';
const SHELF = 'currently-reading';

exports.handler = async function () {
  const url = `https://www.goodreads.com/review/list_rss/${USER_ID}?shelf=${encodeURIComponent(SHELF)}`;

  let books = [];
  let error = null;

  try {
    const r = await fetch(url, {
      headers: {
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

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Netlify honours standard Cache-Control on function responses; the
      // CDN-specific header is more authoritative and ignored by browsers.
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'Netlify-CDN-Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
    },
    body: JSON.stringify({
      shelf: SHELF,
      fetchedAt: new Date().toISOString(),
      error,
      books,
    }),
  };
};

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
  v = v.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
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
