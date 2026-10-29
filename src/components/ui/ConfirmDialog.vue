<script setup lang="ts">
import { watch, onUnmounted } from 'vue';

const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    title: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    confirmDanger?: boolean;
    loading?: boolean;
    ariaLabelledby?: string;
  }>(),
  {
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmDanger: false,
    loading: false,
  }
);

const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen && !props.loading) {
    emit('cancel');
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
    } else {
      window.removeEventListener('keydown', handleKeyDown);
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <div v-if="isOpen" class="dialog-backdrop" @click.self="!loading && emit('cancel')">
    <div
      class="dialog card"
      role="alertdialog"
      :aria-labelledby="ariaLabelledby || 'dialog-title'"
    >
      <h3 :id="ariaLabelledby || 'dialog-title'" class="dialog-title">
        {{ title }}
      </h3>

      <div class="dialog-desc muted">
        <slot>{{ message }}</slot>
      </div>

      <div class="dialog-actions">
        <button
          type="button"
          class="btn btn-outlined btn-sm"
          :disabled="loading"
          @click="emit('cancel')"
        >
          {{ cancelText }}
        </button>
        <button
          type="button"
          :class="['btn', 'btn-sm', confirmDanger ? 'btn-danger' : 'btn-filled']"
          :disabled="loading"
          @click="emit('confirm')"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-backdrop {
  position: fixed;
  inset: 0;
  background: var(--bpt-scrim);
  display: grid;
  place-items: center;
  padding: var(--bpt-sp-4);
  z-index: var(--bpt-z-dialog);
}

.dialog {
  width: 100%;
  max-width: 420px;
  background: var(--md-sys-color-surface-container-high);
  border: 1px solid var(--md-sys-color-outline-variant);
  padding: var(--bpt-sp-6);
  box-shadow: var(--bpt-shadow-overlay);
  display: flex;
  flex-direction: column;
  gap: var(--bpt-sp-3);
}

.dialog-title {
  font-size: var(--bpt-fs-title);
  line-height: var(--bpt-lh-title);
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
}

.dialog-desc {
  font-size: var(--bpt-fs-body);
  line-height: var(--bpt-lh-body);
}

:deep(.dialog-strong) {
  color: var(--md-sys-color-on-surface);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--bpt-sp-2);
  margin-top: var(--bpt-sp-3);
}
</style>
