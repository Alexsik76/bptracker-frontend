<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useSchemaStore } from '../../stores/schemas';
import RxStatusTag from '../../components/meds/RxStatusTag.vue';
import RxScheduleView from '../../components/meds/RxScheduleView.vue';

const router = useRouter();
const route = useRoute();
const schemaStore = useSchemaStore();

const rx = computed(() => schemaStore.items.find((s) => s.id === route.params.id));

const MONTHS = ['січ.','лют.','бер.','квіт.','трав.','черв.','лип.','серп.','вер.','жовт.','лист.','груд.'];

function fmtLong(iso: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function countMeds(): number {
  if (!rx.value?.scheduleDocument) return 0;
  return Object.values(rx.value.scheduleDocument).reduce((n, arr) => n + arr.length, 0);
}

function activePeriodCount(): number {
  if (!rx.value?.scheduleDocument) return 0;
  return Object.values(rx.value.scheduleDocument).filter((arr) => arr.length > 0).length;
}

function pluralMeds(n: number): string {
  const t = n % 10, h = n % 100;
  if (t === 1 && h !== 11) return 'препарат';
  if (t >= 2 && t <= 4 && (h < 12 || h > 14)) return 'препарати';
  return 'препаратів';
}

async function handleActivate() {
  if (!rx.value) return;
  await schemaStore.activate(rx.value.id);
}

</script>

<template>
  <div v-if="rx" class="detail-screen">
    <header class="rx-pagebar">
      <button class="rx-iconbtn" aria-label="Назад" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <span class="rx-pagebar__title">Призначення</span>
      <button class="rx-iconbtn" aria-label="Редагувати" @click="router.push(`/meds/${rx.id}/edit`)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
        </svg>
      </button>
    </header>

    <div class="rx-scroll">
      <div class="detail-hero">
        <RxStatusTag :active="rx.isActive" />
        <h2>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="7.5" r="3.5"/><path d="M5 20.5a7 7 0 0 1 14 0"/>
            <path d="M12 11v2"/><path d="M10.5 12.5h3"/>
          </svg>
          {{ rx.doctor || '—' }}
        </h2>
        <div class="detail-date">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4.5" width="18" height="16" rx="2.5"/><line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="8" y1="2.5" x2="8" y2="6"/><line x1="16" y1="2.5" x2="16" y2="6"/>
          </svg>
          Призначено {{ fmtLong(rx.prescribedOn) }}
        </div>
      </div>

      <div class="detail-counts">
        <div class="detail-cnt">
          <b>{{ countMeds() }}</b>
          <span>{{ pluralMeds(countMeds()) }}</span>
        </div>
        <div class="detail-cnt">
          <b>{{ activePeriodCount() }}</b>
          <span>прийоми / день</span>
        </div>
      </div>

      <div class="detail-card">
        <RxScheduleView :schedule-document="rx.scheduleDocument" />
      </div>

    </div>

    <div class="rx-fab-bar">
      <button v-if="rx.isActive" class="rx-btn-active-state" disabled>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Активне зараз
      </button>
      <button v-else class="rx-btn-primary" @click="handleActivate">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3v9"/><path d="M6.4 6.4a8 8 0 1 0 11.2 0"/>
        </svg>
        Зробити активним
      </button>
    </div>
  </div>

  <div v-else class="detail-screen detail-screen--loading">
    <header class="rx-pagebar">
      <button class="rx-iconbtn" aria-label="Назад" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <span class="rx-pagebar__title">Призначення</span>
      <span style="width:38px" />
    </header>
    <div class="rx-scroll" style="display:flex;align-items:center;justify-content:center;color:var(--rx-dim);font-size:14px;">
      Завантаження…
    </div>
  </div>
</template>

<style scoped>
.detail-screen {
  display: flex;
  flex-direction: column;
  min-height: 100svh;
  background: var(--rx-body);
  font-family: 'Manrope', system-ui, sans-serif;
  color: var(--rx-text);
}

.detail-screen--loading {
  min-height: 100svh;
}

.rx-pagebar {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--rx-line);
}

.rx-pagebar__title {
  font-weight: 800;
  font-size: 17px;
  letter-spacing: -0.2px;
}

.rx-iconbtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  color: var(--rx-dim);
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;

  &:active { background: var(--rx-card2); color: var(--rx-text); }
}

.rx-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 6px 18px 18px;

  &::-webkit-scrollbar { width: 0; }
}

.detail-hero {
  padding: 8px 4px 4px;
}

.detail-hero h2 {
  margin: 12px 0 0;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.4px;
  display: flex;
  align-items: center;
  gap: 10px;

  & svg { color: var(--rx-accent2); }
}

.detail-date {
  margin-top: 8px;
  color: var(--rx-dim);
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 7px;

  & svg { color: var(--rx-faint); }
}

.detail-counts {
  display: flex;
  gap: 10px;
  margin: 18px 0 16px;
}

.detail-cnt {
  flex: 1;
  background: var(--rx-card);
  border: 1px solid var(--rx-line);
  border-radius: 14px;
  padding: 14px 16px;

  & b {
    display: block;
    font-size: 24px;
    font-weight: 800;
    color: var(--rx-accent2);
  }

  & span {
    color: var(--rx-dim);
    font-size: 12.5px;
    font-weight: 600;
  }
}

.detail-card {
  background: var(--rx-card);
  border: 1px solid var(--rx-line);
  border-radius: var(--rx-r);
  padding: 16px;
}

.link-danger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  margin-top: 18px;
  padding: 13px;
  color: var(--rx-danger);
  font-weight: 700;
  font-size: 14.5px;
  border-radius: 13px;
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'Manrope', system-ui, sans-serif;

  &:active { background: rgba(231, 107, 125, 0.10); }
}

.rx-fab-bar {
  flex: none;
  padding: 12px 18px calc(12px + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, transparent, var(--rx-body) 30%);
  border-top: 1px solid var(--rx-line);
  display: flex;
  gap: 10px;
}

.rx-btn-primary {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 52px;
  border-radius: 15px;
  font-weight: 800;
  font-size: 15.5px;
  color: #0b0a1c;
  background: linear-gradient(160deg, var(--rx-accent2), var(--rx-accent));
  box-shadow: var(--rx-shadow-btn);
  border: none;
  cursor: pointer;
  font-family: 'Manrope', system-ui, sans-serif;
}

.rx-btn-active-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 52px;
  border-radius: 15px;
  font-weight: 800;
  font-size: 15px;
  color: var(--rx-accent2);
  background: var(--rx-accent-bg);
  border: 1px solid var(--rx-accent-bd);
  cursor: not-allowed;
  font-family: 'Manrope', system-ui, sans-serif;
}
</style>
