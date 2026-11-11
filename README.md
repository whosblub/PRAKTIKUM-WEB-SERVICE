# Toko — Microservices (Lab 09 + Dokumentasi API Otomatis)

Sistem toko sederhana yang dipecah dari monolith menjadi service terpisah:

| Service | Port | Fungsi |
|---|---|---|
| product-service | 3000 | Data produk dan stok (`/products`, `/products/:id`, `/products/:id/reserve`) |
| order-service | 3001 | Membuat dan mendaftar pesanan; memanggil product-service, lalu mempublikasikan event `order.created` ke RabbitMQ |
| notification-service | - | Consumer event pesanan (lab 10, opsional) |
| gateway | 8080 | Pintu masuk tunggal: proxy `/product-service/*` dan `/order-service/*`, plus dokumentasi gabungan |

## Menjalankan

Jalankan `npm install` sekali di tiap folder service, lalu start di terminal terpisah dengan urutan berikut:

```bash
cd product-service && node product-service.js   # :3000
cd order-service   && node order-service.js     # :3001
cd gateway         && node gateway.js           # :8080
```

RabbitMQ tidak wajib untuk lab dokumentasi ini; tanpa RabbitMQ, order-service hanya menampilkan peringatan di log.

## Dokumentasi API

- Gabungan (via gateway): http://localhost:8080/docs, spesifikasi mentah di http://localhost:8080/openapi.json
- Per service: http://localhost:3000/docs dan http://localhost:3001/docs
- Salinan spesifikasi gabungan disimpan di `openapi.json` (bisa diimpor ke Postman atau editor.swagger.io).

Spesifikasi dihasilkan dari anotasi `@openapi` di kode tiap service (code-first). Gateway mengambilnya saat diminta dan menambahkan prefix path.

## Variabel environment

| Variabel | Dipakai oleh | Default |
|---|---|---|
| `PORT` | semua service | 3000 / 3001 / 8080 |
| `PRODUCT_SERVICE_URL` | order-service | `http://localhost:3000` |
| `AMQP_URL` | order-service, notification-service | `amqp://localhost` |
| `PRODUCT_DOC_URL` | gateway | `http://localhost:3000/openapi.json` |
| `ORDER_DOC_URL` | gateway | `http://localhost:3001/openapi.json` |
