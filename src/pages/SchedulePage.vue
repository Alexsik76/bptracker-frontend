<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSchemaStore } from '../stores/schemas';
import { useReminderStore } from '../stores/reminders';
import type { TodayIntake } from '../types/api';

const router = useRouter();
const schemaStore = useSchemaStore();
const reminderStore = useReminderStore();

onMounted(() => {
  if (!schemaStore.items.length) schemaStore.fetchSchemas();
  reminderStore.init();
});

const active = computed(() => schemaStore.active);

function getPeriodNameTranslation(name: string): string {
  const key = String(name).toLowerCase();
  if (key === 'morning') return 'Ранок';
  if (key === 'day' || key === 'afternoon') return 'День';
  if (key === 'evening') return 'Вечір';
  if (key === 'night') return 'Ніч';
  return String(name);
}

function getTodayFormatted(): string {
  const d = new Date();
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
  const str = d.toLocaleDateString('uk-UA', options);
  return `Сьогодні · ${str}`;
}

function isMissed(intake: TodayIntake): boolean {
  if (intake.status === 'Confirmed') return false;
  const [hours, minutes] = intake.time.split(':').map(Number);
  const now = new Date();
  const scheduled = new Date();
  scheduled.setHours(hours, minutes, 0, 0);
  return now > scheduled;
}

function getPeriodStatusText(intake: TodayIntake): string {
  if (intake.status === 'Confirmed') {
    if (intake.timeTaken) {
      const d = new Date(intake.timeTaken);
      const hrs = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `Прийнято о ${hrs}:${mins}`;
    }
    return 'Прийнято';
  }

  const [hours, minutes] = intake.time.split(':').map(Number);
  const now = new Date();
  const scheduled = new Date();
  scheduled.setHours(hours, minutes, 0, 0);

  if (now > scheduled) {
    return 'Пропущено';
  }

  const diffMs = scheduled.getTime() - now.getTime();
  const diffHrs = Math.ceil(diffMs / (1000 * 60 * 60));
  
  if (diffHrs <= 1) {
    const diffMins = Math.ceil(diffMs / (1000 * 60));
    return `через ${diffMins} хв`;
  }
  return `через ${diffHrs} год`;
}

function fmtShort(iso: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`;
}

function countMeds(schema: typeof schemaStore.items[number]): number {
  if (!schema.scheduleDocument) return 0;
  return Object.values(schema.scheduleDocument).reduce((n, arr) => n + (Array.isArray(arr) ? arr.length : 0), 0);
}

function pluralMeds(n: number): string {
  const t = n % 10, h = n % 100;
  if (t === 1 && h !== 11) return 'препарат';
  if (t >= 2 && t <= 4 && (h < 12 || h > 14)) return 'препарати';
  return 'препаратів';
}

async function handleConfirm(period: string) {
  await reminderStore.confirm(period);
}
</script>

<template>
  <div class="schedule-page">
    <div class="schedule-scroll">
      <div class="content-pad">
        
        <!-- Header -->
        <header class="schedule-header">
          <h1 class="page-title">Розклад</h1>
          <p class="subtitle">{{ getTodayFormatted() }}</p>
        </header>

        <!-- Active prescription card linking to prescriptions -->
        <article
          v-if="active"
          class="rx-card rx-card--active"
          @click="router.push({ name: 'prescriptions' })"
        >
          <div class="rx-card-main">
            <div class="doctor-row">
              <span class="doctor-name">{{ active.doctor || 'Лікар не вказаний' }}</span>
              <span class="status-chip">● Активна</span>
            </div>
            <p class="meta-row">
              {{ fmtShort(active.prescribedOn) }} · {{ countMeds(active) }} {{ pluralMeds(countMeds(active)) }} · призначення ›
            </p>
          </div>
          <span class="arrow-icon">›</span>
        </article>

        <!-- Intake period cards (Morning, Midday, Evening...) -->
        <div class="intake-section">
          <div v-if="reminderStore.loading && (!reminderStore.todayData || !reminderStore.todayData.intakes)" class="state-center">
            <span class="state-text">{{ $t('common.loading') }}</span>
          </div>

          <template v-else-if="reminderStore.todayData && reminderStore.todayData.intakes && reminderStore.todayData.intakes.length > 0">
            <div
              v-for="intake in reminderStore.todayData.intakes"
              :key="intake.period"
              class="intake-card"
              :class="{
                'intake-card--missed': isMissed(intake) && intake.status !== 'Confirmed',
                'intake-card--confirmed': intake.status === 'Confirmed'
              }"
            >
              <div class="intake-card-header">
                <div class="intake-period-title">
                  {{ getPeriodNameTranslation(intake.period) }} · {{ intake.time }}
                </div>
                <div class="intake-status">
                  <template v-if="intake.status === 'Confirmed'">
                    <svg class="check-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#34d39e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 8.5 L6.5 12 L13 4.5"></path>
                    </svg>
                    <span class="status-confirmed-text">{{ getPeriodStatusText(intake) }}</span>
                  </template>
                  <template v-else-if="isMissed(intake)">
                    <span class="status-missed-badge">! Пропущено</span>
                  </template>
                  <template v-else>
                    <span class="status-upcoming-text">{{ getPeriodStatusText(intake) }}</span>
                  </template>
                </div>
              </div>

              <!-- List of medications -->
              <div class="intake-meds-list">
                <div
                  v-for="med in intake.meds"
                  :key="med"
                  class="intake-med-row"
                >
                  <span class="med-name">{{ med }}</span>
                  <div class="med-action">
                    <svg v-if="intake.status === 'Confirmed'" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#34d39e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 8.5 L6.5 12 L13 4.5"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Single unified button per period if not confirmed -->
              <div v-if="intake.status !== 'Confirmed'" class="card-footer">
                <button
                  class="confirm-btn"
                  @click="handleConfirm(intake.period)"
                >
                  Прийняв
                </button>
              </div>
            </div>
          </template>

          <div v-else class="empty-intakes">
            <p>Немає запланованих прийомів ліків на сьогодні.</p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.schedule-page {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  background: var(--color-bg);
}

.schedule-scroll {
  flex: 1;
  overflow-y: auto;
  padding-top: 16px;
}

.content-pad {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 16px 16px;
  max-width: 600px;
  margin: 0 auto;
}

.schedule-header {
  margin-bottom: 4px;
}

.page-title {
  font-size: 26px;
  font-weight: 800;
  color: #f2f4f7;
  margin: 0;
}

.subtitle {
  font-size: 13px;
  color: #8b93a1;
  margin: 4px 0 0;
}

/* Active prescription card layout */
.rx-card {
  background: #14162a;
  border: 1.5px solid #5b55c7;
  border-radius: 20px;
  padding: 14px 16px;
  box-shadow: 0 0 24px rgba(91, 85, 199, 0.18);
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: transform 0.1s;

  &:active {
    transform: scale(0.98);
  }
}

.rx-card-main {
  flex: 1;
  min-width: 0;
}

.doctor-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.doctor-name {
  font-size: 16px;
  font-weight: 700;
  color: #f2f4f7;
}

.status-chip {
  font-size: 11px;
  font-weight: 600;
  color: #b9b4f3;
  background: #262a4d;
  border-radius: 999px;
  padding: 3px 9px;
}

.meta-row {
  font-size: 12px;
  color: #8b93a1;
  margin: 4px 0 0;
}

.arrow-icon {
  font-size: 22px;
  color: #6f6acb;
}

/* Intake Cards */
.intake-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.intake-card {
  background: #15181d;
  border: 1px solid #21262d;
  border-radius: 20px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.intake-card--missed {
  border: 1px solid #4a2226;
  background: linear-gradient(180deg, rgba(74, 34, 38, 0.05), transparent), #15181d;
}

.intake-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.intake-period-title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1px;
  color: #7d8694;
  text-transform: uppercase;
}

.intake-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.check-icon {
  flex-shrink: 0;
}

.status-confirmed-text {
  font-size: 12px;
  font-weight: 600;
  color: #34d39e;
}

.status-missed-badge {
  font-size: 12px;
  font-weight: 600;
  color: #f2737a;
  background: #2c1517;
  border-radius: 999px;
  padding: 3px 9px;
}

.status-upcoming-text {
  font-size: 12px;
  color: #8b93a1;
}

.intake-meds-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.intake-med-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.med-name {
  font-size: 14px;
  color: #c6cbd4;
}

.med-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.card-footer {
  margin-top: 4px;
}

.confirm-btn {
  width: 100%;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  color: #15181d;
  background: #c9c5f8;
  border-radius: 999px;
  padding: 9px 16px;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s;

  &:active {
    opacity: 0.85;
  }
}

.state-center {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.state-text {
  font-size: 14px;
  color: var(--color-text-muted);
}

.empty-intakes {
  text-align: center;
  padding: 32px 16px;
  color: var(--color-text-muted);
  font-size: 14px;
}
</style>
