// /api/goodreads — Vercel serverless function
// Goodreads retired its shelf RSS feeds (Oct 2026), so this reads the public profile page instead
// and extracts the "is currently reading" updates. On any failure it returns books: [] and the
// page keeps its static fallback list.

const USER_ID = '59268469';

export default async function handler(req, res) {
  const url = `https://www.goodreads.com/user/show/${USER_ID}`;
  let books = [];
  let error = null;
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });
    if (!r.ok) throw new Error(`upstream ${r.status}`);
    books = parseProfile(await r.text());
    await Promise.all(books.map(async (b) => { b.year = (await fetchYear(b.link)) || (await olYear(b.title, b.author)); }));
    if (!books.length) error = 'no currently-reading books found on profile';
  } catch (e) {
    error = String(e && e.message || e);
  }
  // 1h cache on success, 5 min on failure so recovery is quick.
  res.setHeader('Cache-Control', books.length
    ? 'public, s-maxage=3600, stale-while-revalidate=86400'
    : 'public, s-maxage=300');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(200).json({ shelf: 'currently-reading', source: 'profile', fetchedAt: new Date().toISOString(), error, books });
}

function parseProfile(html) {
  const out = [];
  const seen = new Set();
  const parts = html.split(/is\s+currently\s+reading/i);
  for (let i = 1; i < parts.length; i++) {
    const after = parts[i].slice(0, 3000);
    const before = parts[i - 1].slice(-2500);
    const t = after.match(/<a[^>]+href="([^"]*\/book\/show\/[^"]+)"[^>]*>\s*([^<]+?)\s*<\/a>/i);
    if (!t) continue;
    const a = after.match(/<a[^>]+href="[^"]*\/author\/show\/[^"]+"[^>]*>\s*(?:<span[^>]*>\s*)?([^<]+?)\s*(?:<\/span>\s*)?<\/a>/i);
    const imgs = [...before.matchAll(/<img[^>]+src="([^"]+)"/gi)];
    const img = imgs.length ? imgs[imgs.length - 1][1] : '';
    const link = abs(decode(t[1]));
    if (seen.has(link)) continue;
    seen.add(link);
    out.push({
      title: decode(t[2]).replace(/\s*[:(].*$/, '').trim() || decode(t[2]),
      author: a ? decode(a[1]) : '',
      year: '',
      image: img ? decode(img) : '',
      link,
      isbn: '',
      note: '',
      dateAdded: '',
    });
  }
  return out;
}

async function olYear(title, author) {
  try {
    const q = new URLSearchParams({ title, limit: '1', fields: 'first_publish_year' });
    if (author) q.set('author', author);
    const r = await fetch('https://openlibrary.org/search.json?' + q, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return '';
    const d = await r.json();
    const y = d.docs && d.docs[0] && d.docs[0].first_publish_year;
    return y ? String(y) : '';
  } catch (e) { return ''; }
}

async function fetchYear(link) {
  try {
    const r = await fetch(link, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', 'Accept-Language': 'en-US,en;q=0.9' },
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) return '';
    const h = await r.text();
    const m = h.match(/First published[^<\d]{0,20}(?:[A-Za-z]+\s+\d{1,2},\s+)?(\d{4})/i) || h.match(/Published[^<\d]{0,20}(?:[A-Za-z]+\s+\d{1,2},\s+)?(\d{4})/i);
    if (m) return m[1];
    const t = h.match(/"publicationTime"\s*:\s*(-?\d{6,})/);
    return t ? String(new Date(Number(t[1])).getUTCFullYear()) : '';
  } catch (e) { return ''; }
}

function abs(u) { return u.startsWith('http') ? u : 'https://www.goodreads.com' + u; }

function decode(s) {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .trim();
}
