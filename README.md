# Pemetaan Titik Pengelolaan Sampah — WebGIS

PTPS adalah aplikasi WebGIS responsif berbasis web yang dirancang khusus untuk petugas lapangan dalam mencatat, memetakan, memperbarui, dan mengelola titik lokasi tempat sampah secara interaktif dan real-time. Aplikasi ini memanfaatkan **Google Sheets** sebagai basis data persisten melalui **Google Sheets API v4**, peta interaktif **Leaflet** & **OpenStreetMap**, antarmuka modern **React & TypeScript**, serta **Vercel Serverless Functions** untuk backend yang aman dan efisien.

---

## Daftar Isi

1. [Ringkasan Proyek](#1-ringkasan-proyek)
2. [Arsitektur & Tech Stack](#2-arsitektur--tech-stack)
3. [Prasyarat Instalasi](#3-prasyarat-instalasi)
4. [Panduan Konfigurasi Google Cloud & Google Sheets](#4-panduan-konfigurasi-google-cloud--google-sheets)
   - [A. Membuat Proyek di Google Cloud Console](#a-membuat-proyek-di-google-cloud-console)
   - [B. Mengaktifkan Google Sheets API](#b-mengaktifkan-google-sheets-api)
   - [C. Membuat Google Service Account & Mengunduh Kunci Privat](#c-membuat-google-service-account--mengunduh-kunci-privat)
   - [D. Membuat Google Spreadsheet & Lembar Kerja](#d-membuat-google-spreadsheet--lembar-kerja)
   - [E. Membagikan Hak Akses Spreadsheet ke Service Account](#e-membagikan-hak-akses-spreadsheet-ke-service-account)
5. [Konfigurasi Environment Variables](#5-konfigurasi-environment-variables)
6. [Menjalankan Aplikasi Secara Lokal](#6-menjalankan-aplikasi-secara-lokal)
7. [Panduan Deployment ke Vercel](#7-panduan-deployment-ke-vercel)
8. [Uji Coba Alur CRUD Lapangan](#8-uji-coba-alur-crud-lapangan)
9. [Proteksi Akses & Keamanan Sesi](#9-proteksi-akses--keamanan-sesi)
10. [Batasan Google Sheets sebagai Database](#10-batasan-google-sheets-sebagai-database)
11. [Troubleshooting & Solusi Masalah Umum](#11-troubleshooting--solusi-masalah-umum)

---

## 1. Ringkasan Proyek

PTPS menjawab kebutuhan pendataan fasilitas sanitasi dan tempat sampah di lapangan tanpa memerlukan setup server database yang rumit atau biaya lisensi tinggi. Dengan antarmuka yang dioptimalkan untuk perangkat mobile maupun desktop, petugas dapat:
- Melihat seluruh titik tempat sampah yang telah terdaftar pada peta interaktif.
- Membedakan kondisi tempat sampah secara visual berdasarkan warna penanda:
  - 🟢 **Hijau (Baik)**: Tempat sampah dalam kondisi layak dan daya tampung mencukupi.
  - 🟠 **Oranye (Penuh)**: Tempat sampah telah penuh dan memerlukan jadwal pengangkutan segera.
  - 🔴 **Merah (Rusak)**: Tempat sampah mengalami kerusakan (pecah, berlubang, tutup hilang) dan perlu perbaikan/penggantian.
- Menentukan titik lokasi baru dengan mengetuk peta atau menggunakan GPS perangkat ("Gunakan Lokasi Saya").
- Menyesuaikan koordinat secara presisi dengan menggeser penanda sementara (*draggable marker*).
- Memfilter tampilan peta berdasarkan jenis sampah (**Organik**, **Anorganik**, **Campuran**) serta kondisi tempat sampah.
- Melakukan pembaruan (*update*) dan penghapusan logis (*soft delete* dengan penanda `deleted_at`).

---

## 2. Arsitektur & Tech Stack

Aplikasi ini dibangun menggunakan arsitektur *clean separation of concerns* antara frontend, layer serverless API, dan data source:

```text
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Browser)                       │
│  - React 18 + TypeScript + Vite                             │
│  - React Leaflet + Leaflet (OSM Basemap & SVG Custom Pins)  │
│  - Responsive UI / Mobile-Friendly Bottom Sheet             │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS (Credentials: include)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Backend (Vercel Serverless Functions)           │
│  - /api/login, /api/logout, /api/session                    │
│  - /api/locations (GET, POST, PATCH, DELETE)                │
│  - Server-side UUID generation & ISO 8601 UTC timestamps    │
│  - Input validation (-90..90 lat, -180..180 lng, Enums)     │
│  - Session token verification (HMAC-SHA256, HttpOnly Cookie)│
│  - CSRF & Origin verification                               │
└──────────────────────────────┬──────────────────────────────┘
                               │ Google Sheets API v4 (JWT)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Database (Google Sheets)                    │
│  Worksheet: "trash_locations"                               │
│  Columns: A (id) s/d J (deleted_at)                         │
└─────────────────────────────────────────────────────────────┘
```

- **Frontend**: React 18, TypeScript, Vite, React-Leaflet, Leaflet, Plain CSS Modular.
- **Backend**: Node.js Serverless runtime (Vercel Functions), Google APIs client (`googleapis`), Crypto (HMAC SHA-256).
- **Database**: Google Sheets API v4.
- **Testing**: Vitest (Unit tests untuk validasi koordinat, token HMAC auth, data mapper, serta mock Google Sheets API).

---

## 3. Prasyarat Instalasi

Sebelum memulai pengembangan lokal, pastikan perangkat Anda telah terpasang:
- **Node.js**: Versi `18.x` atau lebih baru (direkomendasikan Node.js LTS `v20.x` atau `v22.x`).
- **npm**: Versi `9.x` atau lebih baru.
- Akun Google aktif (untuk akses Google Cloud Console dan Google Drive/Sheets).
- Akun Vercel (opsional, untuk proses deployment ke internet).

---

## 4. Panduan Konfigurasi Google Cloud & Google Sheets

### A. Membuat Proyek di Google Cloud Console
1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Masuk menggunakan akun Google Anda.
3. Klik dropdown proyek di bagian atas, lalu klik **New Project** (Proyek Baru).
4. Beri nama proyek, misalnya: `trashmap-webgis`.
5. Klik **Create** dan tunggu hingga proyek selesai dibuat, lalu pilih proyek tersebut.

### B. Mengaktifkan Google Sheets API
1. Pada menu navigasi sisi kiri (garis tiga), buka **APIs & Services** > **Library**.
2. Di kolom pencarian, ketik `Google Sheets API`.
3. Klik hasil **Google Sheets API** dan tekan tombol **Enable** (Aktifkan).

### C. Membuat Google Service Account & Mengunduh Kunci Privat
1. Buka menu **APIs & Services** > **Credentials**.
2. Klik **+ Create Credentials** di bagian atas, lalu pilih **Service account**.
3. Masukkan rincian akun:
   - **Service account name**: `trashmap-sheets-writer`
   - **Service account ID**: biarkan terisi otomatis (misal: `trashmap-sheets-writer@trashmap-webgis.iam.gserviceaccount.com`).
4. Klik **Create and Continue**, lalu klik **Done** (tidak perlu menambahkan peran khusus di level project karena izin akan diberikan langsung per spreadsheet).
5. Pada daftar Service Accounts, klik email service account yang baru dibuat.
6. Buka tab **Keys** (Kunci).
7. Klik **Add Key** > **Create new key**.
8. Pilih tipe kunci **JSON**, lalu klik **Create**.
9. File JSON kunci privat akan terunduh ke komputer Anda. Buka file tersebut dengan text editor. Anda akan membutuhkan:
   - `client_email`: Alamat email service account.
   - `private_key`: Kunci privat RSA (dimulai dengan `-----BEGIN PRIVATE KEY-----`).

> [!CAUTION]
> Simpan file JSON ini dengan aman dan **JANGAN PERNAH** menyertakan atau melakukan commit file kunci ini ke repositori publik Git!

### D. Membuat Google Spreadsheet & Lembar Kerja
1. Buka [Google Sheets](https://sheets.new) di browser Anda.
2. Beri nama Spreadsheet di bagian kiri atas, misalnya `TrashMap Data Lapangan`.
3. Salin **Spreadsheet ID** dari URL browser:
   `https://docs.google.com/spreadsheets/d/`**`<SPREADSHEET_ID_ANDA>`**`/edit`
4. Pastikan nama tab lembar kerja di bagian bawah adalah `trash_locations`. Jika tab masih bernama `Sheet1` atau `Lembar1`, klik kanan dan ubah namanya (*Rename*) menjadi `trash_locations`.
5. Buat baris header pada baris pertama (Row 1) dari kolom A sampai J sesuai urutan baku berikut:

| Kolom | Nama Header | Tipe Data | Keterangan |
| :---: | :--- | :--- | :--- |
| **A** | `id` | String (UUIDv4) | ID unik rekaman yang dihasilkan server |
| **B** | `latitude` | Number (String) | Koordinat lintang (-90 s/d 90) |
| **C** | `longitude` | Number (String) | Koordinat bujur (-180 s/d 180) |
| **D** | `waste_type` | String | `Organik`, `Anorganik`, atau `Campuran` |
| **E** | `condition` | String | `Baik`, `Penuh`, atau `Rusak` |
| **F** | `label` | String | Nama/penanda tempat sampah (opsional) |
| **G** | `description` | String | Catatan tambahan kondisi lapangan (opsional) |
| **H** | `created_at` | String (ISO 8601 UTC) | Waktu pembuatan data pertama kali |
| **I** | `updated_at` | String (ISO 8601 UTC) | Waktu terakhir kali data diperbarui |
| **J** | `deleted_at` | String (ISO 8601 UTC) | Waktu penghapusan logis (kosong jika aktif) |

### E. Membagikan Hak Akses Spreadsheet ke Service Account
1. Pada Google Spreadsheet yang telah dibuat, klik tombol **Share** (Bagikan) di pojok kanan atas.
2. Masukkan alamat `client_email` Service Account Anda (misal: `trashmap-sheets-writer@trashmap-webgis.iam.gserviceaccount.com`).
3. Tetapkan peran sebagai **Editor**.
4. Hapus centang pada *Notify people* (karena service account adalah sistem otomatis), lalu klik **Share**.

---

## 5. Konfigurasi Environment Variables

Salin file `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Isi nilai variabel pada file `.env`:

```env
# 1. Konfigurasi Database Google Sheets (Server-side)
GOOGLE_SHEET_ID=1a2b3c4d5e6f7g8h9i0j-spreadsheet-id-anda
GOOGLE_SHEET_NAME=trash_locations
GOOGLE_SERVICE_ACCOUNT_EMAIL=trashmap-sheets-writer@trashmap-webgis.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC6...\n-----END PRIVATE KEY-----\n"

# 2. Proteksi Akses Petugas & Kunci Enkripsi Sesi (Server-side)
APP_PASSWORD=petugaslapangan2026
SESSION_SECRET=kunci_rahasia_hmac_acak_dan_panjang_minimal_32_karakter_bebas

# 3. Pengaturan Tampilan Awal Peta (Client-side, opsional)
VITE_DEFAULT_MAP_LAT=-6.2088
VITE_DEFAULT_MAP_LNG=106.8456
VITE_DEFAULT_MAP_ZOOM=13
```

> [!TIP]
> **Catatan Kunci Privat**: Kunci privat yang disalin dari file JSON Google Service Account mengandung karakter newline `\n`. Sertakan tanda kutip ganda `"` di sekeliling `GOOGLE_PRIVATE_KEY` agar pemformatan baris baru terbaca dengan benar.

---

## 6. Menjalankan Aplikasi Secara Lokal

1. **Pasang Dependensi**:
   ```bash
   npm install
   ```

2. **Jalankan Automated Test Suite**:
   Untuk memverifikasi semua fungsi validasi, auth token HMAC, mapper baris spreadsheet, dan endpoint API (menggunakan mock Google Sheets):
   ```bash
   npm test
   ```

3. **Jalankan Server Pengembangan (Dev Server)**:
   Aplikasi telah dilengkapi dev server terpadu yang mengeksekusi frontend React dan serverless API (`/api/*`) secara simultan:
   ```bash
   npm run dev
   ```
   Buka peramban pada tautan yang ditampilkan (biasanya `http://localhost:5173`).

4. **Uji Coba Build Produksi**:
   ```bash
   npm run build
   ```

---

## 7. Panduan Deployment ke Vercel

Aplikasi ini dikonfigurasi khusus agar siap dideploy langsung ke **Vercel** sebagai aplikasi Jamstack modern dengan serverless API functions.

### Langkah-langkah:

1. **Push Proyek ke Git**:
   Unggah repositori ke GitHub, GitLab, atau Bitbucket Anda. Pastikan file `.env` tidak ikut terunggah (`.gitignore` sudah mengabaikannya).

2. **Impor Proyek di Vercel**:
   - Masuk ke dasbor [Vercel](https://vercel.com).
   - Klik **Add New...** > **Project**.
   - Pilih repositori Git proyek PTPS Anda.
   - Vercel akan otomatis mendeteksi Framework Preset sebagai **Vite**.

3. **Atur Environment Variables di Vercel**:
   Sebelum menekan tombol Deploy, buka bagian **Environment Variables** di Vercel dan tambahkan variabel berikut:

   | Variable Key | Nilai | Penjelasan |
   | :--- | :--- | :--- |
   | `GOOGLE_SHEET_ID` | `ID_SPREADSHEET_ANDA` | ID dari Google Spreadsheet |
   | `GOOGLE_SHEET_NAME` | `trash_locations` | Nama lembar kerja tab |
   | `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `email-service-account@...` | Email Service Account |
   | `GOOGLE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\n...` | String private key lengkap |
   | `APP_PASSWORD` | `password_rahasia_petugas` | Kata sandi login petugas |
   | `SESSION_SECRET` | `string_acak_panjang_unik` | Secret untuk penandatanganan HMAC |
   | `VITE_DEFAULT_MAP_LAT` | `-6.2088` | Default latitude pusat peta |
   | `VITE_DEFAULT_MAP_LNG` | `106.8456` | Default longitude pusat peta |
   | `VITE_DEFAULT_MAP_ZOOM` | `13` | Default zoom level |

4. **Deploy**:
   - Klik **Deploy**.
   - Vercel akan mengompilasi frontend Vite dan memetakan fungsi-fungsi di folder `/api` menjadi Serverless Functions.
   - Setelah selesai, Anda akan menerima domain publik dengan sertifikat SSL/HTTPS otomatis (misal: `https://trashmap.vercel.app`).

---

## 8. Uji Coba Alur CRUD Lapangan

Setelah aplikasi dibuka di browser:

### 1. Login Sesi Petugas
- Pada halaman awal, masukkan password akses petugas yang telah Anda konfigurasi pada `APP_PASSWORD`.
- Sistem memverifikasi password di server dan menyematkan session cookie `HttpOnly` bertanda tangan HMAC-SHA256.

### 2. Tambah Lokasi Tempat Sampah Baru (Create)
- Klik tombol **"Tambah Lokasi"** di header navigasi.
- Peta masuk ke dalam *Mode Penentuan Titik* (kursor berubah menjadi *crosshair* dan banner informasi muncul di atas peta).
- Klik sembarang titik pada peta tempat fasilitas tempat sampah berada, atau klik ikon GPS **"Gunakan Lokasi Saya"** untuk mengambil koordinat riil GPS perangkat lapangan.
- Penanda sementara biru berbentuk pin dengan lingkaran radar akan muncul pada titik koordinat tersebut.
- Penanda sementara ini dapat diseret (*draggable*) untuk menyempurnakan presisi titik koordinat secara langsung.
- Form data akan terbuka di panel samping (desktop) atau bottom sheet (mobile):
  - Pilih **Jenis Sampah**: Organik, Anorganik, atau Campuran.
  - Pilih **Kondisi Tempat Sampah**: Baik, Penuh, atau Rusak.
  - Masukkan nama/label lokasi (contoh: *Pintu Gerbang Utara Pos RW 02*).
  - Masukkan keterangan tambahan jika ada (contoh: *Kapasitas 100 Liter, penutup sedikit retak*).
- Klik **"Simpan Lokasi"**.
- Data disimpan langsung ke baris baru Google Sheets dengan UUID server-side dan timestamp UTC. Penanda permanen langsung muncul di peta sesuai warna kondisi.

### 3. Membaca & Memfilter Data (Read & Filter)
- Klik penanda tempat sampah di peta untuk membuka jendela informasi (*popup*):
  - Menampilkan nama, badge kondisi, jenis sampah, koordinat presisi 6 digit desimal, keterangan, dan tanggal pembaruan terakhir.
- Gunakan barisan tombol filter di bawah header:
  - Filter kondisi: Semua, Baik (🟢), Penuh (🟠), Rusak (🔴) beserta penghitung jumlah titik aktif.
  - Filter jenis sampah: Semua, Organik, Anorganik, Campuran.
  - Kotak pencarian: menyaring lokasi secara instan berdasarkan nama atau keterangan.

### 4. Mengubah Data & Menggeser Titik (Update)
- Pada popup lokasi tempat sampah yang ingin diedit, klik tombol **"Edit"**.
- Form akan terbuka dengan nilai data eksisting yang telah terisi.
- Anda dapat mengubah atribut data (misal: kondisi dari *Baik* menjadi *Penuh*), atau menggeser penanda titik di peta jika letak fisiknya dipindahkan.
- Klik **"Simpan Pembaruan"**.
- Server memperbarui baris data terkait di Google Sheets berdasarkan UUID unik rekaman tanpa merusak baris lainnya.

### 5. Menghapus Lokasi (Soft Delete)
- Pada popup lokasi, klik tombol **"Hapus"**.
- Dialog konfirmasi dalam Bahasa Indonesia akan muncul: *"Apakah Anda yakin ingin menghapus data tempat sampah ini? Data akan diarsipkan secara logis di Google Sheets."*
- Jika pengguna menekan "OK", server akan mencatat timestamp penghapusan pada kolom `deleted_at` di Google Sheets.
- Titik lokasi langsung dihapus dari tampilan peta aktif, namun riwayat fisiknya tetap tersimpan di spreadsheet untuk keperluan audit dan pemulihan data.

---

## 9. Proteksi Akses & Keamanan Sesi

Sistem ini didesain khusus untuk penggunaan internal tim lapangan terpercaya (*trusted field pilot*):
1. **Shared Access Password**: Menghindari beban pendaftaran akun rumit untuk petugas lapangan sementara, namun tetap mencegah akses tulis tak dikenal dari publik.
2. **HttpOnly & Secure Cookies**: Token sesi disimpan dalam cookie bertanda tangan kriptografi (HMAC-SHA256) dengan flag `HttpOnly; SameSite=Lax; Path=/` (serta flag `Secure` otomatis pada produksi HTTPS). Cookie ini kebal terhadap pencurian skrip sisi klien (XSS) dan tidak disimpan di `localStorage`.
3. **Validasi Origin / CSRF**: Setiap permintaan HTTP yang mengubah data (`POST`, `PATCH`, `DELETE`) divalidasi header `Origin` dan `Referer`-nya di server.
4. **Isolasi Kredensial**: File kunci Google Service Account dan password sesi sepenuhnya berada di lingkungan serverless; tidak ada satupun kredensial sensitif yang dibocorkan ke browser.

> [!NOTE]
> Proteksi kata sandi bersama (*shared password*) ditujukan untuk implementasi percontohan (*pilot phase*) skala terbatas. Apabila aplikasi hendak diperluas ke berbagai instansi atau tim berbeda dengan pembagian hak akses (*Role-Based Access Control*), disarankan untuk menambahkan sistem identitas individual (misal: Google Workspace OAuth 2.0).

---

## 10. Batasan Google Sheets sebagai Database

Menggunakan Google Sheets sebagai basis data backend sangat praktis dan mudah diaudit, namun terdapat batasan teknis yang perlu dipahami:

1. **Batas Kuota Permintaan (API Rate Limits)**:
   - Google Sheets API v4 menetapkan kuota bawaan sekitar **300 requests per menit per project** dan **60 requests per menit per user**.
   - Untuk penggunaan tim lapangan 5–20 petugas secara bersamaan, kuota ini sangat mencukupi. Namun tidak disarankan untuk aplikasi publik dengan ribuan pengguna konkuren.
2. **Latensi Tulis (Write Latency)**:
   - Menulis ke Google Sheets memerlukan waktu sekitar 300ms–800ms per panggilan API, relatif lebih lambat dibandingkan database transaksional (seperti PostgreSQL/Redis). Antarmuka PTPS mengatasinya dengan status loading/indikator simpan yang jelas.
3. **Ketahanan Konkurensi (Concurrency & Race Conditions)**:
   - Google Sheets tidak memiliki fitur *row locking* transaksional native. PTPS meminimalkan risiko ini dengan mencari baris berdasarkan UUID sebelum pembaruan serta memperbarui rentang sel spesifik (`B{row}:I{row}`).
4. **Batas Kapasitas Sel**:
   - Google Spreadsheet memiliki batas maksimal 10 juta sel per berkas. Dengan 10 kolom per baris, lembar kerja ini mampu menampung hingga 1 juta titik lokasi tempat sampah.

---

## 11. Troubleshooting & Solusi Masalah Umum

### 1. `GOOGLE_PRIVATE_KEY` Error / Pemformatan Baris Baru
- **Gejala**: Error `error:0909006C:PEM routines:get_name:no start line` atau `PEM_read_bio_PrivateKey failed`.
- **Penyebab**: Karakter newline `\n` pada kunci privat ter-escape atau terpotong saat disalin ke environment variable Vercel atau file `.env`.
- **Solusi**: Di kode PTPS (`lib/googleSheets.ts`), aplikasi secara otomatis menjalankan `privateKey.replace(/\\n/g, '\n')`. Pastikan saat mengisi di Vercel, salin seluruh string dari `-----BEGIN PRIVATE KEY-----` hingga `-----END PRIVATE KEY-----\n` termasuk tanda kutip ganda jika di file `.env`.

### 2. Error `The caller does not have permission` (403 Forbidden)
- **Penyebab**: Service account belum diberi izin edit ke file spreadsheet.
- **Solusi**: Buka Google Spreadsheet di browser > Klik tombol **Share** > Masukkan email Service Account (berakhiran `@...iam.gserviceaccount.com`) > Pilih izin **Editor** > Klik Save.

### 3. Peta Tidak Memuat Marker Setelah Ditambahkan
- **Penyebab**: Header spreadsheet pada baris 1 tidak sesuai urutan atau format baris belum dibuat.
- **Solusi**: Periksa tab `trash_locations`. Pastikan baris 1 memiliki 10 kolom: `id`, `latitude`, `longitude`, `waste_type`, `condition`, `label`, `description`, `created_at`, `updated_at`, `deleted_at`.

### 4. Permintaan GPS Ditolak di Perangkat HP
- **Penyebab**: Browser memblokir akses lokasi karena halaman tidak diakses melalui protokol aman (HTTPS) atau izin lokasi ditolak oleh pengguna.
- **Solusi**: Pastikan aplikasi diakses via HTTPS (pada Vercel otomatis HTTPS). Pada peramban ponsel, periksa setelan izin situs (*Site Settings*) dan izinkan akses lokasi (*Location: Allow*). Petugas tetap dapat memilih titik secara manual dengan mengetuk langsung pada peta.

---

**PTPS** — Dikembangkan dengan standar rekayasa perangkat lunak modern untuk mendukung kebersihan lingkungan dan efisiensi pengelolaan sampah wilayah.
