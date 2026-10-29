# BP Tracker Admin

Панель адміністратора для веб-інтерфейсу BP Tracker. Створена на базі Vue 3, TypeScript, Pinia, vue-router та власних CSS-стилів (без сторонніх UI-бібліотек).

## Призначення

Забезпечує адміністрування та моніторинг сервісів BP Tracker:
- Таблиці (/tables)
- Статистика (/stats)
- Журнали (/logs)
- Налаштування (/settings)
- Розпізнавання (/ocr)

Автентифікація здійснюється через Passkey (WebAuthn) та одноразові посилання (Magic Link) із бекендом BP Tracker FastAPI. Для доступу потрібні права адміністратора (`is_admin: true`).

## Локальна розробка

Встановлення залежностей:
```bash
npm install
```

Запуск сервера розробки Vite із проксі `/api`:
```bash
npm run dev
```

За замовчуванням `/api` проксується на `https://api2-bptracker-dev.home.vn.ua` (налаштовується змінною `VITE_API_PROXY_TARGET`).

Перевірка типів та збірка:
```bash
npm run type-check
npm run build
```

## Запуск у контейнері

Збірка та запуск через Docker Compose:
```bash
docker compose up -d
```
Панель доступна за адресою `http://localhost:8095` (або за портом `$ADMIN_PORT`).

Або пряма збірка та запуск через Docker:
```bash
docker build -t bpt-admin .
docker run -d -p 8095:80 -e API_URL=https://api2-bptracker-dev.home.vn.ua bpt-admin
```
