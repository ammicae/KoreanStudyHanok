import express from 'express';

const app = express();

app.get('/krdict-proxy', async (req, res) => {
  const q = req.query.q;
  if (!q) {
    return res.status(400).json({ error: 'Missing q parameter' });
  }

  const apiKey = '09039EB86949159AD9DFFB98AD411BBD';
  const decoded = decodeURIComponent(q);
  const encoded = encodeURIComponent(decoded);
  const url = `https://krdict.korean.go.kr/api/search?key=${apiKey}&type_search=search&part=word&type=json&q=${encoded}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const data = await response.text();
    res.set('Content-Type', 'application/json');
    res.send(data);
  } catch (error) {
    res.status(502).json({ error: 'Failed to fetch from KRDict' });
  }
});

app.listen(3000, () => console.log('Proxy running on port 3000'));
