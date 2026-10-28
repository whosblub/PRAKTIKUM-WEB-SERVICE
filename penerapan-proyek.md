# Penerapan ke Proyek Individu

Sistem: **Toko Kue**, dipecah menjadi dua service dengan data masing-masing.

| Service | Data yang dimiliki | API yang ditawarkan | Dipanggil oleh / memanggil |
|---|---|---|---|
| cake-service | Daftar kue (id, nama, harga, stok) | `GET /cakes`, `GET /cakes/:id`, `POST /cakes/:id/reserve` (kurangi stok) | Dipanggil oleh sale-service saat ada pembelian, untuk mengurangi stok |
| sale-service | Data transaksi penjualan (id, kue, jumlah, total, waktu) | `POST /sales`, `GET /sales` | Memanggil `POST /cakes/:id/reserve` di cake-service (dengan timeout dan penanganan error 503) |

Aturan: sale-service tidak membaca data kue secara langsung. Stok dan harga diminta lewat API cake-service. Sale-service menyimpan salinan nama dan harga kue saat transaksi agar riwayat tetap benar walau harga berubah.
