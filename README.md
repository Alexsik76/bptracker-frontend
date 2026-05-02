# BP Tracker — Frontend (Vue 3 SPA)

Single Page Application для відстеження артеріального тиску. Побудований на **Vue 3** (Composition API) з використанням **TypeScript** та **Vite**.

## Backend integration

Цей фронтенд є клієнтом для [BP Tracker Backend](../bptracker-backend/README.md). Він взаємодіє з REST API для збереження вимірювань, автентифікації та отримання налаштувань. Повний перелік ендпоінтів та контрактів доступний у документації бекенду.

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
│   │   │   ├── BottomTabBar.vue    # Нижня навігація: 4 таби (Дашборд/Історія/Ліки/Профіль)
│   │   │   ├── ChartPanel.vue      # Панель Chart.js з перемикачем periodу та легендою ліній
│   │   │   ├── DashboardHeader.vue # Хедер: heartbeat-логотип, кнопка налаштувань, "+ Додати"
│   │   │   ├── HeroCard.vue        # Блок з останнім виміром, sparkline та badge зони
│   │   │   ├── HistoryPanel.vue    # Прев'ю вимірювань за сьогодні та вчора
│   │   │   ├── HistoryTab.vue      # Таб повної історії з фільтрами та видаленням
│   │   │   ├── KpiCard.vue         # Картка KPI
│   │   │   ├── KpiGrid.vue         # Сітка з 4 карток KPI
│   │   │   └── PeriodTabs.vue      # Перемикач періоду (7/30/90/365 днів)
│   │   ├── AiReview.vue        # Анімація під час розпізнавання AI
│   │   ├── BpChart.vue         # Графік Chart.js з лініями норм
│   │   ├── CameraCapture.vue   # Сканування фото (getUserMedia)
│   │   ├── ConfirmDialog.vue   # Глобальний діалог підтвердження
│   │   ├── MeasurementForm.vue # Форма ручного введення з валідацією
│   │   ├── MeasurementList.vue # Список вимірювань з групуванням
│   │   ├── SchemaCard.vue      # Відображення схеми лікування
│   │   └── ToastContainer.vue  # Контейнер toast-сповіщень
│   ├── composables/
│   │   ├── useApi.ts           # HTTP-клієнт
│   │   ├── useConfirm.ts       # Діалог підтвердження
│   │   ├── useExport.ts        # CSV-експорт
│   │   ├── useKpi.ts           # KPI з вимірювань
│   │   ├── useOfflineQueue.ts  # Офлайн-черга (IndexedDB)
│   │   ├── useToast.ts         # Toast-сповіщення
│   │   └── useZone.ts          # Класифікація зони тиску
│   ├── pages/
│   │   ├── DashboardPage.vue   # Головний екран (3 таби)
│   │   ├── LoginPage.vue       # Вхід (Passkey + Magic Link)
│   │   ├── MeasurementPage.vue # Додавання заміру (камера / вручну)
│   │   └── SettingsPage.vue    # Налаштування
│   ├── router/
│   │   └── index.ts            # Маршрути та Navigation Guard
│   ├── stores/
│   │   ├── auth.ts             # Стан користувача
│   │   ├── measurements.ts     # CRUD вимірювань + офлайн sync
│   │   └── settings.ts         # Користувацькі налаштування
│   ├── styles/
│   │   ├── global.css          # Базові стилі
│   │   └── tokens.css          # CSS-змінні та теми
│   ├── types/
│   │   └── api.ts              # DTO-типи
│   ├── utils/
│   │   ├── bp.ts               # Класифікація ВООЗ
│   │   ├── image.ts            # Клієнтська передобробка фото (масштабування, стиснення)
│   │   ├── theme.ts            # Робота з CSS-змінними
│   │   └── __tests__/
│   │       └── image.test.ts   # Тести обробки зображень
│   ├── App.vue                 # Кореневий компонент
│   └── main.ts                 # Точка входу
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Потік обробки фото (Photo Flow)

При додаванні вимірювання через фото відбувається наступний ланцюжок дій:

1.  **Отримання зображення:** через камеру (`CameraCapture.vue`) або через Web Share Target (користувач "ділиться" фото з галереї у застосунок).
2.  **Передобробка (`src/utils/image.ts`):** зображення масштабується до **1024px** по довшій стороні, перекодовується в **JPEG з якістю 0.85**, враховується EXIF orientation.
3.  **AI Аналіз:** отриманий стиснений `Blob` надсилається на `/measurements/analyze`. Бекенд проксіює його в Gemini AI для OCR.
4.  **Редагування:** користувач перевіряє розпізнані дані. Оригінальна відповідь Gemini та стиснений `Blob` зберігаються у локальному стані компонента `MeasurementPage.vue` (`lastAnalysis`).
5.  **Збереження:** 
    *   Якщо є `lastAnalysis` → виклик `POST /measurements/with-photo` (`multipart/form-data`). Надсилаються фінальні значення, AI-пропозиції та саме фото. **Примітка:** цей потік НЕ використовує офлайн-чергу. Якщо `navigator.onLine === false`, буде показано помилку.
    *   Якщо фото немає (ручне введення) → виклик `POST /measurements` (JSON). Використовується `useOfflineQueue`.
6.  **Очищення:** стан `lastAnalysis` скидається після успішного збереження або скасування.

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

Покриті юніт-тестами: `useKpi` (медичні агрегати) та `preprocessImage` (обробка фото). CI (GitHub Actions) запускає тести перед кожним білдом.

Скрипт `build` автоматично копіює `dist/index.html` у `dist/404.html` для коректної роботи SPA-роутингу на GitHub Pages.

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
