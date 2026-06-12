<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { MedicationEntry } from '../../types/api';

const props = defineProps<{
  scheduleDocument: Record<string, MedicationEntry[]> | null;
}>();

const { t } = useI18n();

const PERIOD_ORDER = ['Morning', 'Day', 'Evening', 'Night', 'Afternoon'] as const;

const activePeriods = computed(() => {
  if (!props.scheduleDocument) return [];
  return PERIOD_ORDER.filter(
    (k) => props.scheduleDocument![k]?.length,
  );
});
</script>

<template>
  <div v-if="!activePeriods.length" class="empty-sched">{{ t('schema.empty') }}</div>
  <div v-else class="sched">
    <div v-for="key in activePeriods" :key="key" class="sched-block">
      <div class="sched-head">
        <svg v-if="key === 'Morning'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 18a5 5 0 0 0-10 0"/><line x1="2" y1="18" x2="22" y2="18"/>
          <line x1="12" y1="3" x2="12" y2="6"/><line x1="5" y1="6" x2="6.8" y2="7.8"/><line x1="19" y1="6" x2="17.2" y2="7.8"/>
          <polyline points="9 9 12 6 15 9"/>
        </svg>
        <svg v-else-if="key === 'Day' || key === 'Afternoon'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4.2"/>
          <line x1="12" y1="2.5" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="21.5"/>
          <line x1="2.5" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="21.5" y2="12"/>
          <line x1="5.5" y1="5.5" x2="7.2" y2="7.2"/><line x1="16.8" y1="16.8" x2="18.5" y2="18.5"/>
          <line x1="18.5" y1="5.5" x2="16.8" y2="7.2"/><line x1="7.2" y1="16.8" x2="5.5" y2="18.5"/>
        </svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>
        </svg>
        <span>{{ t('schema.' + key.toLowerCase()) }}</span>
      </div>
      <div class="sched-lines">
        <div v-for="(med, i) in scheduleDocument![key]" :key="i" class="medline">
          <span class="medline-name">{{ med.Medicine }}</span>
          <span class="medline-arrow">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <line x1="4" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/>
            </svg>
          </span>
          <span class="medline-dose">{{ med.Amount }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.empty-sched {
  color: var(--rx-faint);
  font-size: 13.5px;
  padding: 4px 0;
}

.sched {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sched-head {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--rx-accent2);
  font-weight: 800;
  font-size: 12px;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  margin-bottom: 7px;

  & svg {
    color: var(--rx-accent2);
    flex: none;
  }
}

.sched-lines {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.medline {
  display: flex;
  align-items: center;
  gap: 9px;
}

.medline-name {
  font-weight: 600;
  font-size: 15px;
  color: var(--rx-text);
}

.medline-arrow {
  color: var(--rx-faint);
  display: inline-flex;
  flex: 1;
  justify-content: flex-end;
  opacity: 0.5;
}

.medline-dose {
  font-weight: 800;
  color: var(--rx-accent2);
  font-size: 15px;
  min-width: 30px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
