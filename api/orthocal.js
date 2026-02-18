/**
 * Vercel serverless function — proxies requests to orthocal.info.
 * Runs server-side so there are no browser CORS restrictions.
 *
 * Usage: GET /api/orthocal?calendar=oca&year=2026&month=02&day=18
 */
export default async function handler(req, res) {
  const { calendar = 'oca', year, month, day } = req.query;

  if (!year || !month || !day) {
    return res.status(400).json({ error: 'year, month, and day are required' });
  }

  const url = `https://orthocal.info/api/${calendar}/${year}/${month}/${day}/`;

  try {
    const upstream = await fetch(url);
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'upstream request failed' });
    }
    const data = await upstream.json();
    // Cache at the CDN edge for 24 hours (data doesn't change for a given date)
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    return res.json(data);
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach orthocal.info' });
  }
}
