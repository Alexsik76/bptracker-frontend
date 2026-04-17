# BP Tracker Frontend

A lightweight, high-performance web dashboard for tracking blood pressure and treatment schedules.

## 🛠 Tech Stack
- **Language:** Vanilla JavaScript (ES6 Modules, OOP)
- **Styling:** [UnoCSS](https://unocss.dev/) (via JIT CDN)
- **Charts:** [Chart.js](https://www.chartjs.org/)
- **Architecture:** SRP-based modular design

## 🚀 Features
- **Visual Trends:** Line charts for Systolic, Diastolic, and Pulse data.
- **Treatment Visibility:** Automatically displays active medical schedules from the backend.
- **Modern UI:** Responsive design with interactive feedback (toasts, modals).
- **No Build Step:** Works directly in any modern browser using native ES modules.

## 🌐 Deployment (GitHub Pages)

This project is configured to be deployed via GitHub Actions.

### Setup Instructions:
1. Go to your repository **Settings** > **Pages**.
2. Under **Build and deployment** > **Source**, select **GitHub Actions**.
3. Push your code to the `main` branch. The action in `.github/workflows/deploy.yml` will automatically build and deploy the frontend.

## ⚙️ Configuration
API settings can be adjusted in `config.js`:
```javascript
export const CONFIG = {
    API_BASE_URL: 'https://api-bptracker.home.vn.ua/api'
};
```
