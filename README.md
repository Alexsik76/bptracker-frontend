# BP Tracker — Frontend (Vue 3 SPA)

Single Page Application для відстеження артеріального тиску. Побудований на **Vue 3** (Composition API) з використанням **TypeScript** та **Vite**.

## Backend integration

Цей фронтенд є клієнтом для [BP Tracker Backend](../bptracker-backend/README.md). Він взаємодіє з REST API для збереження вимірювань, автентифікації та отримання налаштувань. Повний перелік ендпоінтів та контрактів доступний у документації бекенду.

## Технологічний стек

- **Фреймворк:** Vue 3 (`<script setup>`)
- **Збірка:** Vite
- **Мова:** TypeScript (Strict mode, `erasableSyntaxOnly`)
- **Маршрутизація:** Vue Router
- **Управління станом:** Pinia
- **Локалізація:** vue-i18n v11 (`legacy: false`, Composition API)
- **Офлайн/PWA:** IndexedDB (`idb`), Service Worker (`sw.js`), Web App Manifest
- **Стилізація:** Нативний CSS (Custom Properties, CSS Nesting, без UI-фреймворків)
- **Графіки:** Chart.js
- **Автентифікація:** WebAuthn (Passkeys) через `@simplewebauthn/browser`

## Структура проекту

```text
bptracker-frontend/
├── public/
│   ├── config.js           # Глобальна конфігурація (API_BASE_URL)
│   ├── manifest.json       # PWA маніфест
│   ├── sw.js               # Service Worker (кешування app shell, SPA навігація, Web Share Target)
│   └── CNAME               # GitHub Pages custom domain
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── BottomTabBar.vue    # Нижня навігація: 4 таби (Дашборд/Історія/Ліки/Профіль)
│   │   │   ├── ChartPanel.vue      # Панель Chart.js з перемикачем periodу та легендою ліній
│   │   │   ├── DashboardHeader.vue # Хедер: heartbeat-логотип, кнопка налаштувань, "+ Додати"
│   │   │   ├── HeroCard.vue        # Блок з останнім виміром, sparkline, badge зони + кнопка ⓘ
│   │   │   ├── HistoryPanel.vue    # Прев'ю вимірювань за сьогодні та вчора
│   │   │   ├── HistoryTab.vue      # Таб повної історії з фільтрами та видаленням
│   │   │   ├── KpiCard.vue         # Картка KPI
│   │   │   ├── KpiGrid.vue         # Сітка з 4 карток KPI
│   │   │   └── PeriodTabs.vue      # Перемикач періоду (7/30/90/365 днів)
│   │   ├── settings/
│   │   │   └── BpScaleInfo.vue     # Таблиця шкали ESC (4 рівні), tie-break, дисклеймер
│   │   ├── AiReview.vue        # Анімація під час розпізнавання AI
│   │   ├── BpChart.vue         # Графік Chart.js з лініями норм; реагує на зміну локалі
│   │   ├── CameraCapture.vue   # Сканування фото (getUserMedia)
│   │   ├── ConfirmDialog.vue   # Глобальний діалог підтвердження
│   │   ├── MeasurementForm.vue # Форма ручного введення з валідацією
│   │   ├── MeasurementList.vue # Список вимірювань з групуванням
│   │   ├── SchemaCard.vue      # Відображення схеми лікування
│   │   └── ToastContainer.vue  # Контейнер toast-сповіщень
│   ├── composables/
│   │   ├── useApi.ts               # HTTP-клієнт; кидає ApiError (не рядки)
│   │   ├── useApiErrorMessage.ts   # toMessage(err, fallbackKey) → локалізований текст помилки
│   │   ├── useBpLabels.ts          # Реактивний computed<Record<BpClass, string>> через t()
│   │   ├── useConfirm.ts           # Діалог підтвердження
│   │   ├── useExport.ts            # CSV-експорт
│   │   ├── useKpi.ts               # KPI з вимірювань (normalCount через NORMAL_CLASSES)
│   │   ├── useLocale.ts            # Управління локаллю (locale ref + setLocale → localStorage)
│   │   ├── useOfflineQueue.ts      # Офлайн-черга (IndexedDB)
│   │   ├── useTheme.ts             # Управління темою (auto/light/dark, localStorage)
│   │   ├── useToast.ts             # Toast-сповіщення
│   │   ├── useZone.ts              # Тонка обгортка над bp.ts: getZone → Zone { key, color, bg }
│   │   └── __tests__/
│   │       ├── useKpi.test.ts      # Тести KPI-агрегатів
│   │       └── useTheme.test.ts    # Тести переключення теми
│   ├── i18n.ts                 # vue-i18n: createI18n, AppLocale тип, експорт i18n
│   ├── locales/
│   │   ├── uk.ts               # Українська (source of truth, визначає MessageSchema)
│   │   └── en.ts               # Англійська (типізована як MessageSchema)
│   ├── pages/
│   │   ├── DashboardPage.vue   # Головний екран (3 таби)
│   │   ├── LoginPage.vue       # Вхід (Passkey + Magic Link)
│   │   ├── MeasurementPage.vue # Додавання заміру (камера / вручну)
│   │   └── SettingsPage.vue    # Налаштування (перемикачі теми та мови) + BpScaleInfo
│   ├── router/
│   │   └── index.ts            # Маршрути та Navigation Guard
│   ├── stores/
│   │   ├── auth.ts             # Стан користувача
│   │   ├── measurements.ts     # CRUD вимірювань + офлайн sync
│   │   └── settings.ts         # Користувацькі налаштування
│   ├── styles/
│   │   ├── global.css          # Базові стилі
│   │   └── tokens.css          # CSS-змінні: темна (default) + повна світла палітра
│   ├── types/
│   │   └── api.ts              # DTO-типи
│   ├── utils/
│   │   ├── apiError.ts         # ApiError, ApiErrorCode, isApiError, httpStatusToCode
│   │   ├── bp.ts               # Класифікація ESC: classifyBP, BP_CLASS_COLOR/BG/RANGE, NORMAL_CLASSES
│   │   ├── image.ts            # Клієнтська передобробка фото (масштабування, стиснення)
│   │   ├── theme.ts            # Робота з CSS-змінними
│   │   └── __tests__/
│   │       ├── bp.test.ts      # Тести класифікації, NORMAL_CLASSES та BP_CLASS_RANGE
│   │       ├── i18n.test.ts    # Тест паритету ключів uk/en
│   │       └── image.test.ts   # Тести обробки зображень
│   ├── App.vue                 # Кореневий компонент
│   └── main.ts                 # Точка входу; реєструє i18n + встановлює lang на <html>
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Локалізація (i18n)

Підтримуються дві мови: **Українська** (`uk`, за замовчуванням) та **Англійська** (`en`). Перемикач розташований у **Settings → Мова / Language**.

| Аспект | Деталь |
|--------|--------|
| Бібліотека | vue-i18n v11, `legacy: false`, `globalInjection: true` |
| Зберігання | `localStorage('bptracker:locale')` |
| Source of truth | `src/locales/uk.ts` визначає `MessageSchema` — TypeScript-тип для обох локалей |
| Паритет ключів | `src/utils/__tests__/i18n.test.ts` гарантує однаковий набір ключів у uk та en |
| Composable | `useLocale.ts` — `locale` ref + `setLocale()`; синхронізує `document.documentElement.lang` |
| Мітки BP-зон | `useBpLabels.ts` — `computed<Record<BpClass, string>>` через `t()`; реагує на зміну мови |
| Графіки | `BpChart.vue` має `watch(locale, ...)` для оновлення Chart.js dataset labels без перерендеру |
| Формати дат | `locale.value` передається напряму в `toLocaleDateString()` (BCP 47: `'uk'`/`'en'`) |
| Шкала ESC | `bpScale.*` ключі + `<i18n-t>` для tie-break з `<strong>` — без хардкоду розмітки в локалях |

**Архітектурний принцип помилок API:** помилка — це *сигнал* (машинно-читний код), а не текст для користувача. `useApi.ts` кидає `ApiError` з типізованим `code: ApiErrorCode`. Текст вибирає компонент-споживач через `useApiErrorMessage().toMessage(err, fallbackKey)`.

## Обробка помилок API

```
src/utils/apiError.ts
  ApiErrorCode = 'network' | 'unauthorized' | 'forbidden' | 'notFound'
               | 'conflict' | 'rateLimit' | 'serverError' | 'validation' | 'unknown'
  ApiError extends Error   — поле code: ApiErrorCode
  isApiError(err)          — type guard
  httpStatusToCode(status) — HTTP status → ApiErrorCode

src/composables/useApiErrorMessage.ts
  toMessage(err, fallbackKey?)
    ApiError  → t(`errors.${err.code}`)   // локалізований текст за кодом
    інше      → t(fallbackKey)             // контекстний fallback ('errors.loadFailed' тощо)
```

Контекстні fallback-ключі: `errors.loadFailed`, `errors.saveFailed`, `errors.deleteFailed`, `errors.analyzeFailed`, `errors.exportFailed`, `errors.loginFailed`.

## Локальний OCR (Local OCR Flow)

Основний шлях додавання заміру через фото виконується повністю на клієнті — без звернення до бекенду:

1. `DashboardPage` → `LocalOcrPage` (маршрут `/measurement/local`)
2. **Камера** (`CameraCapture.vue`) → `useLocalOcr.run(blob)`
3. **ONNX inference** (`onnxruntime-web` 1.14.0, non-threaded WASM):
   - `display_detector_int8.onnx` — знаходить дисплей тонометра, обрізає
   - `digit_detector_int8.onnx` — знаходить цифри на обрізку
   - NMS → K-means (k=3) → збирає три числа (SYS/DIA/PUL)
4. Користувач підтверджує → `POST /measurements` (ідентично ручному введенню, офлайн-черга працює)
5. **Fallback:** якщо OCR не впорався — кнопка передає Blob у `MeasurementPage` через `usePendingPhoto` і запускає старий Gemini-шлях.

Моделі та WASM-файли лежать у `public/` і отримуються без додаткових CORS-заголовків (сумісно з GitHub Pages).

| Файл | Розмір |
|------|--------|
| `public/models/display_detector_int8.onnx` | 3.2 MB |
| `public/models/digit_detector_int8.onnx` | 3.2 MB |
| `public/ort-wasm/ort-wasm.wasm` | 8.8 MB |
| `public/ort-wasm/ort-wasm-simd.wasm` | 9.6 MB |

## Потік обробки фото (Photo Flow)

При додаванні вимірювання через фото відбувається наступний ланцюжок дій:

1. **Отримання зображення:** через камеру (`CameraCapture.vue`) або через Web Share Target (користувач "ділиться" фото з галереї у застосунок).
2. **Передобробка (`src/utils/image.ts`):** зображення масштабується до **1024px** по довшій стороні, перекодовується в **JPEG з якістю 0.85**, враховується EXIF orientation.
3. **AI Аналіз:** отриманий стиснений `Blob` надсилається на `/measurements/analyze`. Бекенд проксіює його в Gemini AI для OCR.
4. **Редагування:** користувач перевіряє розпізнані дані. Оригінальна відповідь Gemini та стиснений `Blob` зберігаються у локальному стані компонента `MeasurementPage.vue` (`lastAnalysis`).
5. **Збереження:**
   - Якщо є `lastAnalysis` → виклик `POST /measurements/with-photo` (`multipart/form-data`). Надсилаються фінальні значення, AI-пропозиції та саме фото. **Примітка:** цей потік НЕ використовує офлайн-чергу. Якщо `navigator.onLine === false`, буде показано помилку.
   - Якщо фото немає (ручне введення) → виклик `POST /measurements` (JSON). Використовується `useOfflineQueue`.
6. **Очищення:** стан `lastAnalysis` скидається після успішного збереження або скасування.

Файли: `src/composables/useApi.ts`, `src/stores/measurements.ts`, `src/pages/MeasurementPage.vue`, `src/utils/image.ts`.

## Конфігурація

Базова адреса бекенду налаштовується у `public/config.js`. Завантажується синхронно до Vue bundle, тому зміна не потребує перезбірки:

```javascript
window.CONFIG = {
    API_BASE_URL: 'https://api-bptracker.home.vn.ua/api/v1'
};
```

## Розробка та збірка

```bash
npm install
npm run dev      # dev-сервер
npm run build    # production збірка → dist/
```

## Тести

```bash
npm run test:run   # одноразовий запуск (CI)
npm run test       # watch-режим (розробка)
```

Покриті юніт-тестами:

| Файл | Що перевіряється |
|------|-----------------|
| `bp.test.ts` | `classifyBP`, `NORMAL_CLASSES`, `BP_CLASS_RANGE` (ESC-класифікація) |
| `useKpi.test.ts` | Медичні агрегати (avg, % в нормі, динаміка) |
| `useTheme.test.ts` | Переключення теми |
| `image.test.ts` | Передобробка фото (масштаб, JPEG-стиснення) |
| `i18n.test.ts` | Паритет ключів uk/en — гарантує відсутність пропущених перекладів |

CI (GitHub Actions) запускає тести перед кожним білдом. Скрипт `build` автоматично копіює `dist/index.html` у `dist/404.html` для коректної роботи SPA-роутингу на GitHub Pages.

## Класифікація артеріального тиску

Єдине джерело правди — `src/utils/bp.ts`. Шкала ESC (4 рівні, tie-break = вищий рівень):

| Клас | Систолічний | Діастолічний |
|------|-------------|--------------|
| `optimal` | < 120 | І < 80 |
| `normal`  | 120–139 | АБО 80–89 |
| `stage1`  | 140–159 | АБО 90–99 |
| `stage2`  | ≥ 160   | АБО ≥ 100 |

Експорти `bp.ts`:
- `classifyBP(sys, dia)` — повертає `BpClass`
- `BP_CLASS_COLOR` / `BP_CLASS_BG` — CSS-токени кольорів для кожного рівня
- `BP_CLASS_RANGE` — текстові діапазони (`{ sys, dia }`) для відображення в UI (використовується в `BpScaleInfo`)
- `NORMAL_CLASSES` — `Set(['optimal', 'normal'])`, використовується в `useKpi`

`useZone.ts` — тонка обгортка: `getZone(sys, dia)` повертає `Zone = { key, color, bg }` з CSS-токенами. Назва зони береться через `useBpLabels` з поточного перекладу — жодних хардкодних рядків у компонентах.

**Довідка для користувача:** компонент `BpScaleInfo.vue` (Settings → кінець сторінки) показує таблицю рівнів з badge-кольорами, пояснення tie-break та дисклеймер. З головного екрану туди веде кнопка ⓘ біля badge зони на `HeroCard`. Роутер налаштований на smooth-scroll до якоря `#bp-scale-info` з відступом 80px під хедер.

## Система тем

Підтримуються три режими: **Авто** (слідує ОС), **Світла**, **Темна**.

| Аспект | Деталь |
|--------|--------|
| Зберігання | `localStorage('bptracker:theme')` |
| Застосування | атрибут `data-theme` на `<html>` |
| Composable | `src/composables/useTheme.ts` — singleton ref + `setTheme()` + `initTheme()` |
| UI | Segmented control «Тема» у `SettingsPage.vue` |
| FOUC | Інлайн-скрипт у `index.html` встановлює `data-theme` до завантаження CSS |
| Ініціалізація | `initTheme()` викликається у `main.ts` перед `app.mount()` |

**CSS-патерн** у `tokens.css`:

```css
:root { /* темна палітра (default) */ }

@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) { /* світла — для auto + OS=light */ }
}

:root[data-theme="light"] { /* світла — при ручному виборі */ }
```

Обидва light-блоки синхронізовані (`SYNC`-коментарі). `BpChart.vue` слухає зміни теми через `watch(theme, updateTheme)` на додаток до `matchMedia`-listener (для auto-режиму при зміні ОС-теми).

## Деплой (GitHub Pages)

При пуші в гілку `main` GitHub Action (`.github/workflows/deploy.yml`) автоматично збирає проект і публікує `dist/` на GitHub Pages.

> У Settings → Pages → Source має бути вибрано **GitHub Actions**.

## PWA та офлайн режим

Додаток є повноцінним Progressive Web App:

- **Встановлення** на головний екран (Android/iOS).
- **SPA-навігація через SW:** Service Worker перехоплює всі navigation requests (`mode === 'navigate'`) і повертає свіжий `index.html`, завдяки чому прямі переходи на `/settings`, `/measurement/new` тощо коректно обслуговуються Vue Router навіть без серверного SPA-fallback.
- **Кешування:** hashed assets (`/assets/*`) — cache-first (immutable); `index.html` та інші — network-first з cache-fallback для офлайну.
- **Офлайн-додавання вимірювань:** замір зберігається в IndexedDB і синхронізується при наступному завантаженні (тільки для ручного введення).
- **Web Share Target:** фотографію можна "поділитися" з галереї телефону в додаток для AI-розпізнавання.
