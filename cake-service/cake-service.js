const express = require('express');
const app = express();
app.use(express.json());
require('./observability')(app, 'cake-service');   // lab 12: /health, /metrics, log JSON

const cakes = [
  { id: 1, name: 'Bolu Pandan',          price: 25000, stock: 20 },
  { id: 2, name: 'Brownies Cokelat',     price: 30000, stock: 15 },
  { id: 3, name: 'Cheesecake Blueberry', price: 55000, stock: 8 },
];

app.get('/cakes', (req, res) => res.json(cakes));

app.get('/cakes/:id', (req, res) => {
  const c = cakes.find(x => x.id === Number(req.params.id));
  c ? res.json(c) : res.status(404).json({ error: 'Kue tidak ditemukan' });
});

// dipanggil sale-service untuk mengurangi stok
app.post('/cakes/:id/reserve', (req, res) => {
  const c = cakes.find(x => x.id === Number(req.params.id));
  const qty = (req.body || {}).qty;
  if (!c) return res.status(404).json({ error: 'Kue tidak ditemukan' });
  if (!Number.isInteger(qty) || qty < 1) return res.status(400).json({ error: 'qty tidak valid' });
  if (c.stock < qty) return res.status(409).json({ error: 'Stok tidak cukup' });
  c.stock -= qty;
  res.json(c);
});

app.listen(process.env.PORT || 4000, () => console.log('cake-service di :4000'));
