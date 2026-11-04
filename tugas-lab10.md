# Tugas Lab 10: Komunikasi Antar Service via Message Queue (Individu)

## 1. Tautan repository
**Tautan:** (ISI SETELAH PUSH)

Berisi folder `notification-service`, perubahan `order-service/order-service.js`, dan `diagram-arsitektur.md`. Tanpa `node_modules` dan tanpa kredensial (pakai env `AMQP_URL`).

## 2. Screenshot consumer mati
- Dashboard, Ready = 3: `evidence/lab10/01-ready-3.png`
- Log consumer setelah dinyalakan (pesanan #2, #3, #4): `evidence/lab10/02-consumer-pulih.png`
- Dashboard setelah diproses, Ready = 0: `evidence/lab10/06-ready-0.png`

## 3. Screenshot uji `--crash`
Log `--crash` yang memperlihatkan "email terkirim: pesanan #14" muncul dua kali: `evidence/lab10/05-crash-dua-kali.png`

## 4. Diagram arsitektur
Lihat `diagram-arsitektur.md` (Mermaid, tampil otomatis di GitHub).

## 5. Penerapan ke proyek: Toko Kue

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

## 6. Refleksi

Bila RabbitMQ mati saat order dibuat, `channel` bernilai `null`, sehingga `publishOrderCreated` hanya mencetak peringatan dan mengembalikan `false`, sementara order tetap tersimpan dan klien tetap menerima 201. Akibatnya data tidak konsisten: order sudah ada, tetapi event-nya tidak pernah terkirim dan email tidak akan pernah dikirim. Untuk mengatasinya, event bisa disimpan lebih dulu di tabel outbox pada transaksi yang sama dengan order, lalu dikirim ulang oleh proses terpisah sampai berhasil. Agar consumer idempotent, simpan `messageId` di tabel database dengan unique constraint (bukan di memori), cek sebelum memproses, dan lakukan `ack` hanya setelah efek samping dan pencatatan tersimpan, sehingga duplikat akibat pengiriman ulang dapat dilewati. Panggilan sinkron seperti di lab 09 tetap lebih tepat ketika pemanggil butuh hasilnya segera untuk melanjutkan proses, misalnya memeriksa dan mengurangi stok sebelum order dikonfirmasi.
