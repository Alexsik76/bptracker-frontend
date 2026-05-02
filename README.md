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
│   │   │   ├── BottomTabBar.vue    # Нижня навігація: 4 таби
│   │   │   ├── ChartPanel.vue      # Панель Chart.js
...
│   ├── types/
│   │   └── api.ts              # DTO-типи: User, Measurement, UserSettings, TreatmentSchema
│   ├── utils/
│   │   ├── bp.ts               # classifyBP(), BP_CLASS_COLOR, BP_CLASS_LABEL
│   │   ├── image.ts            # Клієнтська передобробка фото перед AI-аналізом (масштабування, стиснення)
│   │   ├── theme.ts            # cssVar(name) — читання CSS Custom Properties
│   │   └── __tests__/
│   │       └── image.test.ts   # Тести логіки обробки зображень
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
    *   Якщо є `lastAnalysis` → виклик `POST /measurements/with-photo` (`multipart/form-data`). Надсилаються фінальні значення, AI-пропозиції та саме фото.
    *   Якщо фото немає (ручне введення) → виклик `POST /measurements` (JSON).
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

...
```
