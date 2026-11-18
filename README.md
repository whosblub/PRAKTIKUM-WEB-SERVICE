![CI](https://github.com/whosblub/TUGAS-WEB-SERVICE/actions/workflows/ci.yml/badge.svg)

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
| `PORT` | semua service | 3000 / 3001 / 8080 (cake 4000, sale 4001) |
| `PRODUCT_SERVICE_URL` | order-service | `http://localhost:3000` |
| `AMQP_URL` | order-service, notification-service | `amqp://localhost` |
| `PRODUCT_DOC_URL` | gateway | `http://localhost:3000/openapi.json` |
| `ORDER_DOC_URL` | gateway | `http://localhost:3001/openapi.json` |

## Pengujian Otomatis, Observability, dan CI (Lab 12)

| Komponen | Fungsi |
|---|---|
| `tests/api.test.js` | 10 test black-box lewat gateway (status, bentuk respons, efek samping, `/health`, header `X-Request-Id`) |
| `tests/toko-kue.test.js` | 8 test proyek Toko Kue (cake-service :4000 dan sale-service :4001) |
| `*/observability.js` | `/health`, `/metrics`, dan log JSON per permintaan (memuat `id`), disalin ke tiap service |
| `gateway/gateway.js` | Membuat `X-Request-Id`, meneruskannya ke service, `/health`, dan log JSON |
| `monitor.js` | Cek `/health` tiap 5 detik untuk semua komponen; mencetak `ALERT` dan `RECOVERED` |
| `.github/workflows/ci.yml` | Menyalakan semua service dan menjalankan `npm test` serta `npm run test:kue` pada setiap push |

Menjalankan test secara lokal (semua service harus menyala; RabbitMQ tidak perlu):

```bash
node product-service/product-service.js   # :3000
node order-service/order-service.js       # :3001
node gateway/gateway.js                   # :8080
node cake-service/cake-service.js         # :4000
node sale-service/sale-service.js         # :4001
npm test            # lab 09 toko, lewat gateway
npm run test:kue    # proyek Toko Kue
node monitor.js     # pemantau ketersediaan
```

Bukti praktik lab 12 ada di `evidence/lab12/`.
