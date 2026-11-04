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