# Pengumpulan Lab 13 (Tugas Individu): Deployment Microservices (Docker Compose / Edge)

Nama: Robertus Geraldyn Alexandro Gabeler (Gabe) | Repository: <ISI TAUTAN GITHUB> | Run hijau (main): <ISI TAUTAN ACTIONS>

## Isi pengumpulan

| No | Bukti | Berkas / tautan | Catatan |
|---|---|---|---|
| 1 | Tautan repository | tautan GitHub | publik atau dosen diberi akses; tanpa `node_modules` dan kredensial |
| 2 | Screenshot `docker compose ps` | terminal, setelah `up --build` | semua service Up, yang punya healthcheck `healthy` |
| 3 | Screenshot `npm test` lulus terhadap stack Compose | terminal | 10 test lulus, test tidak diubah |
| 4 | Screenshot latihan kegagalan | terminal | `docker compose stop product-service` lalu POST order = **503**; `docker compose start product-service`, tunggu healthy, POST order = **201** |
| 5 | Tautan run Actions hijau pada `main` | tautan | workflow berbasis Compose (`ci.yml`) |
| 6 | Penerapan ke proyek | `docker-compose.kue.yml`, `cake-service/Dockerfile`, `sale-service/Dockerfile` | Toko Kue jalan dengan satu perintah; screenshot `docker compose -f docker-compose.kue.yml ps` dan `npm run test:kue` |
| 7 | Refleksi | di bawah | |

## Refleksi

Order-service memanggil `http://product-service:3000` dan bukan `localhost` karena di dalam container `localhost` menunjuk ke container itu sendiri, sedangkan nama `product-service` diterjemahkan menjadi alamat IP container oleh DNS internal Docker pada jaringan Compose. Karena container bersifat sementara dan data saya hanya ada di memori, `docker compose down` lalu `up` mengembalikan stok dan pesanan ke data awal; sistem nyata membutuhkan database terkelola seperti Neon atau volume agar data bertahan. Menaruh kredensial bawaan seperti `guest/guest` RabbitMQ di `docker-compose.yml` yang masuk repository berisiko karena siapa pun yang bisa membaca repository mengetahuinya dan riwayat Git menyimpannya selamanya. Pada produksi, rahasia sebaiknya diberikan lewat environment variable atau secret manager milik platform (bukan file di repository), dengan kredensial yang unik dan bisa diganti.
