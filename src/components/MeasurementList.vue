<script setup lang="ts">
import type { Measurement } from '../types/api';

defineProps<{
  items: Measurement[];
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: 'delete', id: string): void;
}>();

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function handleDelete(id: string) {
  if (confirm('Ви впевнені, що хочете видалити цей замір?')) {
    emit('delete', id);
  }
}
</script>

<template>
  <div class="list-container">
    <div v-if="loading && items.length === 0" class="loading">Завантаження...</div>
    
    <table v-else class="measurements-table">
      <thead>
        <tr>
          <th>Дата</th>
          <th>Тиск</th>
          <th class="text-right">Пульс</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="m in items" :key="m.id">
          <td class="date-cell">{{ formatDate(m.recordedAt) }}</td>
          <td class="pressure-cell">
            <span class="value">{{ m.sys }}/{{ m.dia }}</span>
            <span class="unit">мм рт.ст.</span>
          </td>
          <td class="pulse-cell text-right">
            <span class="value">{{ m.pulse }}</span>
            <span class="unit">уд/хв</span>
          </td>
          <td class="actions-cell">
            <button @click="handleDelete(m.id)" class="delete-btn" title="Видалити">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="items.length === 0 && !loading" class="empty-state">
      Поки що немає жодного запису. Натисніть "+ Додати", щоб почати.
    </div>
  </div>
</template>

<style scoped>
.list-container {
  overflow-x: auto;
}

.measurements-table {
  width: 100%;
  border-collapse: collapse;
  
  & th {
    text-align: left;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    padding-bottom: var(--space-2);
    font-weight: 600;
    text-transform: uppercase;
  }

  & td {
    padding: var(--space-3) 0;
    border-bottom: 1px solid var(--color-border);
  }

  & tr:last-child td {
    border-bottom: none;
  }
}

.date-cell {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  white-space: nowrap;
}

.pressure-cell {
  & .value {
    font-weight: bold;
    font-size: var(--text-lg);
    margin-right: var(--space-1);
  }
  & .unit {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }
}

.pulse-cell {
  & .value {
    font-weight: 500;
    margin-right: var(--space-1);
  }
  & .unit {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }
}

.text-right {
  text-align: right;
}

.actions-cell {
  text-align: right;
}

.delete-btn {
  color: var(--color-danger);
  opacity: 0.5;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
}

.loading, .empty-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}
</style>
