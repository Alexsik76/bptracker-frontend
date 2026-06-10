<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSchemaStore } from '../../stores/schemas';
import { useReminderStore } from '../../stores/reminders';
import RxStatusTag from '../../components/meds/RxStatusTag.vue';
import RxSwitch from '../../components/meds/RxSwitch.vue';

const router = useRouter();
const schemaStore = useSchemaStore();
const reminderStore = useReminderStore();

const active = computed(() => schemaStore.active);
const others = computed(() => schemaStore.items.filter((s) => !s.isActive));

onMounted(() => {
  if (!schemaStore.items.length) schemaStore.fetchSchemas();
  reminderStore.init();
});

function getPeriodNameTranslation(name: any): string {
  const key = String(name).toLowerCase();
  if (key === 'morning') return 'Ранок';
  if (key === 'day' || key === 'afternoon') return 'День';
  if (key === 'evening') return 'Вечір';
  if (key === 'night') return 'Ніч';
  return String(name);
}

function getReportStatus(periodName: any): 'Confirmed' | 'Missed' | 'Pending' {
  const report = reminderStore.todayReports.find(
    (r) => r.period.toLowerCase() === String(periodName).toLowerCase()
  );
  return report ? report.status : 'Pending';
}

async function handleConfirmIntake(periodName: string) {
  await reminderStore.confirm(periodName);
}

function fmtShort(iso: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`;
}

function countMeds(schema: typeof schemaStore.items[number]): number {
  if (!schema.scheduleDocument) return 0;
  return Object.values(schema.scheduleDocument).reduce((n, arr) => n + arr.length, 0);
}

function pluralMeds(n: number): string {
  const t = n % 10, h = n % 100;
  if (t === 1 && h !== 11) return 'препарат';
  if (t >= 2 && t <= 4 && (h < 12 || h > 14)) return 'препарати';
  return 'препаратів';
}

function activePeriods(schema: typeof schemaStore.items[number]): string[] {
  if (!schema.scheduleDocument) return [];
  const order = ['Morning', 'Day', 'Evening', 'Night', 'Afternoon'];
  return order.filter((k) => schema.scheduleDocument![k]?.length);
}

const PERIOD_ICONS: Record<string, string> = {
  Morning: 'morning', Day: 'day', Afternoon: 'day', Evening: 'evening', Night: 'evening',
};

async function handleActivate(id: string) {
  await schemaStore.activate(id);
}
</script>

<template>
  <div class="meds-screen">
    <header class="rx-topbar">
      <div>
        <h1 class="rx-topbar__title">Ліки</h1>
        <p class="rx-topbar__sub">Ваші призначення</p>
      </div>
      <button class="rx-scan-btn" @click="router.push({ name: 'measurement-local' })">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 8V6a2 2 0 0 1 2-2h2"/><path d="M16 4h2a2 2 0 0 1 2 2v2"/>
          <path d="M20 16v2a2 2 0 0 1-2 2h-2"/><path d="M8 20H6a2 2 0 0 1-2-2v-2"/>
          <line x1="4" y1="12" x2="20" y2="12"/>
        </svg>
        <span>Скан</span>
      </button>
    </header>

    <div class="rx-scroll">
      <!-- Today's medication intake reminders -->
      <div v-if="reminderStore.activeTemplate" class="rx-section-label">
        <span>{{ $t('schema.reminders.todayTitle') }}</span>
      </div>

      <div v-if="reminderStore.activeTemplate" class="rx-card today-reminders-card">
        <div class="today-reminders-list">
          <div
            v-for="(config, periodName) in reminderStore.activeTemplate.periods"
            :key="periodName"
            class="today-reminder-row"
          >
            <div class="reminder-period-info">
              <span class="reminder-period-name">{{ getPeriodNameTranslation(periodName) }}</span>
              <span class="reminder-period-time">({{ config.time }})</span>
              <div class="reminder-meds">{{ config.meds.join(', ') }}</div>
            </div>
            <div class="reminder-status-action">
              <span v-if="getReportStatus(periodName) === 'Confirmed'" class="status-badge status-confirmed">
                ✓ {{ $t('schema.reminders.confirmed') }}
              </span>
              <span v-else-if="getReportStatus(periodName) === 'Missed'" class="status-badge status-missed">
                ✗ {{ $t('schema.reminders.missed') }}
              </span>
              <button
                v-else
                class="confirm-btn rx-btn-primary"
                @click.stop="handleConfirmIntake(String(periodName))"
              >
                {{ $t('schema.reminders.confirmBtn') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="rx-section-label">
        <span>Активне призначення</span>
      </div>

      <article v-if="active" class="rx-card rx-card--active" @click="router.push(`/meds/${active.id}`)">
        <div class="rx-card__top">
          <div class="rx-card__doctor">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="7.5" r="3.5"/><path d="M5 20.5a7 7 0 0 1 14 0"/>
              <path d="M12 11v2"/><path d="M10.5 12.5h3"/>
            </svg>
            <span>{{ active.doctor || '—' }}</span>
          </div>
          <RxStatusTag :active="true" />
        </div>

        <div class="rx-card__meta">
          <span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4.5" width="18" height="16" rx="2.5"/><line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="8" y1="2.5" x2="8" y2="6"/><line x1="16" y1="2.5" x2="16" y2="6"/>
            </svg>
            {{ fmtShort(active.prescribedOn) }}
          </span>
          <span class="rx-dotsep" />
          <span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="8.5" width="18" height="7" rx="3.5"/><line x1="12" y1="8.5" x2="12" y2="15.5"/>
            </svg>
            {{ countMeds(active) }} {{ pluralMeds(countMeds(active)) }}
          </span>
        </div>

        <div class="rx-active-chips">
          <span v-for="k in activePeriods(active)" :key="k" class="rx-chip">
            <svg v-if="PERIOD_ICONS[k] === 'morning'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 18a5 5 0 0 0-10 0"/><line x1="2" y1="18" x2="22" y2="18"/>
              <line x1="12" y1="3" x2="12" y2="6"/><polyline points="9 9 12 6 15 9"/>
            </svg>
            <svg v-else-if="PERIOD_ICONS[k] === 'day'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="4.2"/>
              <line x1="12" y1="2.5" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="21.5"/>
              <line x1="2.5" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="21.5" y2="12"/>
            </svg>
            <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>
            </svg>
            {{ active.scheduleDocument?.[k]?.length }}
          </span>
        </div>

        <div class="rx-card__foot">
          <span class="rx-card__detail-link">
            Деталі
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </span>
          <button
            class="rx-iconbtn rx-iconbtn--soft"
            aria-label="Редагувати"
            @click.stop="router.push(`/meds/${active.id}/edit`)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
            </svg>
          </button>
        </div>
      </article>

      <div v-else class="rx-no-active">Немає активного призначення</div>

      <div class="rx-section-label rx-section-label--between">
        <span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="4.5" rx="1.2"/><path d="M5 8.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8.5"/>
            <line x1="10" y1="12" x2="14" y2="12"/>
          </svg>
          Інші призначення
        </span>
        <span class="rx-count-pill">{{ others.length }}</span>
      </div>

      <div class="rx-list">
        <article
          v-for="schema in others"
          :key="schema.id"
          class="rx-row"
          @click="router.push(`/meds/${schema.id}`)"
        >
          <div class="rx-row__main">
            <div class="rx-row__doctor">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="7.5" r="3.5"/><path d="M5 20.5a7 7 0 0 1 14 0"/>
                <path d="M12 11v2"/><path d="M10.5 12.5h3"/>
              </svg>
              {{ schema.doctor || '—' }}
            </div>
            <div class="rx-row__meta">
              {{ fmtShort(schema.prescribedOn) }}
              <span class="rx-dotsep" />
              {{ countMeds(schema) }} {{ pluralMeds(countMeds(schema)) }}
            </div>
          </div>
          <div class="rx-row__actions" @click.stop>
            <RxSwitch
              :model-value="false"
              size="sm"
              @update:model-value="handleActivate(schema.id)"
            />
            <button
              class="rx-iconbtn"
              aria-label="Редагувати"
              @click.stop="router.push(`/meds/${schema.id}/edit`)"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
              </svg>
            </button>
          </div>
        </article>
      </div>
    </div>

    <div class="rx-fab-bar">
      <button class="rx-btn-primary rx-btn-primary--big" @click="router.push('/meds/new')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Нове призначення
      </button>
    </div>
  </div>
</template>

<style scoped>
.meds-screen {
  display: flex;
  flex-direction: column;
  min-height: 100svh;
  background: var(--rx-body);
  font-family: 'Manrope', system-ui, sans-serif;
  color: var(--rx-text);
}

.rx-topbar {
  flex: none;
  padding: 14px 20px 10px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.rx-topbar__title {
  margin: 0;
  font-size: 27px;
  font-weight: 800;
  letter-spacing: -0.4px;
}

.rx-topbar__sub {
  margin: 2px 0 0;
  color: var(--rx-dim);
  font-size: 13.5px;
  font-weight: 500;
}

.rx-scan-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 15px 9px 13px;
  border-radius: 13px;
  background: linear-gradient(160deg, var(--rx-green1), var(--rx-green2));
  color: #04210f;
  font-weight: 800;
  font-size: 14px;
  box-shadow: 0 6px 18px rgba(20, 170, 90, 0.32);
  border: none;
  cursor: pointer;
}

.rx-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 6px 18px 18px;

  &::-webkit-scrollbar { width: 0; }
}

.rx-section-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--rx-dim);
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 12px 4px 9px;

  & span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }
}

.rx-section-label--between {
  padding-top: 18px;
}

.rx-count-pill {
  background: var(--rx-card2);
  color: var(--rx-dim);
  border-radius: 20px;
  padding: 1px 9px;
  font-size: 12px;
  text-transform: none;
  letter-spacing: 0;
}

.rx-card {
  background: var(--rx-card);
  border: 1px solid var(--rx-line);
  border-radius: var(--rx-r);
  padding: 16px;
  cursor: pointer;
}

.rx-card--active {
  border: 1.5px solid var(--rx-accent-bd);
  background: linear-gradient(180deg, rgba(141, 140, 245, 0.10), rgba(141, 140, 245, 0.02) 60%, transparent), var(--rx-card);
  box-shadow: var(--rx-shadow-active);
}

.rx-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.rx-card__doctor {
  display: flex;
  align-items: center;
  gap: 9px;
  font-weight: 800;
  font-size: 17px;
  letter-spacing: -0.2px;
  min-width: 0;
  color: var(--rx-accent2);

  & span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--rx-text);
  }
}

.rx-card__meta {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--rx-dim);
  font-size: 13px;
  font-weight: 600;
  margin-top: 9px;

  & span {
    display: inline-flex;
    align-items: center;
    gap: 5px;

    & svg { color: var(--rx-faint); }
  }
}

.rx-dotsep {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--rx-faint);
  flex: none;
}

.rx-active-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 14px;
}

.rx-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--rx-accent-bg);
  color: var(--rx-accent2);
  border-radius: 9px;
  padding: 5px 8px;
  font-size: 13px;
  font-weight: 800;
}

.rx-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
  padding-top: 13px;
  border-top: 1px solid var(--rx-line);
}

.rx-card__detail-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--rx-accent2);
  font-weight: 700;
  font-size: 14px;
}

.rx-no-active {
  color: var(--rx-dim);
  text-align: center;
  padding: 22px;
  border: 1px dashed var(--rx-line2);
  border-radius: var(--rx-r);
  font-size: 14px;
}

.rx-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rx-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--rx-card);
  border: 1px solid var(--rx-line);
  border-radius: 15px;
  padding: 13px 12px 13px 15px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;

  &:active { background: var(--rx-card2); }
}

.rx-row__main {
  flex: 1;
  min-width: 0;
}

.rx-row__doctor {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 15.5px;
  color: #d6d9e4;

  & svg { color: var(--rx-faint); flex: none; }
}

.rx-row__meta {
  color: var(--rx-dim);
  font-size: 12.5px;
  font-weight: 500;
  margin-top: 4px;
  padding-left: 24px;
  display: flex;
  align-items: center;
  gap: 7px;
}

.rx-row__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: none;
}

.rx-iconbtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  color: var(--rx-dim);
  transition: background 0.15s, color 0.15s;
  background: none;
  border: none;
  cursor: pointer;

  &:active { background: var(--rx-card2); color: var(--rx-text); }
}

.rx-iconbtn--soft {
  background: var(--rx-accent-bg);
  color: var(--rx-accent2);

  &:active { background: rgba(141, 140, 245, 0.22); }
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
  white-space: nowrap;
  box-shadow: var(--rx-shadow-btn);
  border: none;
  cursor: pointer;
  font-family: 'Manrope', system-ui, sans-serif;

  &:disabled { opacity: 0.4; box-shadow: none; }
}

.rx-btn-primary--big {
  height: 54px;
  font-size: 16px;
}

.today-reminders-card {
  margin-bottom: 16px;
  border: 1.5px solid var(--rx-accent-bd);
  background: linear-gradient(180deg, rgba(141, 140, 245, 0.05), transparent), var(--rx-card);
}

.today-reminders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.today-reminder-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--rx-line);
}

.today-reminder-row:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.reminder-period-info {
  flex: 1;
  min-width: 0;
}

.reminder-period-name {
  font-weight: 800;
  font-size: 15px;
  color: var(--rx-accent2);
}

.reminder-period-time {
  font-size: 13px;
  color: var(--rx-dim);
  margin-left: 5px;
  font-weight: 600;
}

.reminder-meds {
  font-size: 13px;
  color: var(--rx-text);
  margin-top: 3px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reminder-status-action {
  flex: none;
  margin-left: 10px;
}

.status-badge {
  font-size: 13.5px;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
}

.status-confirmed {
  background: rgba(20, 170, 90, 0.15);
  color: var(--rx-green2);
}

.status-missed {
  background: rgba(231, 107, 125, 0.15);
  color: var(--rx-danger);
}

.confirm-btn {
  height: 34px !important;
  font-size: 13.5px !important;
  padding: 0 12px;
  border-radius: 9px;
}
</style>
