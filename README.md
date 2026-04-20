# BP Tracker — Frontend (Vue 3 SPA)

Сучасний Single Page Application (SPA) для відстеження артеріального тиску. Побудований на **Vue 3** (Composition API) з використанням **TypeScript** та **Vite**.

## 🛠 Технологічний стек

- **Фреймворк:** Vue 3 (`<script setup>`)
- **Збірка:** Vite
- **Мова:** TypeScript (Strict mode)
- **Маршрутизація:** Vue Router
- **Управління станом:** Pinia
- **Офлайн/PWA:** IndexedDB (`idb`), Service Worker (`sw.js`), Web App Manifest
- **Стилізація:** Нативний CSS (Custom Properties, CSS Nesting, без UI-фреймворків)
- **Графіки:** Chart.js
- **Автентифікація:** WebAuthn (Passkeys) через `@simplewebauthn/browser`

## 📂 Структура проекту

Проект організовано за модульними принципами для легкого масштабування та підтримки.

```text
bptracker-frontend/
├── public/                 # Статичні файли, які не обробляються Vite
│   ├── config.js           # Глобальна конфігурація (API_BASE_URL)
│   ├── manifest.json       # PWA маніфест
│   └── sw.js               # Service Worker для кешування та Web Share Target
├── src/
│   ├── components/         # Перевикористовувані UI компоненти
│   │   ├── AiReview.vue      # Анімація під час розпізнавання AI
│   │   ├── BpChart.vue       # Обгортка для Chart.js
│   │   ├── CameraCapture.vue # Компонент для сканування фото (getUserMedia)
│   │   ├── MeasurementForm.vue # Форма ручного введення з валідацією
│   │   └── MeasurementList.vue # Таблиця історії вимірювань
│   ├── composables/        # Перевикористовувана логіка (Vue Composables)
│   │   ├── useApi.ts         # Типізований клієнт для взаємодії з Backend API
│   │   └── useOfflineQueue.ts# Логіка збереження в IndexedDB при відсутності мережі
│   ├── pages/              # Сторінки (Views) для Vue Router
│   │   ├── DashboardPage.vue # Головний екран (графік + історія)
│   │   ├── LoginPage.vue     # Форма входу (Passkey + Magic Link)
│   │   ├── MeasurementPage.vue # Сторінка додавання заміру (камера/вручну)
│   │   └── SettingsPage.vue  # Налаштування профілю
│   ├── router/             # Налаштування маршрутизації
│   │   └── index.ts          # Визначення маршрутів та Navigation Guards (захист)
│   ├── stores/             # Управління глобальним станом (Pinia)
│   │   ├── auth.ts           # Стан користувача, сесія, логіка логіну
│   │   ├── measurements.ts   # Список вимірювань, CRUD операції
│   │   └── settings.ts       # Користувацькі налаштування (Gemini URL, Email)
│   ├── styles/             # Глобальні стилі
│   │   ├── global.css        # Базові правила (reset, typography)
│   │   └── tokens.css        # CSS-змінні (кольори, відступи, підтримка Dark Mode)
│   ├── types/              # TypeScript інтерфейси
│   │   └── api.ts            # Типи DTO, User, Measurement
│   ├── App.vue             # Кореневий компонент
│   └── main.ts             # Точка входу в додаток
├── index.html              # HTML шаблон
├── package.json            # Залежності та скрипти
├── tsconfig.json           # Налаштування TypeScript
└── vite.config.ts          # Налаштування збірки Vite
```

## ⚙️ Конфігурація

Базова адреса бекенду налаштовується у файлі `public/config.js`. Цей файл завантажується перед ініціалізацією Vue, що дозволяє змінювати адресу API без перезбірки проекту:

```javascript
window.CONFIG = {
    API_BASE_URL: 'https://api-bptracker.home.vn.ua/api/v1',
    CHART_DAYS_LIMIT: 30
};
```

## 🚀 Розробка та Збірка

### Встановлення залежностей
```bash
npm install
```

### Запуск сервера розробки
```bash
npm run dev
```

### Збірка для Production
```bash
npm run build
```
Ця команда збере оптимізовані файли в папку `dist/`. Також скрипт автоматично скопіює `index.html` у `404.html`, що необхідно для коректної роботи Vue Router на GitHub Pages.

## 🌐 Деплой (GitHub Pages)

Проект налаштований на автоматичне розгортання через **GitHub Actions**.
При пуші в гілку `main`, GitHub Action (файл `.github/workflows/deploy.yml`) автоматично збере проект і опублікує папку `dist` на вашому GitHub Pages.

> **Важливо:** У налаштуваннях репозиторію (Settings -> Pages -> Source) має бути вибрано **GitHub Actions**.

## 📱 PWA та Офлайн режим

Додаток є повноцінним Progressive Web App:
- Може бути встановлений на головний екран смартфона.
- Має захист від "чорного екрану" при старті завдяки коректному `base` у роутері та `start_url` у маніфесті.
- Підтримує **офлайн-додавання вимірювань**: якщо мережі немає, замір зберігається локально в IndexedDB (`useOfflineQueue.ts`) і автоматично відправляється на сервер при наступному завантаженні (або появі зв'язку).
- Підтримує "Web Share Target": ви можете "поділитися" фотографією з галереї телефону прямо в додаток для розпізнавання.
