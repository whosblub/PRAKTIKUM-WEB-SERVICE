const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
// PENTING: jangan pasang express.json() di sini; body harus diteruskan utuh ke service.

const swaggerUi = require('swagger-ui-express');

// lab 13: alamat service dibaca dari environment (nilai bawaan localhost untuk jalan manual)
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3000';
const ORDER_SERVICE_URL   = process.env.ORDER_SERVICE_URL   || 'http://localhost:3001';

const DOC_SOURCES = [
  { prefix: '/product-service', url: process.env.PRODUCT_DOC_URL || 'http://localhost:3000/openapi.json' },
  { prefix: '/order-service',   url: process.env.ORDER_DOC_URL   || 'http://localhost:3001/openapi.json' },
];

async function buildSpec() {
  const merged = {
    openapi: '3.0.3',
    info: { title: 'Toko API (via Gateway)', version: '1.0.0' },
    servers: [{ url: '/' }],                    // "Try it out" memakai alamat gateway
    paths: {},
    components: { schemas: {} },
  };
  for (const s of DOC_SOURCES) {
    try {
      const spec = await fetch(s.url, { signal: AbortSignal.timeout(2000) }).then(r => r.json());
      for (const [path, ops] of Object.entries(spec.paths || {})) merged.paths[s.prefix + path] = ops;
      Object.assign(merged.components.schemas, (spec.components || {}).schemas);
    } catch (e) {
      console.warn('dokumentasi gagal diambil dari', s.url);
    }
  }
  return merged;
}

// lab 12: ID permintaan dibuat di gateway, diteruskan ke service lewat header, dan dicatat dalam log JSON
const crypto = require('crypto');
app.use((req, res, next) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.headers['x-request-id']);
  if (req.path !== '/health') {
    const t0 = Date.now();
    res.on('finish', () => console.log(JSON.stringify({ time: new Date().toISOString(), service: 'gateway',
      id: req.headers['x-request-id'], method: req.method, path: req.originalUrl,
      status: res.statusCode, ms: Date.now() - t0 })));
  }
  next();
});
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'gateway' }));

app.get('/openapi.json', async (req, res) => res.json(await buildSpec()));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(null, { swaggerOptions: { url: '/openapi.json' } }));

app.use(createProxyMiddleware({
  pathFilter: '/product-service',
  pathRewrite: { '^/product-service': '' },
  target: PRODUCT_SERVICE_URL,
  changeOrigin: true,
}));

app.use(createProxyMiddleware({
  pathFilter: '/order-service',
  pathRewrite: { '^/order-service': '' },
  target: ORDER_SERVICE_URL,
  changeOrigin: true,
}));

app.listen(process.env.PORT || 8080, () => console.log('gateway di :8080'));
