import express from 'express';
import https from 'https';

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

  // Use https.get with custom headers and HTTP/1.1
  const requestUrl = new URL(url);

  const options = {
    hostname: requestUrl.hostname,
    path: requestUrl.pathname + requestUrl.search,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'Connection': 'keep-alive'
    },
    // Force HTTP/1.1 (disable HTTP/2)
    protocol: 'https:',
    port: 443
  };

  const request = https.get(options, (response) => {
    let data = '';
    response.on('data', chunk => { data += chunk; });
    response.on('end', () => {
      // Check if the response is JSON (original KRDict with type=json should return JSON)
      // But KRDict sometimes returns XML even with type=json. We'll handle both.
      res.set('Content-Type', 'application/json');
      // Attempt to detect if it's JSON or XML
      if (data.trim().startsWith('{')) {
        res.send(data);
      } else if (data.trim().startsWith('<')) {
        // Convert XML to JSON (or just return as is for now)
        // For simplicity, we'll return the XML wrapped in a JSON object
        res.json({ xml: data });
      } else {
        res.json({ raw: data });
      }
    });
  });

  request.on('error', (err) => {
    console.error('Proxy error:', err.message, 'URL:', url);
    res.status(502).json({ error: 'Failed to fetch from KRDict', details: err.message, url: url });
  });

  request.end();
});

app.listen(3000, () => console.log('Proxy running on port 3000'));
