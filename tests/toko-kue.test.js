// Test proyek individu (Toko Kue): cake-service (:4000) dan sale-service (:4001).
// Tiga jenis per service: jalur sukses, jalur error, efek samping. Perbandingan relatif agar tahan stok berubah.
const { test } = require('node:test');
const assert = require('node:assert/strict');

const CAKE = process.env.CAKE_URL || 'http://localhost:4000';
const SALE = process.env.SALE_URL || 'http://localhost:4001';
const json = { 'Content-Type': 'application/json' };
const post = (base, p, body) => fetch(base + p, { method: 'POST', headers: json, body: JSON.stringify(body) });

// ---------- cake-service ----------
test('cake-service: GET /health mengembalikan 200 dan status ok', async () => {
  const res = await fetch(CAKE + '/health');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.service, 'cake-service');
});

test('cake-service [sukses]: GET /cakes mengembalikan daftar kue berbentuk benar', async () => {
  const res = await fetch(CAKE + '/cakes');
  assert.equal(res.status, 200);
  const list = await res.json();
  assert.ok(Array.isArray(list) && list.length > 0);
  for (const c of list) {
    assert.equal(typeof c.id, 'number');
    assert.equal(typeof c.name, 'string');
    assert.equal(typeof c.price, 'number');
    assert.equal(typeof c.stock, 'number');
  }
});

test('cake-service [error]: reserve kue tak dikenal 404 dan qty tidak valid 400', async () => {
  assert.equal((await post(CAKE, '/cakes/9999/reserve', { qty: 1 })).status, 404);
  assert.equal((await post(CAKE, '/cakes/1/reserve', { qty: 0 })).status, 400);
  const over = await post(CAKE, '/cakes/1/reserve', { qty: 100000 });
  assert.equal(over.status, 409);
  assert.ok((await over.json()).error);
});

test('cake-service [efek samping]: reserve mengurangi stok sebesar qty', async () => {
  const before = await (await fetch(CAKE + '/cakes/1')).json();
  const res = await post(CAKE, '/cakes/1/reserve', { qty: 2 });
  assert.equal(res.status, 200);
  const after = await (await fetch(CAKE + '/cakes/1')).json();
  assert.equal(after.stock, before.stock - 2);
});

// ---------- sale-service ----------
test('sale-service: GET /health mengembalikan 200 dan status ok', async () => {
  const res = await fetch(SALE + '/health');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.service, 'sale-service');
});

let sale;
test('sale-service [sukses]: POST /sales membuat transaksi (201) dengan total benar', async () => {
  const cake = await (await fetch(CAKE + '/cakes/2')).json();
  const res = await post(SALE, '/sales', { cakeId: 2, qty: 3 });
  assert.equal(res.status, 201);
  sale = await res.json();
  assert.equal(sale.cakeId, 2);
  assert.equal(sale.cakeName, cake.name);
  assert.equal(sale.unitPrice, cake.price);
  assert.equal(sale.total, cake.price * 3);
  assert.ok(res.headers.get('x-request-id'));
});

test('sale-service [error]: input salah 400, kue tak dikenal 404, stok kurang 409', async () => {
  assert.equal((await post(SALE, '/sales', { cakeId: 2, qty: 'abc' })).status, 400);
  assert.equal((await post(SALE, '/sales', { cakeId: 9999, qty: 1 })).status, 404);
  assert.equal((await post(SALE, '/sales', { cakeId: 2, qty: 100000 })).status, 409);
});

test('sale-service [efek samping]: transaksi tercatat di GET /sales dan stok kue berkurang', async () => {
  const list = await (await fetch(SALE + '/sales')).json();
  assert.ok(list.some(s => s.id === sale.id));
  const before = await (await fetch(CAKE + '/cakes/3')).json();
  assert.equal((await post(SALE, '/sales', { cakeId: 3, qty: 1 })).status, 201);
  const after = await (await fetch(CAKE + '/cakes/3')).json();
  assert.equal(after.stock, before.stock - 1);
});
