<script setup lang="ts">
import { computed } from 'vue';
import type { Measurement } from '../types/api';
import { getZone } from '../composables/useZone';
import { useConfirm } from '../composables/useConfirm';

const { confirm } = useConfirm();

const props = defineProps<{
  items: Measurement[];
  loading: boolean;
  showDelete?: boolean;
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
      else
        label = d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });

      map.set(key, { label, items: [] });
    }
    map.get(key)!.items.push(item);
  }

  return Array.from(map.values());
});

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function handleDelete(id: string) {
  const ok = await confirm('Видалити цей запис?', {
    confirmText: 'Видалити',
    cancelText: 'Скасувати',
  });
  if (ok) emit('delete', id);
}
</script>

<template>
  <div class="list-wrap">
    <div v-if="loading && items.length === 0" class="state-msg">Завантаження...</div>

    <template v-else>
      <template v-for="group in grouped" :key="group.label">
        <div class="day-header">{{ group.label }}</div>

        <div
          v-for="m in group.items"
          :key="m.id"
          class="measurement-row"
        >
          <div
            class="zone-bar"
            :style="{ background: getZone(m.sys, m.dia).color }"
          />
          <div class="row-main">
            <div class="row-time">{{ formatTime(m.recordedAt) }}</div>
            <div class="row-bp">
              <span class="bp-val">{{ m.sys }}/{{ m.dia }}</span>
              <span class="bp-unit">мм рт.ст.</span>
            </div>
          </div>
          <div class="row-right">
            <div
              class="zone-badge"
              :style="{
                color: getZone(m.sys, m.dia).color,
                background: getZone(m.sys, m.dia).bg,
              }"
            >
              {{ getZone(m.sys, m.dia).label }}
            </div>
            <div class="row-pulse">♡ {{ m.pulse }} уд/хв</div>
          </div>
          <button
            v-if="showDelete"
            class="delete-btn"
            title="Видалити"
            aria-label="Видалити вимірювання"
            @click="handleDelete(m.id)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path
                d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
              />
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
  padding: 18px;
  color: var(--color-text-muted);
  font-size: 13px;
}

.day-header {
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 10px 0 2px;
  margin-top: 4px;

  &:first-of-type {
    margin-top: 0;
    padding-top: 0;
  }
}

.measurement-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border);

  &:last-of-type {
    border-bottom: none;
  }
}

.zone-bar {
  width: 3px;
  height: 36px;
  border-radius: 2px;
  flex-shrink: 0;
}

.row-main {
  flex: 1;
  min-width: 0;
}

.row-time {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-bottom: 2px;
}

.row-bp {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.bp-val {
  font-size: 20px;
  font-weight: 600;
  font-family: var(--font-mono);
  color: var(--color-text);
}

.bp-unit {
  font-size: 11px;
  color: var(--color-text-muted);
}

.row-right {
  text-align: right;
  flex-shrink: 0;
}

.zone-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 10px;
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
}

.row-pulse {
  font-size: 11px;
  color: var(--color-text-muted);
}

.delete-btn {
  color: var(--color-text-muted);
  opacity: 0.35;
  flex-shrink: 0;
  min-width: 32px;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    opacity 0.15s,
    color 0.15s;

  &:hover {
    color: var(--color-danger);
    opacity: 1;
  }
}
</style>
