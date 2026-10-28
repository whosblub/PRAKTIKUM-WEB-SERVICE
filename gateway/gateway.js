const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
// PENTING: jangan pasang express.json() di sini; body harus diteruskan utuh ke service.

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
