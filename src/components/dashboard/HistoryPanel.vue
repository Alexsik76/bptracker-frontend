<script setup lang="ts">
import { useRouter } from 'vue-router'
import MeasurementList from '../MeasurementList.vue'
import { useExport } from '../../composables/useExport'
import type { Measurement } from '../../types/api'

interface Props {
  measurements: Measurement[]
  loading: boolean
}
defineProps<Props>()
defineEmits<{ delete: [id: string] }>()

const router = useRouter()
const { isExporting, handleExport } = useExport()
</script>

<template>
  <div class="panel">
    <div class="panel-head">
      <h2>Історія</h2>
    </div>

    <div v-if="!loading && measurements.length === 0" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
      </svg>
      <p>Ще немає жодного вимірювання</p>
      <button @click="router.push({ name: 'measurement-new' })" class="btn-primary-sm">
        Додати перший замір
      </button>
    </div>

    <MeasurementList
      v-else
      :items="measurements"
      :loading="loading"
      @delete="$emit('delete', $event)"
    />

    <div class="export-row">
      <button @click="handleExport" :disabled="isExporting" class="btn-outline">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
        {{ isExporting ? 'Надсилання...' : 'Отримати CSV на email' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.panel {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);

  & h2 {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.07em;
    font-weight: 600;
  }
}

.empty-state {
  padding: var(--space-8) var(--space-4);
  text-align: center;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);

  & svg { opacity: 0.3; }
  & p { font-size: var(--text-sm); }
}

.btn-primary-sm {
  background: var(--color-primary);
  color: white;
  padding: var(--space-2) var(--space-5);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  margin-top: var(--space-2);
}

.export-row {
  margin-top: var(--space-4);
  display: flex;
  justify-content: flex-end;
}

.btn-outline {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  & .icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
}
</style>
