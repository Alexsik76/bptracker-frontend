# BP Tracker — Frontend

PWA для відстеження артеріального тиску з підтримкою AI-розпізнавання знімків тонометра.

## Стек

- **Vanilla JavaScript** — ES6 модулі, OOP, без build step
- **UnoCSS** — JIT CDN (Tailwind-сумісний)
- **Chart.js** — графіки тиску і пульсу
- **PWA** — Service Worker, Web Share Target API, офлайн-індикація

## Можливості

- Введення вимірювань вручну або через **AI-сканування фото** тонометра
- **Дві точки входу для фото:**
  - Кнопка "Сканувати" в формі — відкриває вбудовану камеру з рамкою наведення
  - "Поділитися" з камери/галереї → додаток автоматично розпізнає і відкриває форму
- Графік за останні 30 днів (систолічний, діастолічний, пульс)
- Відображення активної схеми лікування
- Синхронізація з Google Sheets
- **Bottom sheet** на мобільних, centered modal на десктопі
- Анімований спінер під час розпізнавання AI

## Структура

```
├── index.html          Єдина HTML-сторінка
├── config.js           API_BASE_URL, CHART_DAYS_LIMIT
├── manifest.json       PWA маніфест + share_target
├── sw.js               Service Worker (network-first для JS/HTML, обробка share target)
└── js/
    ├── app.js          Головна логіка, камера, AI flow
    ├── api.js          HTTP-клієнт (measurements, analyze, schemas, sync)
    ├── ui.js           Рендеринг, модал/шіт, камера, scan overlay
    └── chartManager.js Графік Chart.js
```

## Конфігурація

`config.js`:
```javascript
export const CONFIG = {
    API_BASE_URL: 'https://api-bptracker.home.vn.ua/api',
    CHART_DAYS_LIMIT: 30
};
```

## PWA — Web Share Target

Додаток зареєстрований як ціль для "Поділитися" зображенням. Потрібно:
1. Встановити як PWA (додати на головний екран)
2. В будь-якому додатку → Поділитися → BP Tracker

Service Worker перехоплює POST-запит від ОС, зберігає файл у Cache API, перенаправляє на `/?shared=1`. При відкритті додаток автоматично запускає AI-аналіз.

## Розгортання (GitHub Pages)

Push у гілку `main` → GitHub Actions автоматично деплоїть через `.github/workflows/deploy.yml`.

Кастомний домен: `bptracker.home.vn.ua` (CNAME файл).

## Кешування

Service Worker використовує `network-first` для всіх `.js` і `.html` файлів — нові версії завжди підхоплюються без ручного очищення кешу. Перший раз після встановлення нової версії SW потрібне одноразове очищення кешу.
