# Panduan Penggunaan KRAI Scoreboard

Aplikasi papan skor interaktif ini dirancang khusus untuk memenuhi kebutuhan pertandingan robot **Kontes Robot ABU Indonesia (KRAI)**. Aplikasi ini memiliki tema gelap bernuansa futuristik (cybernetic glassmorphism) dengan detail warna khas merah untuk **Tim Merah**, biru untuk **Tim Biru**, dan emas/kuning untuk kondisi kemenangan mutlak.

---

## 🚀 Fitur Utama

1. **Timer Presisi 3 Menit (180 Detik)**
   - Dapat disesuaikan naik/turun per 1 detik atau 10 detik.
   - Dilengkapi progress bar visual yang menyusut seiring waktu.
   - Bunyi sinyal otomatis (Whistle/Buzzer/Beep) menggunakan Web Audio API.

2. **Kalkulasi Skor Otomatis & Manual**
   - Panel poin cepat: `+1`, `+5`, `+10`, `-1`, `-5`.
   - Ceklis Zona KRAI (Zona 1: `+10`, Zona 2: `+20`, Zona 3: `+30`, Khusus: `+40`). Poin otomatis bertambah/berkurang saat diceklis.

3. **Pelanggaran & Warning**
   - Indikator 3 dot merah/biru menyala jika tim melakukan pelanggaran.
   - Dilengkapi efek suara peringatan (*warning sound*).

4. **Kondisi Kemenangan Mutlak (HIROTO / VICTORY)**
   - Tombol Kemenangan Mutlak untuk menghentikan timer secara instan.
   - Panel tim pemenang akan bercahaya terang dan spanduk perayaan emas akan muncul di bagian tengah layar.

5. **Log Aktivitas Real-Time**
   - Mencatat setiap kejadian (penambahan skor, pelanggaran, waktu pause/start) secara otomatis sesuai waktu tersisa pertandingan.

6. **Penyimpanan Lokal (Local Storage)**
   - Semua nama tim, skor, sisa waktu, dan log akan tetap aman tersimpan meskipun halaman web tidak sengaja di-*refresh*.

---

## ⌨️ Daftar Pintasan Keyboard (Keyboard Hotkeys)

Untuk mempermudah juri atau operator dalam mengontrol jalannya pertandingan tanpa menyentuh mouse, gunakan pintasan keyboard berikut:

| Tombol Pintasan | Fungsi |
| :--- | :--- |
| **`Spasi`** | Memulai / Menangguhkan (*Start / Pause*) Timer pertandingan |
| **`R`** | Mengatur ulang (*Reset*) seluruh skor, checklist, pelanggaran, dan timer |
| **`Q`** | Menambah **1** Poin untuk **Tim Merah** |
| **`A`** | Mengurangi **1** Poin untuk **Tim Merah** |
| **`W`** | Menambah **5** Poin untuk **Tim Merah** |
| **`S`** | Menambah 1 Pelanggaran (**Warning**) untuk **Tim Merah** |
| **`P`** | Menambah **1** Poin untuk **Tim Biru** |
| **`L`** | Mengurangi **1** Poin untuk **Tim Biru** |
| **`O`** | Menambah **5** Poin untuk **Tim Biru** |
| **`K`** | Menambah 1 Pelanggaran (**Warning**) untuk **Tim Biru** |

> [!NOTE]
> Pintasan keyboard dinonaktifkan secara otomatis saat Anda sedang mengetik di input teks (seperti kolom nama tim atau form modal) agar tidak memicu perubahan skor yang tidak disengaja.

---

## 📁 Struktur Berkas Proyek

Proyek ini dibuat menggunakan teknologi vanilla web tanpa *library* eksternal yang rumit, sehingga performanya sangat cepat dan ringan:

- [index.html](file:///c:/Users/asus/Desktop/Testing/scoreboard/index.html) - Struktur dasar HTML5, modal, dan tata letak scoreboard.
- [style.css](file:///c:/Users/asus/Desktop/Testing/scoreboard/style.css) - Desain antarmuka cybernetic dark-mode, glassmorphism, efek glow, dan adaptif responsif.
- [app.js](file:///c:/Users/asus/Desktop/Testing/scoreboard/app.js) - Logika timer, kontrol keyboard, synthesizer suara, manajemen state, dan riwayat log.

---

## 🛠️ Cara Menjalankan Aplikasi

Anda dapat membuka file `index.html` secara langsung di browser mana pun (Chrome, Edge, Firefox, dll.). 

Jika ingin menjalankannya menggunakan server lokal, jalankan perintah berikut di PowerShell atau terminal Anda:

```powershell
python -m http.server 8080
```
Lalu buka alamat berikut di peramban Anda: `http://127.0.0.1:8080`
