// Builds /llms.txt on request so AI crawlers always get the current site info
// plus the live Goodreads "currently-reading" shelf and published notes.
const SITE = 'https://princetomar.com';
const USER_ID = '59268469';

const HEAD = `# Prince Tomar

> Doctoral researcher at Tallinn University. Field notes on ethnography, borders, infrastructure, and the Indian Himalaya.

## About

Prince Tomar is a doctoral researcher at the Centre for Landscape and Culture, Tallinn University (Estonia). He works with borderland communities along the Indian Himalaya — with a particular focus on road development, tracing the interplay between infrastructure, territorialisation, and the region's history, geopolitics, and terrain.

His current project studies the spatial-temporal dimensions of change in the Indian Himalaya as the pace of road development quickens. His fieldwork is primarily located in Ladakh and the Terai.

Beyond his academic work, he writes poems and is interested in the porous border between ethnography and literary studies.

His website (${SITE}) is an open notebook: photographs from the field, writing, small experiments with AI, a road game, and an epilogue of things being read and thought about. The site is available in English and Hindi.

## Field Sites

- [Ladakh — The Cold Frontier](${SITE}/border-regions/ladakh.html): Field Site 1. Cold desert at 3500m. Road development, borderlands, and infrastructure in the Indian Himalaya. Fieldwork 2022 — ongoing.
- [Terai — A Porous Edge](${SITE}/border-regions/terai.html): Field Site 2. Lowland at 80m. Cross-border mobility at the Raxaul–Birgunj checkpoint, India–Nepal border. Fieldwork 2020 — ongoing.

## Writing & Publications

- 2026 — [Are They the Infrastructure?](https://bangalorereview.com/2026/10/are-they-the-infrastructure/): Ethnographic essay, The Bangalore Review.
- 2026 — [Builders, Building, and the Built: Ladakh and the eventfulness of road development](https://doi.org/10.2218/himalaya.2026.10981): Peer-reviewed article, HIMALAYA journal. DOI: 10.2218/himalaya.2026.10981
- 2026 — "Toward the Dust": Border Crossing and the State of Infrastructure at the India-Nepal Border: Peer-reviewed article, under review at Asian Geographer.
- 2026 — Negotiating Remoteness: Heterotopic Roads and Border Tourism in Ladakh, India: Peer-reviewed article, under review at Journal of Tourism and Cultural Change.
- 2025 — [Review of Pyre directed by Vinod Kapri](https://doi.org/10.2218/himalaya.2025.10878): Film review, HIMALAYA journal. DOI: 10.2218/himalaya.2025.10878
- 2021 — [The field, the border, and I](https://ethnomarginalia.com/the-field-the-border-and-i/): Essay, Ethnographic Marginalia.

## Experiments with AI

- [Peer Review Tracker](https://tracker.princetomar.com) (2026): Turns academic reviewer feedback into a structured, gamified revision roadmap. No accounts, data saved locally.
- [Bard's Balm](https://opal.google/app/1ptWkLqszsDuwhi3SLZgFU_dFcejuoWSO) (2025): Shakespeare-verse generator for academic moods.
- *An LLM walks the trans-Himalaya* — ongoing comparison of human memory vs LLM interpretation of fieldwork photographs.

## Play

- [Road game](${SITE}/#writing): An "anti-game" of the journey through the Himalaya, about waiting and letting the mountains do their thing.

## Photography

- [Gallery / Exhibitions](https://gallery.princetomar.com): Documentary photography from the field, grouped by theme.
`;

const TAIL = `
## CV & Contact

- [CV Download](${SITE}/Prince-Tomar-CV.pdf): Full academic CV in PDF.
- [CV page](${SITE}/cv.html)
- Institution: Tallinn University, Estonia
- Department: Centre for Landscape and Culture
- Email: via princetomar.com
- ORCID: [0000-0001-6306-7710](https://orcid.org/0000-0001-6306-7710)
- GitHub: [borderfull](https://github.com/borderfull)
- LinkedIn: [prince-tomar-6930975a](https://www.linkedin.com/in/prince-tomar-6930975a/)
- Goodreads: [Prince](https://www.goodreads.com/user/show/59268469-prince)

## Research Keywords

Ethnography, borderlands, infrastructure, road development, Indian Himalaya, Ladakh, Terai, territorialisation, geopolitics, landscape studies, literary ethnography, field photography, Tallinn University, Centre for Landscape and Culture.
`;

function pick(block, tag) {
  const m = block.match(new RegExp('<' + tag + '\\b[^>]*>([\\s\\S]*?)<\\/' + tag + '>', 'i'));
  if (!m) return '';
  return m[1].trim().replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim()
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

async function readingSection() {
  try {
    const r = await fetch(`https://www.goodreads.com/review/list_rss/${USER_ID}?shelf=currently-reading`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; portfolio-llms/1.0)', Accept: 'application/rss+xml, */*' },
    });
    if (!r.ok) throw new Error(r.status);
    const xml = await r.text();
    const items = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/g)].map((m) => {
      const b = m[1], title = pick(b, 'title'), author = pick(b, 'author_name'), year = pick(b, 'book_published'), link = pick(b, 'link');
      return title ? `- ${title}${author ? ' — ' + author : ''}${year ? ' (' + year + ')' : ''}${link ? ' ' + link : ''}` : '';
    }).filter(Boolean);
    return items.length ? items.join('\n') : '- (shelf currently empty)';
  } catch (e) {
    return '- (live shelf unavailable right now; see the Goodreads profile)';
  }
}

async function notesSection() {
  try {
    const r = await fetch(`${SITE}/notes/index.json`);
    if (!r.ok) return '';
    const list = await r.json();
    if (!Array.isArray(list) || !list.length) return '';
    const lines = list.slice(0, 20).map((n) => `- ${n.title || n.slug || 'Untitled'}${n.date ? ' (' + n.date + ')' : ''}`);
    return `\n### Ideas circling (short notes)\n\n${lines.join('\n')}\n`;
  } catch (e) {
    return '';
  }
}

async function build() {
  const [reading, notes] = await Promise.all([readingSection(), notesSection()]);
  return `${HEAD}
## Epilogue — Currently Reading & Thinking

### Currently reading (live from Goodreads, updated daily)

${reading}

Full shelf: https://www.goodreads.com/user/show/59268469-prince
${notes}${TAIL}`;
}

module.exports = { build };
