# NetOS · Modern RouterOS Management Dashboard

Dashboard manajemen MikroTik RouterOS modern, responsif, dan ultra-ringan berbasis **Vanilla TypeScript + Vite + Tailwind CSS**.

NetOS dirancang menyerupai fleksibilitas Winbox dipadukan dengan kemudahan web dashboard bergaya _Glacier Dark Theme_. Dibangun murni dengan TypeScript tanpa overhead framework (tanpa React/Vue/Angular), menghasilkan performa instan, konsumsi memori minim, dan type-safety yang ketat.

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

### 4. Monitor & Log Router

- **Live System Log**: Streaming log aktivitas router secara real-time.
- **Fitur Log Interaktif**:
  - Filter berdasarkan level keparahan (_INFO, WARN, ERROR, DEBUG_).
  - Tag topik sistem (misal: _system, ppp, hotspot, account, info_).
  - Jeda / lanjutkan (_Pause/Resume_) stream log secara langsung.
  - Deteksi dan badge _unread log count_ saat scrolling dihentikan.
- **Interface Traffic & Firewall**: Pratinjau monitor lalu lintas interface dan status filter firewall.

### 5. Arsitektur & Keamanan

- **Glacier Design System**: Palet warna dark mode modern dengan kontras tinggi, aksen neon cyan/sky, dan efek translucent backdrop blur.
- **Responsif Desktop & Mobile**: Sidebar navigasi collapsible untuk desktop dan bottom navigation bar ergonomis untuk mobile.
- **Strict SVG Icon Engine**: Semua ikon UI menggunakan SVG murni dari `@material-symbols/svg-400` tanpa ketergantungan web font / text ligature yang rentan patah.
- **XSS Protection**: Sanitasi ketat untuk semua data dinamis yang dirender ke DOM menggunakan utilitas `escapeHtml`.

---

## 🏗️ Arsitektur Proyek

NetOS menerapkan pola pemisahan modular yang bersih (_unidirectional data flow & decoupled repositories_):

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
│   ├── types/                  # Kontrak TypeScript global (API, PPP, Hotspot, Router, UI)
│   ├── services/               # REST HTTP Client, Endpoint, dan Domain Services
│   │   └── api/                # HttpClient, Token Store, dan Error Handling
│   ├── repositories/           # Abstraksi data (switcher Mock ⇄ REST API)
│   ├── store/                  # Observable state management (PPP Store & UI Store)
│   ├── router/                 # View router berbasis lifecycle (mount/destroy)
│   ├── components/
│   │   ├── layout/             # Header, Sidebar, BottomNav, DrawerBackdrop
│   │   ├── ui/                 # Icon helper, Toast, ConfirmDialog
│   │   ├── ppp/                # Tabel PPP, Cards, Toolbar, Tabs, Modal Inspector
│   │   └── hotspot/            # Tabel Hotspot, Cards, Toolbar, Filter, Dialog Voucher
│   ├── views/                  # Rakitan halaman: Dashboard, PPP, Hotspot, Monitor, Settings
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

NetOS dapat beroperasi dalam dua mode data:

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
