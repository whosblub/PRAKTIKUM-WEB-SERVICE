# Pengumpulan Lab 12 (Tugas Individu): Automated Testing & Monitoring API

Nama: Robertus Geraldyn Alexandro Gabeler (Gabe) | Repository: <ISI TAUTAN GITHUB> | Run hijau (main): <ISI TAUTAN ACTIONS> | Run merah (uji-gagal): <ISI TAUTAN ACTIONS>

## Isi pengumpulan

| No | Bukti | Berkas / tautan | Catatan |
|---|---|---|---|
| 1 | Tautan repository | tautan GitHub | repository publik atau dosen diberi akses |
| 2 | Screenshot `npm test` lulus | `01-npm-test-lulus.txt` (output) | ambil screenshot terminal sendiri; 10 test lulus, dua kali jalan |
| 3 | Screenshot test gagal (langkah 03) dan hasil setelah diperbaiki | `02-test-gagal-regresi.txt`, `03-test-lulus-lagi.txt` | gagal: `400 !== 409` pada test 409 |
| 4 | Potongan log service dengan `id` sama | `05-trace-id-lintas-service.txt` | gateway, order-service, product-service (plus sale, cake) |
| 5 | Screenshot monitor ALERT dan RECOVERED | `06-monitor-alert-recovered.txt`, `07-order-saat-product-mati.txt` | order saat product mati menghasilkan 503, `errors5xx: 3` |
| 6a | Halaman Actions, run hijau pada `main` | tautan | |
| 6b | Screenshot run merah pada `uji-gagal` | screenshot | langkah *Run tests* menampilkan test yang gagal |
| 6c | README dengan badge CI | `README.md` baris pertama | ganti `USERNAME/REPO` |
| 7 | Penerapan ke proyek | `cake-service/`, `sale-service/`, `tests/toko-kue.test.js`, `penerapan-proyek.md`, `monitor.js`, `ci.yml` | `/health` + 8 test (3 jenis per service) |
| 8 | Refleksi | di bawah | |

## Refleksi

Test saya hanya membuktikan kontrak yang saya tulis lewat gateway, sehingga tidak akan menangkap bug di jalur yang tidak diuji, balapan stok saat banyak order bersamaan, event RabbitMQ yang tidak terkirim (log hanya memberi peringatan, order tetap 201), maupun data yang hilang saat service restart karena disimpan di memori. ID permintaan penting pada microservices karena satu transaksi melewati gateway, order-service, dan product-service; dengan `id` yang sama saya bisa mencari satu nilai dan melihat seluruh perjalanannya, tanpa harus mencocokkan jam antar log secara manual. Log yang hanya tampil di terminal hilang saat terminal ditutup atau service crash, tersebar di tiap proses, dan tidak bisa dicari atau dikumpulkan di satu tempat. Bila `/health` selalu menjawab "ok" tanpa memeriksa dependensi, monitor menampilkan UP padahal sistem sebenarnya tidak berfungsi (misalnya order-service hidup tetapi product-service mati sehingga semua order 503), jadi alarm terlambat dan keputusan operasional salah. Contoh yang lulus di laptop tetapi gagal di CI: `require('./observability')` yang file-nya belum di-commit atau berbeda huruf besar/kecil (Windows tidak membedakan, Linux di GitHub membedakan), sehingga service crash saat dinyalakan.
