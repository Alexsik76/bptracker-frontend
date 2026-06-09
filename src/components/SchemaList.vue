<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { TreatmentSchema } from '../types/api';
import { useSchemaStore } from '../stores/schemas';

defineProps<{
  schemas: TreatmentSchema[];
}>();

const emit = defineEmits<{
  edit: [schema: TreatmentSchema];
}>();

const { t } = useI18n();
const schemaStore = useSchemaStore();
</script>

<template>
  <div class="schema-list">
    <div v-if="!schemas.length" class="empty">
      {{ $t('schema.noSchemas') }}
    </div>

    <div v-for="schema in schemas" :key="schema.id" class="schema-item" :class="{ active: schema.isActive }">
      <div class="schema-item-info">
        <span class="doctor-name">{{ schema.doctor || '—' }}</span>
        <span v-if="schema.prescribedOn" class="prescribed-date">{{ schema.prescribedOn }}</span>
        <span v-if="schema.isActive" class="badge-active">{{ $t('schema.activeBadge') }}</span>
      </div>

      <div class="schema-item-actions">
        <button
          v-if="!schema.isActive"
          type="button"
          class="btn-activate"
          @click="schemaStore.activate(schema.id)"
        >
          {{ $t('schema.makeActive') }}
        </button>
        <button type="button" class="btn-edit" @click="emit('edit', schema)">
          {{ $t('schema.edit') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.schema-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.empty {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  padding: var(--space-4) 0;
  text-align: center;
}

.schema-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  flex-wrap: wrap;

  &.active {
    border-color: var(--color-primary);
    background: var(--color-surface);
  }
}

.schema-item-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  min-width: 0;
}

.doctor-name {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text);
}

.prescribed-date {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.badge-active {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
}

.schema-item-actions {
  display: flex;
  gap: var(--space-2);
  flex-shrink: 0;
}

.btn-activate,
.btn-edit {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text-muted);
  transition: border-color 0.15s, color 0.15s;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
}

.btn-activate {
  color: var(--color-primary);
  border-color: color-mix(in srgb, var(--color-primary) 40%, transparent);

  &:hover {
    background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  }
}
</style>
