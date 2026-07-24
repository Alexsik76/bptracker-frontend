# BP Tracker — Frontend (Vue 3 SPA)

Single Page Application for tracking blood pressure. Built with **Vue 3** (Composition API) using **TypeScript** and **Vite**.

## Backend Integration

This frontend is a client for [BP Tracker Backend](../bptracker-backend/README.md). It communicates with the REST API to save measurements, handle authentication, and fetch settings. The full list of endpoints and contracts is available in the backend documentation.

## Tech Stack

- **Framework:** Vue 3 (`<script setup>`)
- **Build Tool:** Vite
- **Language:** TypeScript (Strict mode, `erasableSyntaxOnly`)
- **Routing:** Vue Router
- **State Management:** Pinia
- **Localization:** vue-i18n v11 (`legacy: false`, Composition API)
- **Offline / PWA:** IndexedDB (`idb`), Service Worker (`sw.js`), Web App Manifest
- **Styling:** Native CSS (Custom Properties, CSS Nesting, no UI frameworks)
- **Charts:** Chart.js
- **Authentication:** WebAuthn (Passkeys) via `@simplewebauthn/browser`

## Project Structure

```text
bptracker-frontend/
├── public/
│   ├── config.js           # Global configuration (API_BASE_URL)
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # Service Worker (app shell caching, SPA navigation, Web Share Target)
│   └── CNAME               # GitHub Pages custom domain
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── BottomTabBar.vue    # Bottom navigation: asymmetrical 2-tab bar (Dashboard/Schedule) with large SCAN button in the center
│   │   │   ├── ChartPanel.vue      # Chart.js panel with period switcher and line legend
│   │   │   ├── CornerGear.vue      # Floating scroll-dependent Settings button
│   │   │   ├── HeroCard.vue        # Block with latest measurement, sparkline, zone badge + info button ⓘ
│   │   │   ├── HistoryPanel.vue    # Preview of 2 latest measurements on Dashboard with link to full History
│   │   │   ├── KpiCard.vue         # KPI card
│   │   │   ├── KpiGrid.vue         # Grid of 4 KPI cards
│   │   │   └── PeriodTabs.vue      # Period switcher (7/30/90/365 days)
│   │   ├── meds/
│   │   │   ├── RxStatusTag.vue     # Prescription status tag (active / inactive)
│   │   │   └── RxSwitch.vue        # Prescription activation switch
│   │   ├── settings/
│   │   │   └── BpScaleInfo.vue     # ESC scale table (4 levels), tie-break rule, disclaimer
│   │   ├── AiReview.vue        # Animation during AI recognition
│   │   ├── BpChart.vue         # Chart.js chart with norm lines; updates on locale change
│   │   ├── CameraCapture.vue   # Photo scanning (getUserMedia)
│   │   ├── ConfirmDialog.vue   # Global confirmation dialog
│   │   ├── MeasurementForm.vue # Manual input form with validation
│   │   ├── MeasurementList.vue # Measurement list with grouping
│   │   ├── OcrPhotoPreview.vue # Photo preview with OCR result
│   │   ├── OcrReviewForm.vue   # OCR result confirmation/editing form
│   │   ├── SchemaCard.vue      # Treatment plan card
│   │   ├── SchemaForm.vue      # Treatment plan create/edit form
│   │   ├── SchemaList.vue      # Treatment plan list
│   │   └── ToastContainer.vue  # Toast notification container
│   ├── composables/
│   │   ├── useApi.ts               # HTTP client; throws ApiError (not strings)
│   │   ├── useApiErrorMessage.ts   # toMessage(err, fallbackKey) → localized error message
│   │   ├── useBpLabels.ts          # Reactive computed<Record<BpClass, string>> via t()
│   │   ├── useConfirm.ts           # Confirmation dialog
│   │   ├── useExport.ts            # CSV export
│   │   ├── useKpi.ts               # KPI from measurements (normalCount via NORMAL_CLASSES)
│   │   ├── useLocalOcr.ts          # In-browser ONNX inference (display + digit detectors)
│   │   ├── useLocale.ts            # Locale management (locale ref + setLocale → localStorage)
│   │   ├── useOfflineQueue.ts      # Offline queue (IndexedDB)
│   │   ├── usePendingPhoto.ts      # Blob transfer between LocalOcrPage and MeasurementPage
│   │   ├── useTheme.ts             # Theme management (auto/light/dark, localStorage)
│   │   ├── useToast.ts             # Toast notifications
│   │   ├── useZone.ts              # Thin wrapper over bp.ts: getZone → Zone { key, color, bg }
│   │   └── __tests__/
│   │       ├── useKpi.test.ts      # KPI aggregates tests
│   │       └── useTheme.test.ts    # Theme switching tests
│   ├── i18n.ts                 # vue-i18n: createI18n, AppLocale type, i18n export
│   ├── locales/
│   │   ├── uk.ts               # Ukrainian (source of truth, defines MessageSchema)
│   │   └── en.ts               # English (typed as MessageSchema)
│   ├── pages/
│   │   ├── meds/
│   │   │   ├── MedsListPage.vue    # View and manage medication schedules (prescriptions)
│   │   │   ├── MedsDetailPage.vue  # Treatment plan details
│   │   │   └── MedsFormPage.vue    # Treatment plan create/edit form
│   │   ├── DashboardPage.vue   # Main screen (metrics, chart, KPI, history preview; without tabs)
│   │   ├── HistoryPage.vue     # Full pressure measurement history grouped by days
│   │   ├── LocalOcrPage.vue    # Local ONNX blood pressure monitor recognition
│   │   ├── LoginPage.vue       # Login (Passkey + Magic Link)
│   │   ├── MeasurementPage.vue # Add measurement via Gemini fallback (camera / manual)
│   │   ├── SchedulePage.vue    # Today's medication schedule with confirmation option
│   │   └── SettingsPage.vue    # Settings (theme and language switchers, import/export) + BpScaleInfo
│   ├── router/
│   │   └── index.ts            # Routes and Navigation Guard
│   ├── stores/
│   │   ├── __tests__/
│   │   │   └── schemas.test.ts     # useSchemaStore tests (CRUD, activate, validation)
│   │   ├── auth.ts             # User state
│   │   ├── measurements.ts     # Measurements CRUD + offline sync
│   │   ├── schemas.ts          # Treatment plan CRUD (TreatmentSchema)
│   │   └── settings.ts         # User settings
│   ├── styles/
│   │   ├── global.css          # Base styles
│   │   └── tokens.css          # CSS variables: dark (default) + full light palette
│   ├── types/
│   │   └── api.ts              # DTO types
│   ├── utils/
│   │   ├── apiError.ts         # ApiError, ApiErrorCode, isApiError, httpStatusToCode
│   │   ├── bp.ts               # ESC classification: classifyBP, BP_CLASS_COLOR/BG/RANGE, NORMAL_CLASSES
│   │   ├── image.ts            # Client-side photo preprocessing (resizing, compression)
│   │   ├── theme.ts            # Working with CSS variables
│   │   └── __tests__/
│   │       ├── bp.test.ts      # Tests for classification, NORMAL_CLASSES, and BP_CLASS_RANGE
│   │       ├── i18n.test.ts    # Key parity test between uk/en
│   │       └── image.test.ts   # Image processing tests
│   ├── App.vue                 # Root component
│   └── main.ts                 # Entry point; registers i18n + sets lang on <html>
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Localization (i18n)

Two languages are supported: **Ukrainian** (`uk`, default) and **English** (`en`). The language switcher is located in **Settings → Language**.

| Aspect | Detail |
|--------|--------|
| Library | vue-i18n v11, `legacy: false`, `globalInjection: true` |
| Storage | `localStorage('bptracker:locale')` |
| Source of truth | `src/locales/uk.ts` defines `MessageSchema` — TypeScript type for both locales |
| Key parity | `src/utils/__tests__/i18n.test.ts` guarantees identical set of keys in uk and en |
| Composable | `useLocale.ts` — `locale` ref + `setLocale()`; synchronizes `document.documentElement.lang` |
| BP zone labels | `useBpLabels.ts` — `computed<Record<BpClass, string>>` via `t()`; updates on language change |
| Charts | `BpChart.vue` uses `watch(locale, ...)` to update Chart.js dataset labels without re-rendering |
| Date formats | `locale.value` is passed directly to `toLocaleDateString()` (BCP 47: `'uk'`/`'en'`) |
| ESC scale | `bpScale.*` keys + `<i18n-t>` for tie-break with `<strong>` — no hardcoded markup in locales |

**API Error Architectural Rule:** An error is a *signal* (machine-readable code), not a text for the user. `useApi.ts` throws `ApiError` with typed `code: ApiErrorCode`. The display text is chosen by the consumer component using `useApiErrorMessage().toMessage(err, fallbackKey)`.

## API Error Handling

```
src/utils/apiError.ts
  ApiErrorCode = 'network' | 'unauthorized' | 'forbidden' | 'notFound'
               | 'conflict' | 'rateLimit' | 'serverError' | 'validation' | 'unknown'
  ApiError extends Error   — field code: ApiErrorCode
  isApiError(err)          — type guard
  httpStatusToCode(status) — HTTP status → ApiErrorCode

src/composables/useApiErrorMessage.ts
  toMessage(err, fallbackKey?)
    ApiError  → t(`errors.${err.code}`)   // localized text by code
    other     → t(fallbackKey)             // contextual fallback ('errors.loadFailed' etc.)
```

Contextual fallback keys: `errors.loadFailed`, `errors.saveFailed`, `errors.deleteFailed`, `errors.analyzeFailed`, `errors.exportFailed`, `errors.loginFailed`.

## Local OCR (Local OCR Flow)

The main path for adding a measurement via photo runs entirely on the client side — without calling the backend:

1. `DashboardPage` → `LocalOcrPage` (route `/measurement/local`)
2. **Camera** (`CameraCapture.vue`) → `preprocessImage` (1024px, JPEG 0.85) → `useLocalOcr.run(blob)`
3. **ONNX inference** (`onnxruntime-web` 1.14.0, non-threaded WASM):
   - `display_detector_int8.onnx` — finds the blood pressure monitor display and crops it
   - `digit_detector_int8.onnx` — finds digits on the cropped image
   - NMS → K-means (k=3) → extracts three numbers (SYS/DIA/PUL)
4. User confirmation:
   - **Online:** `POST /measurements` → fire-and-forget `POST /measurements/{id}/photo` to contribute to dataset (Bearer token only on server). Field `source`: `"local_ocr"` or `"user_confirmed"`. If `sendPhotos = false` in settings — photo is not sent.
   - **Offline:** if `sendPhotos = true` → measurement + Blob + `ocr_meta` are saved in IndexedDB (`photos-queue`, limit 10, TTL 24 hours); if `sendPhotos = false` → only measurement is saved in `measurements-queue`. On next sync — fire-and-forget photo upload.
5. **Fallback:** if OCR fails — button passes Blob to `MeasurementPage` via `usePendingPhoto` and runs the legacy Gemini flow.
6. **OCR Metadata:** `useLocalOcr` collects `ocr_meta` during inference — timings for each stage (`performance.now()`), min/mean confidence of digit boxes, `model_version = "int8_v1"`, `user_agent`, `hw_concurrency`. Sent to `photo-api` as a JSON string in `ocr_meta` form field. TypeScript types are generated from OpenAPI spec: `npm run generate:types`.

### Scan Result Screen (`step === 'review'`)

After successful ONNX recognition, a dark confirmation screen is displayed:

| Element | Detail |
|---------|--------|
| Background | `#0d0d12` — dark, without system CSS tokens (custom screen palette) |
| Photo | Clean frame in `border-radius: 18px` container without mask/dimming |
| Beam animation | One-time animation on enter (900 ms, `requestAnimationFrame`, easeInOut). 70% duration — line movement, 30% — fade-out |
| Zoom icon | Appears after beam; tap opens `<Teleport>` overlay with 1.4× zoom |
| Photo highlighting | Colored border with `box-shadow` on the corresponding photo area activates when input field is focused |
| Input fields | Inline form with colored dot, label (`systolicLabel/Sub`), and large numeric input (26px/700) |
| Field colors | SYS — `#a39bff`, DIA — `#5ecbff`, PUL — `#5effa0` |
| Buttons | "Cancel" (flex 1, `#15151c`) + "Save" (flex 1.4, `#a39bff` with shadow) |
| Fallback | Text link "Recognize via server" below buttons |

`MeasurementForm.vue` is not used on this screen (kept for Gemini flow without changes).

Models and WASM files are located in `public/` and loaded without extra CORS headers (compatible with GitHub Pages).

| File | Size |
|------|------|
| `public/models/display_detector_int8.onnx` | 3.2 MB |
| `public/models/digit_detector_int8.onnx` | 3.2 MB |
| `public/ort-wasm/ort-wasm.wasm` | 8.8 MB |
| `public/ort-wasm/ort-wasm-simd.wasm` | 9.6 MB |

## Photo Processing Flow

When adding a measurement via photo, the following steps take place:

1. **Image Acquisition:** via camera (`CameraCapture.vue`) or Web Share Target (user shares photo from gallery to app).
2. **Preprocessing (`src/utils/image.ts`):** image is resized to **1024px** on the longer side, re-encoded to **JPEG with quality 0.85**, taking EXIF orientation into account.
3. **AI Analysis:** the compressed `Blob` is sent to `/measurements/analyze`. Backend proxies it to Gemini AI for OCR.
4. **Editing:** user checks recognized data. Original Gemini response and compressed `Blob` are stored in component state of `MeasurementPage.vue` (`lastAnalysis`).
5. **Saving:**
   - If `lastAnalysis` exists → call `POST /measurements/with-photo` (`multipart/form-data`). Final values, AI suggestions, and the photo itself are sent. **Note:** this flow does NOT use offline queue. If `navigator.onLine === false`, an error will be shown.
   - If no photo (manual entry) → call `POST /measurements` (JSON). Uses `useOfflineQueue`.
6. **Cleanup:** `lastAnalysis` state is reset after successful save or cancellation.

Files: `src/composables/useApi.ts`, `src/stores/measurements.ts`, `src/pages/MeasurementPage.vue`, `src/utils/image.ts`.

## Configuration

Backend base URL is configured in `public/config.js`. Loaded synchronously before Vue bundle, so updating it does not require a rebuild:

```javascript
window.CONFIG = {
    API_BASE_URL: 'https://api-bptracker.home.vn.ua/api/v1'
};
```

## Local Development

To run the frontend against a local backend instance:

1. Copy `public/config.local.js` (already exists if cloned; otherwise create it):
   ```javascript
   window.CONFIG = {
       API_BASE_URL: 'http://localhost:5000/api/v1'
   };
   ```
2. Start the dev server — `config.local.js` is injected automatically after `config.js` and overrides `API_BASE_URL`:
   ```bash
   npm run dev
   ```

`config.local.js` is listed in `.gitignore` and will never be committed.
The production build is unaffected — `config.local.js` is only injected by the Vite dev server.

## Development and Build

```bash
npm install
npm run dev      # dev server
npm run build    # production build → dist/
```

## Testing

```bash
npm run test:run   # single run (CI)
npm run test       # watch mode (development)
```

Covered by unit tests:

| File | What is tested |
|------|----------------|
| `bp.test.ts` | `classifyBP`, `NORMAL_CLASSES`, `BP_CLASS_RANGE` (ESC classification) |
| `useKpi.test.ts` | Medical aggregates (avg, % normal, dynamics) |
| `useTheme.test.ts` | Theme switching |
| `image.test.ts` | Photo preprocessing (resizing, JPEG compression) |
| `i18n.test.ts` | Key parity between uk/en — ensures no missing translations |
| `schemas.test.ts` | `useSchemaStore`: loading, creating, activating schema |

CI (GitHub Actions) runs tests before every build. The `build` script automatically copies `dist/index.html` to `dist/404.html` for proper SPA routing on GitHub Pages.

## Blood Pressure Classification

Single source of truth — `src/utils/bp.ts`. ESC scale (4 levels, tie-break = higher level):

| Class | Systolic | Diastolic |
|-------|----------|-----------|
| `optimal` | < 120 | AND < 80 |
| `normal`  | 120–139 | OR 80–89 |
| `stage1`  | 140–159 | OR 90–99 |
| `stage2`  | ≥ 160   | OR ≥ 100 |

Exports from `bp.ts`:
- `classifyBP(sys, dia)` — returns `BpClass`
- `BP_CLASS_COLOR` / `BP_CLASS_BG` — CSS color tokens for each level
- `BP_CLASS_RANGE` — text ranges (`{ sys, dia }`) for UI display (used in `BpScaleInfo`)
- `NORMAL_CLASSES` — `Set(['optimal', 'normal'])`, used in `useKpi`

`useZone.ts` — thin wrapper: `getZone(sys, dia)` returns `Zone = { key, color, bg }` with CSS tokens. Zone label is retrieved via `useBpLabels` from current translation — no hardcoded strings in components.

**User Help:** component `BpScaleInfo.vue` (Settings → bottom of the page) displays a level table with badge colors, tie-break explanation, and disclaimer. A button ⓘ next to zone badge on `HeroCard` links there from Dashboard. Router is configured with smooth scroll to anchor `#bp-scale-info` with 80px offset below header.

## Theme System

Three modes are supported: **Auto** (follows OS), **Light**, **Dark**.

| Aspect | Detail |
|--------|--------|
| Storage | `localStorage('bptracker:theme')` |
| Application | `data-theme` attribute on `<html>` |
| Composable | `src/composables/useTheme.ts` — singleton ref + `setTheme()` + `initTheme()` |
| UI | Segmented control "Theme" in `SettingsPage.vue` |
| FOUC | Inline script in `index.html` sets `data-theme` before CSS loads |
| Initialization | `initTheme()` is called in `main.ts` before `app.mount()` |

**CSS pattern** in `tokens.css`:

```css
:root { /* dark palette (default) */ }

@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) { /* light — for auto + OS=light */ }
}

:root[data-theme="light"] { /* light — manual choice */ }
```

Both light blocks are synchronized (`SYNC` comments). `BpChart.vue` listens to theme changes via `watch(theme, updateTheme)` in addition to `matchMedia` listener (for auto mode when OS theme changes).

## Deployment (GitHub Pages)

On push to `main` branch, GitHub Action (`.github/workflows/deploy.yml`) automatically builds the project and publishes `dist/` to GitHub Pages.

> In Settings → Pages → Source, select **GitHub Actions**.

## PWA and Offline Mode

The application is a full Progressive Web App:

- **Installation** to home screen (Android/iOS).
- **SPA navigation via SW:** Service Worker intercepts all navigation requests (`mode === 'navigate'`) and returns fresh `index.html`, allowing direct navigation to `/settings`, `/measurement/new`, etc., to work properly with Vue Router even without server SPA fallback.
- **Caching:** hashed assets (`/assets/*`) — cache-first (immutable); `index.html` and others — network-first with cache fallback for offline.
- **Offline measurement entry:** measurement (with or without photo) is saved in IndexedDB and synchronized on next load. Manual measurements — `measurements-queue`; with photo (LocalOCR) — `photos-queue` (limit 10, TTL 24 hours, client timestamp saved).
- **Web Share Target:** photo can be "shared" from phone gallery into app for AI recognition.
