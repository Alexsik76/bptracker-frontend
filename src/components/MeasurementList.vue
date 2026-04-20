<script setup lang="ts">
import { computed } from 'vue';
import type { Measurement } from '../types/api';
import { classifyBP, BP_CLASS_COLOR } from '../utils/bp';

const props = defineProps<{
  items: Measurement[];
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: 'delete', id: string): void;
}>();

interface Group {
  label: string;
  items: Measurement[];
}

const grouped = computed((): Group[] => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayMs = now.getTime();
  const yesterdayMs = todayMs - 86400000;

  const map = new Map<string, Group>();

  for (const item of props.items) {
    const d = new Date(item.recordedAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

    if (!map.has(key)) {
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dt = dayStart.getTime();

      let label: string;
      if (dt === todayMs) label = 'Сьогодні';
      else if (dt === yesterdayMs) label = 'Вчора';
      else label = d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });

      map.set(key, { label, items: [] });
    }
    map.get(key)!.items.push(item);
  }

  return Array.from(map.values());
});

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
}

function bpColor(sys: number, dia: number) {
  return BP_CLASS_COLOR[classifyBP(sys, dia)];
}

function handleDelete(id: string) {
  if (confirm('Видалити цей запис?')) {
    emit('delete', id);
  }
}
</script>

<template>
  <div class="list-wrap">
    <div v-if="loading && items.length === 0" class="state-msg">Завантаження...</div>

    <template v-else>
      <!-- Column headers (desktop only) -->
      <div class="col-headers">
        <span>Час</span>
        <span>Тиск, мм рт.ст.</span>
        <span>Пульс, уд/хв</span>
        <span></span>
      </div>

      <template v-for="group in grouped" :key="group.label">
        <div class="day-header">{{ group.label }}</div>

        <div
          v-for="m in group.items"
          :key="m.id"
          class="measurement-row"
        >
          <div class="bp-dot" :style="{ background: bpColor(m.sys, m.dia) }"></div>
          <div class="col-time">{{ formatTime(m.recordedAt) }}</div>
          <div class="col-pressure" :style="{ color: bpColor(m.sys, m.dia) }">
            <span class="val">{{ m.sys }}</span>
            <span class="sep">/</span>
            <span class="val">{{ m.dia }}</span>
          </div>
          <div class="col-pulse">{{ m.pulse }}</div>
          <button @click="handleDelete(m.id)" class="delete-btn" title="Видалити">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.list-wrap {
  overflow-x: hidden;
}

.state-msg {
  text-align: center;
  padding: var(--space-8);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

/* ── Column headers (desktop) ── */
.col-headers {
  display: none;

  @media (min-width: 480px) {
    display: grid;
    grid-template-columns: 52px 1fr 80px 32px;
    gap: var(--space-3);
    padding: 0 var(--space-3) var(--space-2);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }
}

/* ── Day header ── */
.day-header {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: var(--space-3) 0 var(--space-2);
  margin-top: var(--space-2);

  &:first-of-type {
    margin-top: 0;
  }
}

/* ── Measurement row ── */
.measurement-row {
  display: grid;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  transition: background 0.15s;

  /* Mobile: card-style 2×2 grid */
  grid-template-columns: 4px 1fr auto 32px;
  grid-template-rows: auto auto;

  &:hover {
    background: var(--color-bg);
  }

  /* Desktop: single row */
  @media (min-width: 480px) {
    grid-template-columns: 4px 52px 1fr 80px 32px;
    grid-template-rows: auto;
  }
}

.bp-dot {
  width: 4px;
  border-radius: 2px;
  /* Mobile: span both rows */
  grid-row: 1 / 3;
  align-self: stretch;
  min-height: 36px;

  @media (min-width: 480px) {
    grid-row: auto;
    min-height: 20px;
  }
}

/* Time */
.col-time {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  /* Mobile: row 1, col 2 */
  grid-column: 2;
  grid-row: 1;

  @media (min-width: 480px) {
    grid-column: auto;
    grid-row: auto;
  }
}

/* Pressure */
.col-pressure {
  font-weight: 700;
  font-size: var(--text-lg);
  /* Mobile: row 2, col 2 */
  grid-column: 2;
  grid-row: 2;

  @media (min-width: 480px) {
    grid-column: auto;
    grid-row: auto;
  }

  & .val {
    font-variant-numeric: tabular-nums;
  }

  & .sep {
    margin: 0 1px;
    opacity: 0.5;
    font-weight: 400;
  }
}

/* Pulse */
.col-pulse {
  font-size: var(--text-base);
  font-weight: 500;
  text-align: right;
  /* Mobile: rows 1-2, col 3 */
  grid-column: 3;
  grid-row: 1 / 3;
  align-self: center;

  @media (min-width: 480px) {
    grid-column: auto;
    grid-row: auto;
  }
}

/* Delete button */
.delete-btn {
  color: var(--color-text-muted);
  opacity: 0.4;
  transition: opacity 0.2s, color 0.2s;
  /* Mobile: row 1, col 4 */
  grid-column: 4;
  grid-row: 1;
  justify-self: end;
  align-self: start;

  @media (min-width: 480px) {
    grid-column: auto;
    grid-row: auto;
    align-self: center;
  }

  &:hover {
    color: var(--color-danger);
    opacity: 1;
  }
}
</style>
