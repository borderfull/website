// Vercel: /llms.txt -> /api/llms (see vercel.json rewrite)
const { build } = require('./_llms-core.js');
module.exports = async (req, res) => {
  const body = await build();
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200');
  res.status(200).send(body);
};
