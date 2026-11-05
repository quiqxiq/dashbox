├── 📄 index.html                          # Shell SPA — hanya <div id="app"> + entry script
├── 📄 package.json                        # Dependency & npm scripts
├── 📄 tsconfig.json                       # TS strict + path alias (@/*, @types/*, dst)
├── 📄 tsconfig.node.json                  # TS config khusus vite.config.ts
├── 📄 vite.config.ts                      # Alias resolver + dev proxy + build target
├── 📄 tailwind.config.js                  # Design tokens (Glacier palette)
├── 📄 postcss.config.js                   # Tailwind + Autoprefixer
├── 📄 .env.example                        # Template env vars
├── 📄 .gitignore
│
├── 📁 public/                             # Asset statis (disajikan apa adanya)
│   └── favicon.svg
│
└── 📁 src/                                # ═══ SOURCE CODE ═══
    │
    ├── 📄 main.ts                         # 🚀 Bootstrap: rakit semua layer → jalankan
    ├── 📄 style.css                       # @tailwind + @layer components (Glacier)
    ├── 📄 env.d.ts                        # Type augmentation untuk import.meta.env
    │
    ├── 📁 config/                         # ═══ KONFIGURASI RUNTIME ═══
    │   ├── app.config.ts                  # Baca env → objek typed (apiBaseUrl, useMock, logLevel)
    │   └── navigation.config.ts           # Definisi sidebar & bottom-nav (data-driven)
    │
    ├── 📁 types/                          # ═══ CONTRACT ANTAR LAYER ═══
    │   ├── index.ts                       # Barrel export (satu-satunya folder dengan index.ts)
    │   ├── api.types.ts                   # Paginated<T>, RequestOptions, HttpMethod
    │   ├── ppp.types.ts                   # PppSecret, PppProfile, PppTabName, PppStatus
    │   ├── router.types.ts                # RouterIdentity, RouterHealth
    │   ├── hotspot.types.ts               # HotspotUser
    │   └── view.types.ts                  # ViewName, ViewMeta
    │
    ├── 📁 services/                       # ═══ NETWORK LAYER ═══
    │   ├── api/
    │   │   ├── http-client.ts             # Typed fetch wrapper (retry, timeout, auth)
    │   │   ├── api.error.ts               # ApiError class (isRetryable, isAuth, dst)
    │   │   ├── endpoints.ts               # Konstanta semua path REST
    │   │   └── auth.token-store.ts        # Basic/Bearer token provider
    │   ├── ppp-secret.service.ts          # Method REST untuk /ppp/secret
    │   ├── router.service.ts              # Method REST untuk /system/*
    │   └── hotspot.service.ts             # Method REST untuk /ip/hotspot/*
    │
    ├── 📁 repositories/                   # ═══ DATA SOURCE SWITCHER ═══
    │   ├── ppp-secret.repository.ts       # Mock ⇄ Real (berdasarkan useMock)
    │   └── router.repository.ts           # Mock ⇄ Real
    │
    ├── 📁 store/                          # ═══ STATE MANAGEMENT ═══
    │   ├── create-store.ts                # Factory: observable store minimal
    │   ├── ppp.store.ts                   # State PPP + action (load, setTab, select, dst)
    │   └── ui.store.ts                    # State global UI (drawer, toast)
    │
    ├── 📁 router/                         # ═══ VIEW ROUTER ═══
    │   └── view-router.ts                 # register(), navigate(), subscribe()
    │
    ├── 📁 components/                     # ═══ PRESENTATIONAL ═══
    │   ├── layout/
    │   │   ├── header.component.ts        # Top bar (menu btn, title, WAN badge)
    │   │   ├── sidebar.component.ts       # Drawer dengan nav dari navigation.config
    │   │   ├── bottom-nav.component.ts    # Mobile bottom tabs
    │   │   └── drawer-backdrop.component.ts
    │   ├── ui/
    │   │   └── toast.component.ts         # Toast notification (subscribe ui.store)
    │   └── ppp/
    │       ├── ppp-tabs.component.ts      # Tab bar (Interface/Secrets/dst)
    │       ├── ppp-toolbar.component.ts   # Ikon aksi (+, −, ✓, ✕, 💬, ⟲)
    │       ├── ppp-table.component.ts     # Desktop table + double-click
    │       ├── ppp-cards.component.ts     # Mobile cards + tap-tap
    │       ├── ppp-pagination.component.ts # Prev/Next + nomor halaman
    │       └── ppp-inspector.modal.ts     # Modal Winbox-style
    │
    ├── 📁 views/                          # ═══ RAKITAN HALAMAN ═══
    │   ├── base.view.ts                   # Interface View { mount, destroy }
    │   ├── dashboard.view.ts              # Hero card, KPI, shortcut grid
    │   ├── ppp-suite.view.ts              # Compose tabs + toolbar + tabel + pagination
    │   ├── hotspot.view.ts                # Placeholder (pola sama)
    │   ├── monitor.view.ts                # Placeholder
    │   └── settings.view.ts               # Placeholder
    │
    ├── 📁 utils/                          # ═══ HELPER MURNI ═══
    │   ├── dom.ts                         # qs(), qsa(), on(), clearChildren()
    │   ├── format.ts                      # escapeHtml(), formatBytes(), formatUptime()
    │   ├── debounce.ts                    # Debounce generic
    │   └── logger.ts                      # Dev-only logger (level dari env)
    │
    └── 📁 mock/                           # ═══ FIXTURE DEV ═══
        ├── delay.ts                       # Simulasi latency
        ├── ppp-secrets.mock.ts            # 14 seed + CRUD in-memory
        └── router.mock.ts                 # identity + health