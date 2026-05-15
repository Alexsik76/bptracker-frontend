import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './styles/global.css';
import { initTheme } from './composables/useTheme';
import { i18n } from './i18n';

initTheme();

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(i18n);

document.documentElement.setAttribute('lang', i18n.global.locale.value as string);

app.mount('#app');
