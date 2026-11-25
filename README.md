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
| `PRODUCT_SERVICE_URL` | order-service, gateway | `http://localhost:3000` |
| `ORDER_SERVICE_URL` | gateway | `http://localhost:3001` |
| `CAKE_SERVICE_URL` | sale-service | `http://localhost:4000` |
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

## Menjalankan dengan Docker Compose (Lab 13)

Seluruh sistem toko (gateway, product-service, order-service, RabbitMQ, notification-service) dijalankan dengan satu perintah. Antar service saling menemukan lewat nama service di jaringan Compose (mis. `http://product-service:3000`, `amqp://rabbitmq`), bukan `localhost`.

**Prasyarat:** Docker Desktop (Compose v2) sudah berjalan. Hentikan service manual dan container RabbitMQ lama (`docker rm -f rabbit`) agar port tidak bentrok.

```bash
docker compose up --build        # build pertama butuh beberapa menit
docker compose ps                # semua service harus Up / healthy
npm test                         # test lab 12 terhadap gateway :8080 (tanpa ubah test)
docker compose logs order-service product-service notification-service
docker compose down              # matikan stack (data memori ikut hilang)
```

| Alamat | Keterangan |
|---|---|
| http://localhost:8080 | gateway (satu-satunya pintu masuk API) |
| http://localhost:8080/docs | dokumentasi API gabungan |
| http://localhost:15672 | dashboard RabbitMQ (guest / guest, hanya untuk praktik lokal) |

Port 3000 dan 3001 tidak dibuka ke host; klien hanya masuk lewat gateway. Setelah mengubah kode sebuah service, bangun ulang dengan `docker compose up -d --build <nama-service>`.

### Proyek individu: Toko Kue

Sistem proyek (cake-service + sale-service) punya file Compose sendiri, dengan `Dockerfile` di tiap folder service:

```bash
docker compose -f docker-compose.kue.yml up --build
npm run test:kue                                # test proyek terhadap :4000 dan :4001
docker compose -f docker-compose.kue.yml down
```

CI (`.github/workflows/ci.yml`) membangun dan menjalankan kedua stack ini, lalu menjalankan `npm test` dan `npm run test:kue`.
