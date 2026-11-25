# Penerapan ke Proyek Individu

Sistem: **Toko Kue**, dipecah menjadi dua service dengan data masing-masing.

| Service | Data yang dimiliki | API yang ditawarkan | Dipanggil oleh / memanggil |
|---|---|---|---|
| cake-service | Daftar kue (id, nama, harga, stok) | `GET /cakes`, `GET /cakes/:id`, `POST /cakes/:id/reserve` (kurangi stok) | Dipanggil oleh sale-service saat ada pembelian, untuk mengurangi stok |
| sale-service | Data transaksi penjualan (id, kue, jumlah, total, waktu) | `POST /sales`, `GET /sales` | Memanggil `POST /cakes/:id/reserve` di cake-service (dengan timeout dan penanganan error 503) |

Aturan: sale-service tidak membaca data kue secara langsung. Stok dan harga diminta lewat API cake-service. Sale-service menyimpan salinan nama dan harga kue saat transaksi agar riwayat tetap benar walau harga berubah.

---

## Lab 10: Komunikasi Asinkron (RabbitMQ)

Praktik lab 10 dibuktikan pada toko lab 09 (order-service menerbitkan `order.created`, notification-service mengonsumsinya). Pola yang sama diterapkan pada Toko Kue di bawah ini. Bukti praktik ada di `evidence/lab10/`, dan diagramnya di `diagram-arsitektur.md`.

### Interaksi yang diubah menjadi asinkron

Interaksi yang diubah menjadi asinkron: pemberitahuan setelah transaksi penjualan tersimpan. Pengurangan stok (`POST /cakes/:id/reserve`) tetap sinkron karena hasilnya menentukan apakah transaksi boleh dibuat.

| Aspek | Isi |
|---|---|
| Nama event | `sale.created` |
| Producer | sale-service, setelah transaksi tersimpan |
| Consumer | notification-service (kirim struk/email konfirmasi); opsional report-service (rekap penjualan harian) |
| Exchange | `sales` (fanout, durable) |

Contoh isi pesan:

```json
{
  "type": "sale.created",
  "data": { "id": 7, "cakeId": 2, "cakeName": "Brownies Cokelat", "qty": 3, "total": 90000, "createdAt": "2026-11-04T09:15:00.000Z" }
}
```

Properti pesan: `messageId = "sale-7"`, `persistent = true`, `contentType = application/json`.

Alasan cocok asinkron: struk dan rekap tidak perlu selesai sebelum pembeli mendapat balasan, sehingga transaksi tetap sukses walau notification-service sedang mati. Pesan ditahan antrean dan diproses setelah consumer pulih. Consumer baru (misalnya report-service) bisa ditambah tanpa mengubah sale-service.

---

## Lab 12: Pengujian Otomatis dan Observability

Diterapkan pada Toko Kue (proyek individu). Kode: `cake-service/` (:4000) dan `sale-service/` (:4001); test: `tests/toko-kue.test.js`, dijalankan dengan `npm run test:kue`.

| Service | `/health` | Jalur sukses | Jalur error | Efek samping |
|---|---|---|---|---|
| cake-service | `GET /health` (200, `status: ok`) | `GET /cakes` memuat daftar kue berbentuk benar | reserve kue tak dikenal 404, `qty` tidak valid 400, stok kurang 409 | `POST /cakes/:id/reserve` mengurangi stok sebesar `qty` |
| sale-service | `GET /health` (200, `status: ok`) | `POST /sales` 201 dengan `unitPrice` dan `total` benar | input salah 400, kue tak dikenal 404, stok kurang 409 | transaksi muncul di `GET /sales` dan stok kue berkurang |

- `monitor.js` memantau gateway, product-service, order-service, cake-service, dan sale-service.
- `ci.yml` menyalakan kelima service, menunggu `/health`, lalu menjalankan `npm test` dan `npm run test:kue`.
- `X-Request-Id` dari sale-service diteruskan ke cake-service sehingga satu penjualan terlacak di kedua log.
- Catatan: kode sale-service pada tahap ini belum menerbitkan event `sale.created` ke RabbitMQ (lab 10 opsional); desainnya tetap seperti dijelaskan di atas.

---

## Lab 13: Deployment dengan Docker Compose

Toko Kue dikemas dengan `cake-service/Dockerfile` dan `sale-service/Dockerfile` (serta `.dockerignore`), lalu seluruh sistem dijalankan dari `docker-compose.kue.yml`:

```bash
docker compose -f docker-compose.kue.yml up --build
npm run test:kue
```

| Aspek | Isi |
|---|---|
| Alamat antar service | sale-service memanggil `http://cake-service:4000` lewat `CAKE_SERVICE_URL` (nama service, bukan `localhost`) |
| Urutan start | sale-service `depends_on` cake-service dengan `condition: service_healthy` |
| Health check | `GET /health` pada keduanya (dari lab 12) |
| Port ke host | 4000 dan 4001, dibuka agar `tests/toko-kue.test.js` bisa menguji langsung (belum ada gateway di Toko Kue) |
| CI | `ci.yml` membangun dan menjalankan stack toko dan stack Toko Kue, lalu `npm test` dan `npm run test:kue` |
