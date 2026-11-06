# Dashbox · Modern RouterOS Management Dashboard

Dashboard manajemen MikroTik RouterOS modern, responsif, dan ultra-ringan berbasis **Vanilla TypeScript + Vite + Tailwind CSS**.

Dashbox dirancang menyerupai fleksibilitas Winbox dipadukan dengan kemudahan web dashboard bergaya _Glacier Dark Theme_. Dibangun murni dengan TypeScript tanpa overhead framework (tanpa React/Vue/Angular), menghasilkan performa instan, konsumsi memori minim, dan type-safety yang ketat.

---

## ✨ Fitur Utama

### 1. Dasbor & Telemetri Real-Time

- **Router Telemetry**: Pantau beban CPU, RAM terpakai, ruang HDD, uptime, voltase, serta temperatur router secara langsung.
- **Visualisasi Throughput**: Grafik bar throughput bandwidth jaringan (Rx/Tx) responsif.
- **KPI Badges**: Ringkasan status koneksi WAN, total user PPP aktif, dan sesi Hotspot online.
- **Universal Quick Search**: Pencarian instan lintas domain (PPP Secret & Hotspot User) lengkap dengan filter kategori (_All, PPP, Hotspot, Online, Offline_).
- **Pintasan Cepat**: Akses satu ketuk ke modul utama router.

### 2. PPP Management Suite

- **Tab Lengkap**: Mendukung tab _Secrets_, _Active Connections_, _Profiles_, _PPPoE Servers_, dan _Interface_.
- **Winbox-Style Inspector**: Modal inspeksi dan pengeditan secret (Username, Password, Profile, Service, Local/Remote Address, Routes, Caller ID, dan Komentar).
- **Operasi Batch & Seleksi Multi-Baris**:
  - Enable / Disable secret terpilih secara instan.
  - Hapus (Remove) dengan konfirmasi dialog aman.
  - Tambah / ubah komentar secara massal.
  - Refresh data seketika.
- **Tampilan Adaptif**: Tabel tabular untuk layar desktop dan _interactive cards_ dengan gestur tap untuk perangkat mobile.
- **Paginasi & Filter**: Filter berdasarkan Profil, Service, serta pencarian instan nama user.

### 3. Hotspot & Voucher Engine

- **Manajemen Tab Hotspot**:
  - **Users**: Daftar user hotspot aktif maupun voucher.
  - **User Profiles**: Konfigurasi profile rate-limit (shared users, session timeout, keepalive timeout).
  - **Active Sessions**: Monitoring sesi pengguna yang sedang login secara real-time beserta konsumsi kuota (Bytes In/Out), IP, dan MAC address, lengkap dengan opsi _kick/disconnect_.
  - **Hosts**: Monitoring tabel IP/MAC binding dan status otorisasi perangkat yang terhubung ke jaringan hotspot.
- **Batch Voucher Generator (Mikhmon-Style)**:
  - Pembuatan voucher massal otomatis.
  - Opsi format kredensial: _Username & Password_ atau _Username = Password_.
  - Panjang karakter acak, prefix kustom, dan kombinasi karakter (angka, huruf kecil, huruf besar, campuran).
  - Batasan waktu (_Time Limit_), batasan kuota (_Data Limit_), profil kecepatan, harga modal, harga jual, dan komentar batch.
- **Operasi Hotspot**: Reset counter pemakaian (Bytes & Uptime), tambah user manual, dan hapus user massal.

### 4. System Monitor Terpadu

- **Live System Log**:
  - Streaming log aktivitas router secara real-time.
  - Pencarian cepat teks log dan filter berdasarkan topik (`system`, `ppp`, `hotspot`, `firewall`, `dhcp`).
  - Filter tingkat keparahan (_INFO, WARN, ERROR, DEBUG_) dengan badge warna kontras.
  - Jeda / lanjutkan (_Pause/Resume_) stream, salin log ke clipboard, serta bersihkan tampilan log.
  - Smart auto-scroll dengan deteksi posisi baca dan badge _unread count_.
- **Interfaces Traffic**:
  - Kartu ringkasan agregat WAN (Total Rx, Total Tx, Jumlah port link-up, Total volume).
  - Monitoring throughput real-time per interface (bps, Kbps, Mbps, Gbps) dan packet rate (pps).
  - Status koneksi adaptif (_Running, Link Down, Disabled_) dan tipe interface (_Ethernet, SFP 10G, Bridge, VLAN, Wireless_).
  - Tampilan tabel desktop yang padat dan kartu seluler interaktif.
- **IP Firewall**:
  - 4 sub-modul: _Filter Rules_, _NAT_, _Mangle_, dan _Active Connections_ (conntrack).
  - Filter berdasarkan Chain (_input, forward, output, srcnat, dstnat, prerouting_).
  - Action Badges berwarna khas (_accept, drop, reject, fasttrack, masquerade, dst-nat, mark-connection_).
  - Fitur toggle enable/disable rule secara langsung dan dialog konfirmasi penghapusan.
- **Bandwidth Queues (Simple Queues)**:
  - Antrean bandwidth per IP klien atau subnet target.
  - **Winbox Color-Coded Usage Meter**: Progress bar dwiarah (Upload & Download) dengan indikator warna berbasis persentase batas maksimum (_Hijau <50%, Kuning 50–85%, Merah >85% / Jenuh_).
  - Reset counter pemakaian data dan toggle status antrean.

### 5. Sales Report (Hotspot Voucher)

- **Referensi**: halaman `report.php` & `live_report.php` pada Mikhmon v4 — ditulis ulang dengan styling Glacier & arsitektur komponen Dashbox.
- **KPI Ringkasan**: Pendapatan hari ini & bulan ini (jumlah voucher + Rp, seperti `_live_report`), total difilter, rata-rata transaksi, profil terlaris.
- **Filter Rentang Tanggal + Date Picker**: Filter tanggal fleksibel berbasis date picker ganda (Dari Tanggal s/d Sampai Tanggal) yang mendukung filter 1 hari spesifik maupun rentang periode, dilengkapi preset cepat (_Semua Waktu, Hari Ini, Kemarin, 7 Hari Terakhir, Bulan Ini, Kustom_) serta pencarian cepat username/IP/profil. Tabel data menyajikan `Date · Time · Username · IP · MAC · Profile · Comment · Price` (desktop table & mobile cards) dengan proteksi sanitasi XSS penuh (`escapeHtml`).
- **Resume & Grafik**: tab kedua berisi ringkasan per profil (count + income + kontribusi %), dan bar chart pendapatan 7 hari terakhir (pola bar Dashboard).
- **Export**: tombol **CSV** & **XLS** mengunduh hasil filter saat ini (client-side Blob, tanpa upload server).

### 6. Dua Bahasa (EN / ID) & Navigasi Dinamis

- **Dukungan Dwibahasa Menyeluruh (i18n)**: Seluruh teks UI—meliputi navigasi shell, judul halaman, tab, KPI telemetri, tabel, dialog modal, filter, konfirmasi, hingga toast—bisa berganti secara dinamis antara **Bahasa Indonesia (default)** dan **English (US)**. Format angka, mata uang, dan tanggal/waktu disesuaikan secara terpusat. State bahasa disimpan di `localStorage` (`dashbox.locale`) dengan deteksi awal `navigator.language`, fallback otomatis `id`, serta pembaruan atribut `lang` dan judul dokumen.
- **Titik Akses Bahasa Terfokus**: Tombol cepat alih bahasa (ID/EN) tersedia di **Header** utama serta pengaturan terperinci di menu **Settings**. Sidebar footer dirancang bersih tanpa toggle bahasa duplikat.
- **Tata Letak 1280px Rata Tengah**: Seluruh tampilan halaman (`.view`) dibatasi lebar maksimum `80rem` (1280px) rata tengah (`mx-auto`) dengan padding horizontal responsif, menjaga kenyamanan visual pada layar monitor lebar maupun ultrawide.
- **Bottom Navigation Mobile-Only (<768px)**: Bar navigasi bawah hanya aktif di perangkat mobile (`<768px`). Pada layar desktop dan tablet (`>=768px`), sistem navigasi beralih ke sidebar drawer responsif dengan kontrol hamburger toggle di header.
- **Submenu Turunan & Bottom Sheet (Mobile)**: Item navigasi yang memiliki sub-item (seperti PPP, Hotspot, dan Monitor) membuka Bottom Sheet interaktif lengkap dengan penanda item aktif dan badge counter.
- **Sinkronisasi Tab URL**: Parameter tab/section pada Hotspot, Monitor, dan PPP disinkronkan ke URL router, memastikan pergantian bahasa secara langsung merender ulang view tanpa mengubah posisi tab aktif pengguna.

### 7. Arsitektur & Keamanan

- **Glacier Design System**: Palet warna dark mode modern dengan kontras tinggi, aksen neon cyan/sky, dan efek translucent backdrop blur.
- **Responsif Desktop & Mobile**: Sidebar navigasi collapsible untuk desktop dan bottom navigation bar ergonomis untuk mobile.
- **Strict SVG Icon Engine**: Semua ikon UI menggunakan SVG murni dari `@material-symbols/svg-400` tanpa ketergantungan web font / text ligature yang rentan patah.
- **XSS Protection**: Sanitasi ketat untuk semua data dinamis yang dirender ke DOM menggunakan utilitas `escapeHtml`.

---

## 🏗️ Arsitektur Proyek

Dashbox menerapkan pola pemisahan modular yang bersih (_unidirectional data flow & decoupled repositories_):

```text
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  ViewRouter  ├────►│    Views     ├────►│  Components  │
└──────────────┘     └──────┬───────┘     └──────┬───────┘
                            │                    │
                            ▼                    ▼
                     ┌──────────────┐     ┌──────────────┐
                     │    Store     ├────►│ UI / State   │
                     └──────┬───────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │ Repositories │ (Switch: Mock ⇄ Real)
                     └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   Services   │ (Domain Logic: PPP, Router, Hotspot)
                     └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  HttpClient  │ (REST Client, Retry, Auth, Timeout)
                     └──────────────┘
```

### Struktur Direktori

```text
dashbox/
├── public/                     # Aset statis & favicon
├── src/
│   ├── config/                 # Konfigurasi aplikasi & definisi navigasi
│   ├── types/                  # Kontrak TypeScript global (API, PPP, Hotspot, Router, UI, Monitor, Report)
│   ├── services/               # REST HTTP Client, Endpoint, dan Domain Services
│   │   └── api/                # HttpClient, Token Store, dan Error Handling
│   ├── repositories/           # Abstraksi data (switcher Mock ⇄ REST API)
│   ├── store/                  # Observable state management (PPP Store & UI Store)
│   ├── router/                 # View router berbasis lifecycle (mount/destroy)
│   ├── components/
│   │   ├── layout/             # Header, Sidebar, BottomNav, DrawerBackdrop
│   │   ├── ui/                 # Icon helper, Toast, ConfirmDialog
│   │   ├── ppp/                # Tabel PPP, Cards, Toolbar, Tabs, Modal Inspector
│   │   ├── hotspot/            # Tabel Hotspot, Cards, Toolbar, Filter, Dialog Voucher
│   │   ├── monitor/            # Tabs, Traffic, Firewall, Queue, Log Stream
│   │   └── report/             # Summary, Toolbar, Table, Resume/Grafik
│   ├── views/                  # Rakitan halaman: Dashboard, PPP, Hotspot, Report, Monitor, Settings
│   ├── mock/                   # In-memory fixture & simulasi latency untuk development/demo
│   ├── utils/                  # Utilitas murni: DOM helper, formatters, debounce, logger
│   ├── main.ts                 # Bootstrap aplikasi
│   └── style.css               # Tailwind CSS entry & custom layer rules
├── .env.example                # Template konfigurasi environment
├── tailwind.config.js          # Design tokens (Glacier color palette & typography)
├── tsconfig.json               # Konfigurasi strict TypeScript
└── vite.config.ts              # Konfigurasi Vite & module aliases
```

---

## 🚀 Memulai

### Prasyarat

- Node.js (versi 18.x atau yang lebih baru)
- npm / pnpm / yarn

### Instalasi & Menjalankan

1. **Clone repository:**

   ```bash
   git clone https://github.com/quiqxiq/dashbox.git
   cd dashbox
   ```

2. **Pasang dependensi:**

   ```bash
   npm install
   ```

3. **Siapkan environment:**

   ```bash
   cp .env.example .env.development.local
   ```

4. **Jalankan development server:**

   ```bash
   npm run dev
   ```

5. Buka peramban di `http://localhost:5173`.

---

## ⚙️ Konfigurasi Environment & Mode Data

Dashbox dapat beroperasi dalam dua mode data:

### 1. Mode Mock (Default)

Sangat berguna untuk demonstrasi, pengujian UI, dan pengembangan lokal tanpa perlu terhubung ke router fisik:

```env
VITE_USE_MOCK=true
VITE_LOG_LEVEL=debug
```

_Catatan: Mode mock menyimpan perubahan data pada memori browser. Refresh halaman akan mengembalikan data ke fixture awal._

### 2. Mode Live (RouterOS v7 REST API)

Menghubungkan langsung aplikasi ke endpoint REST RouterOS:

```env
VITE_USE_MOCK=false
VITE_API_BASE_URL=https://192.168.1.1/rest
VITE_API_USERNAME=admin
VITE_API_PASSWORD=secret_password_anda
VITE_LOG_LEVEL=info
```

#### Persiapan pada RouterOS v7:

Pastikan layanan REST API RouterOS aktif dan dapat diakses:

```routeros
# Aktifkan layanan www-ssl atau www
/ip service set www-ssl disabled=no port=443
# Atau gunakan www standar (HTTP) jika melalui reverse proxy
/ip service set www disabled=no port=80
```

> **Catatan CORS / SSL**: Jika Anda mengakses REST API dari peramban secara langsung, pastikan sertifikat SSL valid atau gunakan reverse proxy (seperti Nginx / Caddy) untuk meneruskan request ke `/rest` dan menangani CORS header.

---

## 📜 Daftar Script npm

| Script              | Deskripsi                                                                  |
| ------------------- | -------------------------------------------------------------------------- |
| `npm run dev`       | Menjalankan Vite development server dengan hot reload                      |
| `npm run typecheck` | Menjalankan pemeriksaan ketat TypeScript (`tsc --noEmit`)                  |
| `npm run lint`      | Memeriksa kepatuhan kode menggunakan ESLint                                |
| `npm run format`    | Memformat kode secara konsisten dengan Prettier                            |
| `npm run build`     | Melakukan typecheck lalu mengompilasi bundel produksi ke direktori `dist/` |
| `npm run preview`   | Menjalankan preview lokal dari hasil kompilasi produksi                    |

---

## 🎨 Panduan Desain & Aturan Kode

- **Aturan Ikon**:
  Semua ikon UI wajib memakai SVG dari `@material-symbols/svg-400` via helper:
  ```ts
  import { icon } from '@components/ui/icon';

  icon('dashboard', 'text-primary text-[18px]');
  ```
  _Dilarang memakai emoji, karakter teks mentah (`+`, `−`, `✓`, `✕`), atau ligature font sebagai ikon._
- **Tailwind Utility Classes**:
  Dilarang menginterpolasi class Tailwind secara dinamis (misal: `bg-${color}-500`). Gunakan static lookup map untuk menjaga agar compiler Tailwind dapat memproses class saat build.
- **Sanitasi DOM**:
  Seluruh konten dinamis yang dimasukkan ke `innerHTML` wajib melalui helper `escapeHtml(...)` guna mencegah celah XSS.

---

## 📄 Lisensi

Didistribusikan di bawah lisensi MIT. Silakan gunakan dan sesuaikan untuk kebutuhan pengelolaan jaringan Anda.
