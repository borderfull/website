// Netlify: /llms.txt -> this function (see netlify.toml redirect)
const { build } = require('../../api/_llms-core.js');
exports.handler = async function () {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'Netlify-CDN-Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
    },
    body: await build(),
  };
};
