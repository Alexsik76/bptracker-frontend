# BP Tracker — Frontend (Vue 3 SPA)

Single Page Application для відстеження артеріального тиску. Побудований на **Vue 3** (Composition API) з використанням **TypeScript** та **Vite**.

## Технологічний стек

- **Фреймворк:** Vue 3 (`<script setup>`)
- **Збірка:** Vite
- **Мова:** TypeScript (Strict mode)
- **Маршрутизація:** Vue Router
- **Управління станом:** Pinia
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
│   │   │   ├── DashboardHeader.vue # Хедер: логотип, кнопки settings/profile, user-chip, "Додати"
│   │   │   ├── KpiCard.vue         # Одна KPI-картка (label, value, sub, accentColor, valueColor, slot)
│   │   │   ├── KpiGrid.vue         # Сітка з 4 карток; використовує useKpi
│   │   │   ├── PeriodTabs.vue      # Перемикач періоду (7/30/90/365 днів), v-model
│   │   │   ├── ChartPanel.vue      # Панель графіка з локальним period, empty state
│   │   │   └── HistoryPanel.vue    # Панель історії + кнопка CSV-експорту (useExport)
│   │   ├── AiReview.vue        # Анімація під час розпізнавання AI
│   │   ├── BpChart.vue         # Графік Chart.js з лініями норм (120/140 мм рт.ст.)
│   │   ├── CameraCapture.vue   # Сканування фото (getUserMedia)
│   │   ├── MeasurementForm.vue # Форма ручного введення з валідацією
│   │   ├── MeasurementList.vue # Історія з групуванням по днях та кольоровим кодуванням
│   │   └── SchemaCard.vue      # Відображення схеми лікування (розклад прийому ліків)
│   ├── composables/
│   │   ├── useApi.ts           # Типізований HTTP-клієнт (credentials: include)
│   │   ├── useExport.ts        # CSV-експорт: confirm → запит → alert
│   │   ├── useKpi.ts           # KPI з вимірювань: останній замір, середні, норма, дельта
│   │   └── useOfflineQueue.ts  # Офлайн-черга в IndexedDB
│   ├── pages/
│   │   ├── DashboardPage.vue   # Головний екран — тонкий оркестратор dashboard/-компонентів
│   │   ├── LoginPage.vue       # Вхід (Passkey + Magic Link, обробка ?token=)
│   │   ├── MeasurementPage.vue # Додавання заміру (камера / вручну)
│   │   └── SettingsPage.vue    # Налаштування (export email, gemini URL, logout)
│   ├── router/
│   │   └── index.ts            # Маршрути та Navigation Guard (checkSession перед першим переходом)
│   ├── stores/
│   │   ├── auth.ts             # Стан користувача, Passkey/magic link логіка
│   │   ├── measurements.ts     # CRUD вимірювань + офлайн sync
│   │   └── settings.ts         # Користувацькі налаштування
│   ├── styles/
│   │   ├── global.css          # Reset, base rules
│   │   └── tokens.css          # CSS-змінні: кольори, відступи, dark mode
│   ├── types/
│   │   └── api.ts              # DTO-типи: User, Measurement, UserSettings, TreatmentSchema
│   ├── utils/
│   │   └── bp.ts               # classifyBP(), BP_CLASS_COLOR, BP_CLASS_LABEL (класифікація ВОЗ)
│   ├── App.vue                 # Кореневий компонент (spinner під час auth check)
│   └── main.ts                 # Точка входу
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

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

Покриті юніт-тестами: `useKpi` (медичні агрегати — середні, дельти, класифікація). CI (GitHub Actions) запускає тести перед кожним білдом та на Pull Request.

Скрипт `build` автоматично копіює `dist/index.html` у `dist/404.html` для коректної роботи SPA-роутингу на GitHub Pages.

## Деплой (GitHub Pages)

При пуші в гілку `main` GitHub Action (`.github/workflows/deploy.yml`) автоматично збирає проект і публікує `dist/` на GitHub Pages.

> У Settings → Pages → Source має бути вибрано **GitHub Actions**.

## PWA та офлайн режим

Додаток є повноцінним Progressive Web App:

- **Встановлення** на головний екран (Android/iOS).
- **SPA-навігація через SW:** Service Worker перехоплює всі navigation requests (`mode === 'navigate'`) і повертає свіжий `index.html`, завдяки чому прямі переходи на `/settings`, `/measurement/new` тощо коректно обслуговуються Vue Router навіть без серверного SPA-fallback.
- **Кешування:** hashed assets (`/assets/*`) — cache-first (immutable); `index.html` та інші — network-first з cache-fallback для офлайну.
- **Офлайн-додавання вимірювань:** замір зберігається в IndexedDB і синхронізується при наступному завантаженні.
- **Web Share Target:** фотографію можна "поділитися" з галереї телефону в додаток для AI-розпізнавання.
