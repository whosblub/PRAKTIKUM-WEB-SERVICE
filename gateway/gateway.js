const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
// PENTING: jangan pasang express.json() di sini; body harus diteruskan utuh ke service.

const swaggerUi = require('swagger-ui-express');

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

app.get('/openapi.json', async (req, res) => res.json(await buildSpec()));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(null, { swaggerOptions: { url: '/openapi.json' } }));

app.use(createProxyMiddleware({
  pathFilter: '/product-service',
  pathRewrite: { '^/product-service': '' },
  target: 'http://localhost:3000',
  changeOrigin: true,
}));

app.use(createProxyMiddleware({
  pathFilter: '/order-service',
  pathRewrite: { '^/order-service': '' },
  target: 'http://localhost:3001',
  changeOrigin: true,
}));

app.listen(process.env.PORT || 8080, () => console.log('gateway di :8080'));
