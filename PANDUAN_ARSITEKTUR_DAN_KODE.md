ra# PANDUAN LENGKAP ARSITEKTUR & PEMAHAMAN KODEBASE
## Proyek: Pemetaan Inisiatif Pengelolaan Sampah (TrashMap WebGIS)
### Lingkup Wilayah: Kelurahan Tamansari, Kec. Bandung Wetan, Kota Bandung

> **Tujuan Dokumen Ini**: Memberikan pemahaman mendalam 360° mengenai seluruh struktur kode, arsitektur sistem, aliran data, korelasi antar-fitur, dan keputusan teknis di balik proyek ini. Setelah membaca dokumen ini, Anda akan memahami setiap baris kode layaknya Anda sendiri yang merancangnya dari nol.

---

## DAFTAR ISI

1. [Peta Mental & Filosofi Arsitektur (Mental Model)](#1-peta-mental--filosofi-arsitektur-mental-model)
2. [Peta Struktur Berkas & Direktori (Directory Map)](#2-peta-struktur-berkas--direktori-directory-map)
3. [Bedah Komponen Frontend (Lapisan Antarmuka)](#3-bedah-komponen-frontend-lapisan-antarmuka)
4. [Bedah Backend Serverless (Lapisan Logika & Keamanan)](#4-bedah-backend-serverless-lapisan-logika--keamanan)
5. [Bedah Basis Data Google Sheets (Lapisan Penyimpanan)](#5-bedah-basis-data-google-sheets-lapisan-penyimpanan)
6. [Korelasi Arsitektur vs Fitur (Alur Eksekusi Nyata)](#6-korelasi-arsitektur-vs-fitur-alur-eksekusi-nyata)
   - [A. Alur Autentikasi & Login Sesi](#a-alur-autentikasi--login-sesi)
   - [B. Alur Tambah Lokasi (Create Workflow)](#b-alur-tambah-lokasi-create-workflow)
   - [C. Alur Opsi "Lainnya (Isi Sendiri...)"](#c-alur-opsi-lainnya-isi-sendiri)
   - [D. Alur Pelacakan GPS Akurat](#d-alur-pelacakan-gps-akurat)
   - [E. Alur Filter & Pencarian Reaktif](#e-alur-filter--pencarian-reaktif)
   - [F. Alur Perbarui Lokasi (Update Workflow)](#f-alur-perbarui-lokasi-update-workflow)
   - [G. Alur Penghapusan Logis (Soft-Delete Workflow)](#g-alur-penghapusan-logis-soft-delete-workflow)
7. [Trik Khusus: Serverless Lokal vs Produksi Vercel](#7-trik-khusus-serverless-lokal-vs-produksi-vercel)
8. [Panduan Pengembangan Lanjutan (Maintenance Cheatsheet)](#8-panduan-pengembangan-lanjutan-maintenance-cheatsheet)

---

## 1. PETA MENTAL & FILOSOFI ARSITEKTUR (MENTAL MODEL)

Aplikasi ini dirancang menggunakan konsep **Jamstack Modern (JavaScript, API, Markup)** dengan 3 lapisan utama:

```
[ PENGGUNA LAPANGAN ]
        │  (Buka via Ponsel / Laptop)
        ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 1. FRONTEND: Single Page Application (SPA)                             │
│    - Framework : React 18 + TypeScript + Vite                          │
│    - GIS Engine: Leaflet + React-Leaflet + OpenStreetMap Basemap       │
│    - Desain    : Mobile-First, Touch-Friendly, Pure CSS Variable       │
│    - Peran     : Merender peta, menangani klik, drag marker, filter,   │
│                  form bottom-sheet, dan menampilkan notifikasi toast. │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP Fetch (credentials: include)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. BACKEND: Vercel Serverless Functions (/api)                         │
│    - Runtime   : Node.js 20+ (ES Modules)                              │
│    - Handler   : /api/login, /api/session, /api/logout, /api/locations │
│    - Keamanan  : Cookie HttpOnly HMAC-SHA256, Anti-CSRF Origin Check   │
│    - Validasi  : Koordinat dunia (-90..90, -180..180), Sanitasi teks   │
│    - Peran     : Pintu gerbang keamanan yang menyembunyikan kredensial  │
│                  Google Cloud dari browser publik.                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Google Sheets API v4 (JWT Service Account)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. DATABASE: Google Sheets API v4                                      │
│    - Dokumen   : Spreadsheet ID yang dikonfigurasi via .env            │
│    - Lembar    : Tab "trash_locations"                                 │
│    - Skema     : 10 Kolom baku (A: id s/d J: deleted_at)               │
│    - Peran     : Basis data tabel persisten, real-time, zero-cost, dan │
│                  dapat diaudit langsung via antarmuka Google Sheets.   │
└────────────────────────────────────────────────────────────────────────┘
```

### Mengapa Arsitektur Ini Dipilih?
1. **Zero Database Maintenance**: Tidak butuh sewa server VPS, instal PostgreSQL, atau bayar langganan database cloud.
2. **Kerahasiaan Kunci Terjaga**: Google Private Key dan Service Account berada 100% di serverless Vercel. Pengguna yang melihat *Inspect Element / Network Tab* di browser **tidak akan pernah bisa melihat** kunci akun Google Anda.
3. **Audit Mudah**: Klien atau non-developer dapat membuka Google Spreadsheet langsung untuk mengekspor data ke Excel, membuat grafik, atau memverifikasi laporan tim lapangan.

---

## 2. PETA STRUKTUR BERKAS & DIREKTORI (DIRECTORY MAP)

Berikut adalah peran dari masing-masing berkas di dalam proyek:

```text
pemetaan/
├── api/                             # FUNGSI SERVERLESS (Backend Vercel)
│   ├── _lib/                        # Modul privat bersama (tidak jadi URL publik)
│   │   ├── auth.ts                  # Logika HMAC-SHA256, cookie sesi, anti-CSRF
│   │   ├── googleSheets.ts          # Driver Google Sheets API v4 (CRUD, Soft Delete)
│   │   ├── types.ts                 # Definisi tipe data backend TypeScript
│   │   └── validation.ts            # Validator input (koordinat, teks, enum)
│   ├── locations.ts                 # Endpoint: GET, POST, PATCH, DELETE /api/locations
│   ├── login.ts                     # Endpoint: POST /api/login
│   ├── logout.ts                    # Endpoint: POST /api/logout
│   └── session.ts                   # Endpoint: GET /api/session
│
├── src/                             # FRONTEND APLIKASI (React + TypeScript)
│   ├── components/                  # Komponen Visual Antarmuka
│   │   ├── FilterControls.tsx       # Dropdown filter status & jenis inisiatif
│   │   ├── Header.tsx               # Bar navigasi atas, badge total, tombol aksi
│   │   ├── LocationForm.tsx         # Formulir tambah/edit (modal/bottom-sheet)
│   │   ├── LocationMarker.tsx       # Penanda peta SVG dinamis (Hijau, Oranye, Merah, Biru)
│   │   ├── LocationPopup.tsx        # Popup detail marker saat diklik di peta
│   │   ├── LoginModal.tsx           # Layar login petugas
│   │   ├── MapLegend.tsx            # Kotak legenda status warna di pojok peta
│   │   ├── MapView.tsx              # Wadah Peta Leaflet & pengendali klik/drag/GPS
│   │   └── Toast.tsx                # Notifikasi popup (sukses/gagal)
│   ├── hooks/                       # Custom React Hooks (State Controller)
│   │   ├── useAuth.ts               # Mengelola state status login, login(), logout()
│   │   └── useLocations.ts          # Mengelola data titik, filter, dan sinkronisasi API
│   ├── services/
│   │   └── api.ts                   # Penghubung HTTP (fetch) dari browser ke /api
│   ├── styles/                      # Lembar Gaya CSS Murni (No Tailwind, Zero Bloat)
│   │   ├── components.css           # Gaya header, tombol, filter dropdown, toast, modal
│   │   ├── index.css                # Variabel warna CSS (--primary, dll.), reset, font
│   │   ├── LocationForm.css         # Gaya bottom-sheet mobile & kartu radio pilihan
│   │   └── MapView.css              # Gaya penanda pin SVG, efek radar, ukuran peta
│   ├── types/
│   │   └── location.ts              # Definisi interface TypeScript frontend
│   ├── App.tsx                      # Orkestrator utama aplikasi (komposer komponen)
│   ├── main.tsx                     # Entry point React (ReactDOM.createRoot)
│   └── vite-env.d.ts                # Deklarasi tipe lingkungan client Vite
│
├── lib/                             # RE-EXPORT FACADE
│   ├── auth.ts                      # Me-reexport dari api/_lib/auth.js (kompatibilitas tes)
│   ├── googleSheets.ts              # Me-reexport dari api/_lib/googleSheets.js
│   ├── types.ts                     # Me-reexport dari api/_lib/types.js
│   └── validation.ts                # Me-reexport dari api/_lib/validation.js
│
├── test/                            # AUTOMATED UNIT TEST SUITE (Vitest)
│   ├── auth.test.ts                 # Tes tanda tangan token, tamper rejection, CSRF check
│   ├── googleSheets.test.ts         # Tes parser baris, mock append/update, filter terhapus
│   ├── locationsApi.test.ts         # Tes guard sesi, validasi input, status 200/201/400/401/403
│   └── validation.test.ts           # Tes batas lintang/bujur, panjang karakter teks
│
├── .env.example                     # Panduan nama variabel environment
├── .gitignore                       # Berkas yang dilarang di-push (termasuk .env)
├── index.html                       # HTML template utama
├── package.json                     # Daftar paket dependensi dan scripts npm
├── tsconfig.json                    # Konfigurasi kompilasi TypeScript
├── vercel.json                      # Konfigurasi routing serverless Vercel
└── vite.config.ts                   # Konfigurasi Vite + Simulator Serverless Dev Lokal
```

---

## 3. BEDAH KOMPONEN FRONTEND (LAPISAN ANTARMUKA)

Frontend dibangun tanpa framework CSS eksternal raksasa untuk menjaga kecepatan muat (*instant load*) pada jaringan internet seluler lapangan:

### 1. `MapView.tsx` (Pusat Peta Leaflet)
- Menggunakan `MapContainer` dari `react-leaflet`.
- **Default Koordinat**: Mengarah ke Kelurahan Tamansari, Bandung Wetan (`lat: -6.8998, lng: 107.6086, zoom: 15`).
- **Komponen Anak Internal**:
  - `MapEventsHandler`: Memasang listener klik ke peta Leaflet (`useMapEvents`). Ketika `isAddingMode` aktif, klik peta memanggil `onMapClick(lat, lng)`.
  - `FlyToLocation`: Animasi kamera meluncur halus (*pan & zoom*) ke titik koordinat saat pengguna menggunakan tombol GPS atau memilih titik baru.
- **Dua Jenis Marker**:
  1. *Marker Permanen*: Mengiterasi array `locations` yang ditarik dari Google Sheets dan merender komponen `LocationMarker`.
  2. *Marker Sementara (`tempPosition`)*: Marker biru cerah dengan lingkaran radar beranimasi (`draggable={true}`). Saat pengguna menggeser marker ini, event `dragend` langsung mengupdate koordinat formulir secara real-time.
- **Kapsul Panduan Atas**: Kapsul melayang tipis di atas peta saat mode tambah aktif: `📍 Ketuk peta atau GPS untuk tandai titik`.

### 2. `LocationMarker.tsx` & Pembuatan Pin Kustom SVG
- Tidak memakai gambar `.png` bawaan Leaflet (yang sering rusak path-nya saat di-bundle Vite).
- Dibuat secara murni menggunakan `L.divIcon` yang menyuntikkan template SVG tajam dengan drop-shadow:
  - 🟢 **Hijau (`#10B981`)**: Kondisi Baik (Aktif beroperasi).
  - 🟠 **Oranye (`#F59E0B`)**: Kondisi Penuh (Kapasitas maksimal / perlu diangkut).
  - 🔴 **Merah (`#EF4444`)**: Kondisi Rusak (Perlu perbaikan / pembinaan).
  - 🔵 **Biru (`#2563EB`)**: Penanda sementara dengan CSS `@keyframes radar-pulse`.

### 3. `LocationForm.tsx` (Formulir Responsif & Fitur Input Sendiri)
- Tampil sebagai modal di layar desktop dan bertransformasi menjadi **Bottom Sheet** di layar ponsel (HP).
- **Logika Opsi "Lainnya (Isi Sendiri...)"**:
  - Memiliki daftar preset: `Budidaya Maggot`, `Pengomposan`, `Bank Sampah`, `TPS3R`, `Tempat Sampah Terpilah`, `Lainnya`.
  - Jika pengguna memilih "Lainnya", state `selectedOption` berubah ke `'Lainnya'` dan memunculkan input teks tambahan (`customValue`).
  - Saat form dikirim (*submit*), nilai teks kustom itulah yang dikirimkan ke backend.
  - Saat mengedit data yang bukan merupakan opsi preset, sistem secara cerdas langsung mengaktifkan opsi "Lainnya" dan mengisi teks tersebut ke dalam kolom.
- **Proteksi Pengiriman Ganda**: Tombol "Simpan" otomatis dinonaktifkan (`disabled={saving}`) dan memunculkan animasi pemuatan (*spinner*) saat proses HTTP berlangsung.

### 4. `FilterControls.tsx` (Penyaring Dropdown)
- Menggantikan barisan tombol pill yang lebar menjadi **2 dropdown kompak**:
  1. Dropdown Status Operasional (lengkap dengan jumlah penghitung titik).
  2. Dropdown Tempat Pengelolaan Sampah.
  3. Kolom teks pencarian instan (mencari kesesuaian pada nama label dan keterangan).
  4. Tombol reset cepat yang hanya muncul jika filter aktif.

### 5. `useLocations.ts` & `useAuth.ts` (State Management)
- Menggunakan state lokal React murni (tanpa Redux/Zustand yang memperbesar ukuran bundle).
- `useLocations` mengurus pengambilan data (`fetchLocations`), penambahan optimistik (`addLocation`), pembaruan array lokal (`editLocation`), dan penyaringan reaktif via `useMemo`.

---

## 4. BEDAH BACKEND SERVERLESS (LAPISAN LOGIKA & KEAMANAN)

Folder `api/` dieksekusi sebagai Vercel Serverless Functions berbasis Node.js runtime.

### 1. Keamanan Sesi (`api/_lib/auth.ts`)
- **Penolakan Serangan Waktu (Timing Attack Mitigation)**:
  Fungsi `verifyPassword(password)` menggunakan `crypto.timingSafeEqual` untuk membandingkan password masukan pengguna dengan `APP_PASSWORD`. Ini mencegah peretas menebak password berdasarkan selisih milidetik waktu respons server.
- **Token HMAC-SHA256**:
  Saat login berhasil, server membuat payload `{ authenticated: true, exp: Date.now() + 24jam }`. Payload ini diubah ke Base64URL dan ditandatangani dengan kunci rahasia `SESSION_SECRET` menggunakan algoritma SHA-256:
  `Token = <PayloadBase64>.<SignatureHMAC>`
- **Cookie `HttpOnly`**:
  Token dikirim ke browser melalui header `Set-Cookie`:
  `trashmap_session=...; HttpOnly; SameSite=Lax; Path=/; Secure (di produksi)`
  - `HttpOnly`: Skrip JavaScript di browser **tidak bisa membaca** cookie ini (kebal serangan XSS).
  - `SameSite=Lax`: Mencegah situs pihak ketiga mengirim permintaan liar.
- **Pemeriksaan Asal Permintaan (Anti-CSRF Origin Check)**:
  Fungsi `verifyOrigin(req)` memeriksa header `Origin` atau `Referer` pada setiap metode mutasi (`POST`, `PATCH`, `DELETE`). Permintaan dari domain luar yang mencurigakan otomatis ditolak dengan kode status **403 Forbidden**.

### 2. Validasi Server-Side (`api/_lib/validation.ts`)
Server tidak pernah mempercayai data dari browser secara mentah-mentah:
- `validateLatitude`: Memastikan angka valid dalam rentang `-90` hingga `90`.
- `validateLongitude`: Memastikan angka valid dalam rentang `-180` hingga `180`.
- `validateWasteType`: Memastikan string tidak kosong dan maksimal 100 karakter (mendukung teks bebas/kustom).
- `validateCondition`: Wajib berupa salah satu dari enum: `'Baik'`, `'Penuh'`, atau `'Rusak'`.
- `sanitizeText`: Memotong kelebihan karakter dan menghapus spasi liar (*trim*).

---

## 5. BEDAH BASIS DATA GOOGLE SHEETS (LAPISAN PENYIMPANAN)

Berkas `api/_lib/googleSheets.ts` bertindak sebagai *Object-Relational Mapping (ORM)* mini untuk Google Sheets API v4.

### Skema Kolom Baku Tab `trash_locations`:
| Kolom | Nama Header | Tipe Data | Peran & Logika |
| :---: | :--- | :--- | :--- |
| **A** | `id` | UUIDv4 | Identitas permanen rekaman yang digenerate server via `crypto.randomUUID()`. Tidak pernah berubah meskipun baris bergeser. |
| **B** | `latitude` | Number (String) | Koordinat Lintang presisi 6 desimal. |
| **C** | `longitude` | Number (String) | Koordinat Bujur presisi 6 desimal. |
| **D** | `waste_type` | String | Jenis Tempat Pengelolaan (Maggot, Kompos, Bank Sampah, atau teks kustom). |
| **E** | `condition` | String | Status operasional: `Baik`, `Penuh`, atau `Rusak`. |
| **F** | `label` | String | Nama penanda lokasi inisiatif. |
| **G** | `description` | String | Deskripsi tambahan lapangan. |
| **H** | `created_at` | String (ISO 8601 UTC) | Timestamp pembuatan awal data. |
| **I** | `updated_at` | String (ISO 8601 UTC) | Timestamp terakhir data diubah. |
| **J** | `deleted_at` | String (ISO 8601 UTC) | Timestamp penghapusan logis. Kosong jika data aktif. |

### Prinsip Eksekusi Data:
1. **Opsi `valueInputOption: 'RAW'`**:
   Data teks disimpan apa adanya tanpa parsing formula spreadsheet otomatis oleh Google (mencegah formula injection).
2. **Pencarian Berdasarkan UUID**:
   Saat operasi Edit (`PATCH`) atau Hapus (`DELETE`), server tidak menggunakan nomor baris array statis. Server membaca kolom A untuk mencari indeks baris di mana `row[0] === id`. Nomor baris dinamis dihitung sebagai `targetRowIndex = index + 2`.
3. **Pembaruan Rentang Sel Spesifik**:
   Saat mengedit data, server hanya memperbarui rentang `'trash_locations'!B{row}:I{row}`. Server **tidak pernah menimpa seluruh file sheet**, sehingga menghemat bandwidth kuota API.
4. **Soft Delete**:
   Saat data dihapus, server tidak memanggil API pemotong baris fisik (*delete row*). Server hanya menuliskan timestamp saat ini ke kolom J (`'trash_locations'!J{row}`). Data tetap tersimpan aman di Google Sheets untuk riwayat audit, namun pada pemanggilan `getAllLocations()`, baris yang memiliki nilai di kolom J otomatis dilewati.
5. **Mekanisme Auto-Recovery Lembar Kerja (`ensureSheetAndHeaders`)**:
   Jika pengguna menggunakan spreadsheet baru yang tab-nya masih bernama `Sheet1` atau `Lembar1`, kode otomatis mendeteksi dan mengganti namanya menjadi `trash_locations`, serta membuatkan 10 baris header pertama secara otomatis!

---

## 6. KORELASI ARSITEKTUR VS FITUR (ALUR EKSEKUSI NYATA)

Bagian ini memetakan hubungan antara interaksi pengguna di layar dan eksekusi kode di baliknya:

### A. Alur Autentikasi & Login Sesi
```text
[Pengguna Ketik Password] 
       │ 
       ▼
LoginModal.tsx (panggil onLogin)
       │ 
       ▼
useAuth.ts -> api.login(password)
       │ [POST /api/login]
       ▼
api/login.ts
       │
       ├── verifyPassword() membandingkan dengan APP_PASSWORD
       │
       ├── createSessionCookie() menandatangani token HMAC-SHA256
       │
       └── Mengembalikan Set-Cookie & { success: true }
       │
       ▼
Browser menyimpan cookie HttpOnly -> Layar login menutup -> Peta tampil
```

### B. Alur Tambah Lokasi (Create Workflow)
1. Pengguna klik **"Tambah"** di `Header.tsx` ➔ State `isAddingMode = true`.
2. Kursor peta berubah menjadi *crosshair* dan banner panduan muncul.
3. Pengguna klik peta di titik tertentu ➔ Event `click` ditangkap oleh `MapEventsHandler` di `MapView.tsx`.
4. `onMapClick(lat, lng)` dipanggil:
   - State `tempPosition` diset ke `[lat, lng]`.
   - Marker biru sementara muncul dengan radar animasi.
   - Panel `LocationForm.tsx` terbuka otomatis.
5. Pengguna mengetik nama label, memilih opsi inisiatif, dan klik **"Simpan Lokasi"**:
   - `LocationForm.tsx` memvalidasi koordinat lokal dan memanggil `onSave`.
   - `useLocations.ts` memanggil `api.createLocation(dto)`.
   - HTTP Request `POST /api/locations` terkirim dengan membawa cookie sesi.
   - `api/locations.ts` memverifikasi sesi login dan memvalidasi payload via `validateCreateLocation`.
   - `createLocation()` di `api/_lib/googleSheets.ts` membuatkan UUID baru, menyusun array 10 kolom, dan mengeksekusi `spreadsheets.values.append`.
   - Respons `201 Created` diterima browser.
   - `useLocations.ts` menyisipkan rekaman baru ke array `locations`.
   - Notifikasi Toast hijau muncul: *"Lokasi baru berhasil disimpan!"*.
   - Marker biru sementara hilang, digantikan marker permanen berwarna (hijau/oranye/merah).

### C. Alur Opsi "Lainnya (Isi Sendiri...)"
1. Di `LocationForm.tsx`, dropdown `wasteType` dipilih ke `"Lainnya"`.
2. Komponen mendeteksi `selectedOption === 'Lainnya'` dan merender elemen input teks tambahan dengan animasi mulus.
3. Pengguna mengetik misalnya *"Lubang Biopori RW 03"*.
4. Saat formulir disubmit, kode mengambil nilai `customValue.trim()`.
5. Nilai string tersebut dikirim ke server. Server menerimanya sebagai `waste_type` yang valid.
6. Saat titik tersebut diklik di peta pada kemudian hari:
   - `LocationPopup.tsx` menampilkan *"Tempat Pengelolaan: Lubang Biopori RW 03"*.
   - Jika tombol **"Edit"** ditekan, form otomatis mendeteksi bahwa nilai tersebut bukan opsi preset, sehingga otomatis memilih opsi "Lainnya" dan memasukkan teks *"Lubang Biopori RW 03"* kembali ke dalam kolom input.

### D. Alur Pelacakan GPS Akurat
1. Pengguna menekan tombol bulat GPS di kanan bawah peta (`MapView.tsx`) atau di dalam form.
2. `handleUseCurrentLocation` di `App.tsx` mengecek `navigator.geolocation`.
3. Memanggil `getCurrentPosition` dengan opsi `enableHighAccuracy: true` dan timeout 10 detik.
4. Begitu koordinat satelit HP diperoleh:
   - Komponen `FlyToLocation` memicu Leaflet untuk menggeser peta (*flyTo*) ke koordinat pengguna dengan animasi zoom level 16.
   - `tempPosition` diisi koordinat GPS.
   - Notifikasi Toast biru mengonfirmasi: *"Lokasi GPS terdeteksi: -6.899800, 107.608600"*.
   - Jika izin GPS ditolak pengguna di HP, sistem menangkap galat `PERMISSION_DENIED` dan memunculkan toast ramah: *"Izin akses lokasi ditolak oleh browser"*.

### E. Alur Filter & Pencarian Reaktif
1. Pengguna memilih dropdown Status: *🟢 Baik (Aktif)* di `FilterControls.tsx`.
2. State `filters.condition` di `useLocations.ts` terupdate.
3. Fungsi `useMemo(filteredLocations)` langsung menyaring array tanpa melakukan request ulang ke server (instan, 0 ms latency):
   ```ts
   return locations.filter((loc) => {
     if (filters.condition !== 'Semua' && loc.condition !== filters.condition) return false;
     if (filters.wasteType !== 'Semua' && loc.waste_type !== filters.wasteType) return false;
     // Cek kecocokan teks pencarian
     ...
   });
   ```
4. Peta Leaflet secara reaktif hanya merender penanda yang lolos seleksi filter.

### F. Alur Perbarui Lokasi (Update Workflow)
1. Pengguna klik salah satu marker permanen di peta ➔ `LocationPopup.tsx` terbuka.
2. Pengguna klik tombol **"Edit"**:
   - `handleStartEdit` di `App.tsx` mengisi `editingLocation` dengan objek data penanda tersebut.
   - `tempPosition` diset ke koordinat lama penanda.
   - Form terbuka dengan judul *"Perbarui Inisiatif Pengelolaan Sampah"*.
3. Pengguna dapat mengubah nama label/kondisi, atau **menggeser penanda biru di peta** jika posisi fisiknya bergeser.
4. Klik **"Simpan Pembaruan"**:
   - HTTP `PATCH /api/locations` dikirim dengan menyertakan `id`.
   - `api/locations.ts` memanggil `updateLocation()`.
   - Server membaca spreadsheet, menemukan baris dengan UUID terkait, dan memperbarui kolom B sampai I (`latitude` s/d `updated_at`).
   - Browser menerima data terbaru, memperbarui array lokal, dan marker di peta langsung tergeser ke posisi baru.

### G. Alur Penghapusan Logis (Soft-Delete Workflow)
1. Pada popup marker, pengguna klik tombol merah **"Hapus"**.
2. Muncul dialog konfirmasi: *"Apakah Anda yakin ingin menghapus data inisiatif ini? Data akan diarsipkan secara logis."*
3. Jika disetujui:
   - HTTP `DELETE /api/locations?id=...` dikirim ke server.
   - `api/locations.ts` memanggil `softDeleteLocation(id)`.
   - Server mengisi kolom J (`deleted_at`) pada baris spreadsheet tersebut dengan timestamp UTC saat ini.
   - Titik seketika menghilang dari peta. Data asli tidak pernah terhapus permanen dari spreadsheet, memungkinkan pemulihan jika terjadi kesalahan ketidaksengajaan.

---

## 7. TRIK KHUSUS: SERVERLESS LOKAL VS PRODUKSI VERCEL

Salah satu inovasi teknis terpenting dalam proyek ini adalah bagaimana backend serverless dapat berjalan di dua lingkungan yang berbeda tanpa duplikasi kode:

### 1. Di Lingkungan Lokal (`npm run dev`)
- Pada pengembangan standar, menjalankan Vercel Serverless Functions membutuhkan pemasangan Vercel CLI global dan login akun.
- Untuk menghemat waktu pengembang, dibuatlah plugin Vite kustom pada `vite.config.ts`:
  ```ts
  function vercelApiDevPlugin(): Plugin {
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();
        // Membaca modul TypeScript di folder /api/ secara dinamis
        // Mensimulasikan VercelRequest (query, body parsing) & VercelResponse (.status().json())
      });
    }
  }
  ```
- Hasilnya: Anda cukup mengetik `npm run dev`, dan baik frontend React maupun API serverless di `/api/*` langsung aktif berjalan bersamaan di port `5173`.

### 2. Di Lingkungan Produksi Vercel
- Vercel mendeteksi folder `api/` secara otomatis dan mengubah setiap berkas di dalamnya menjadi fungsi serverless berbasis AWS Lambda / Edge.
- **Trik Folder `api/_lib/`**:
  Node.js di Linux produksi memiliki aturan ketat mengenai ES Modules (wajib ekstensi `.js`). Dengan menempatkan seluruh berkas pembantu ke dalam `api/_lib/` dan mengimpornya dengan ekstensi eksplisit (`./_lib/auth.js`), Vercel berhasil mem-bundle semua fungsi ke dalam kontainer serverless tanpa galat `MODULE_NOT_FOUND`.

---

## 8. PANDUAN PENGEMBANGAN LANJUTAN (MAINTENANCE CHEATSHEET)

### A. Cara Menambahkan Opsi Baru pada Dropdown
Buka berkas `src/components/LocationForm.tsx`, cari array `PRESET_OPTIONS` dan tambahkan opsi baru:
```tsx
const PRESET_OPTIONS: WasteType[] = [
  'Budidaya Maggot',
  'Pengomposan',
  'Bank Sampah',
  'TPS3R',
  'Tempat Sampah Terpilah',
  'Inisiatif Baru Anda', // <-- Tambah di sini
  'Lainnya',
];
```

### B. Cara Mengubah Titik Fokus / Zoom Peta Awal
Jika ingin memindahkan pusat peta (misal ke kelurahan lain):
1. Buka file `.env` di komputer Anda.
2. Ubah baris koordinat:
   ```env
   VITE_DEFAULT_MAP_LAT=-6.8998
   VITE_DEFAULT_MAP_LNG=107.6086
   VITE_DEFAULT_MAP_ZOOM=15
   ```
3. Ubah juga fallback default pada `src/components/MapView.tsx` (baris 27-29).

### C. Cara Mengubah Warna Penanda (Marker Pin)
Buka berkas `src/components/LocationMarker.tsx`, cari fungsi `createTrashPinIcon`. Anda dapat mengubah kode warna hex di bagian `colors`:
```ts
const colors = {
  Baik: { bg: '#10B981', border: '#047857', ... },
  Penuh: { bg: '#F59E0B', border: '#B45309', ... },
  Rusak: { bg: '#EF4444', border: '#B91C1C', ... },
};
```

### D. Menjalankan Tes Otomatis Sebelum Rilis
Kapan pun Anda melakukan perubahan kode, selalu jalankan tes otomatis untuk memastikan tidak ada logika yang rusak:
```powershell
npm test
```
Dan pastikan proses kompilasi produksi sukses:
```powershell
npm run build
```

---

*Dokumen ini dirancang sebagai panduan definitif proyek TrashMap WebGIS Kelurahan Tamansari.*
