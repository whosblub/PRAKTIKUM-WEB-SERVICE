const express = require('express');
const app = express();
app.use(express.json());
require('./observability')(app, 'sale-service');   // lab 12: /health, /metrics, log JSON

const CAKE_URL = process.env.CAKE_SERVICE_URL || 'http://localhost:4000';
const sales = [];

app.post('/sales', async (req, res) => {
  const { cakeId, qty } = req.body || {};
  if (!Number.isInteger(cakeId) || !Number.isInteger(qty) || qty < 1)
    return res.status(400).json({ error: 'cakeId dan qty harus bilangan bulat > 0' });

  let resp;
  try {
    resp = await fetch(`${CAKE_URL}/cakes/${cakeId}/reserve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Request-Id': req.id },
      body: JSON.stringify({ qty }),
      signal: AbortSignal.timeout(2000),
    });
  } catch (err) {
    return res.status(503).json({ error: 'cake-service tidak tersedia, coba lagi nanti' });
  }

  const data = await resp.json();
  if (!resp.ok) return res.status(resp.status).json(data);   // 404 / 409 diteruskan apa adanya

  // salinan nama dan harga disimpan agar riwayat tetap benar walau harga berubah
  const sale = { id: sales.length + 1, cakeId, cakeName: data.name, unitPrice: data.price,
                 qty, total: data.price * qty, createdAt: new Date().toISOString() };
  sales.push(sale);
  res.status(201).json(sale);
});

app.get('/sales', (req, res) => res.json(sales));

app.listen(process.env.PORT || 4001, () => console.log('sale-service di :4001'));
