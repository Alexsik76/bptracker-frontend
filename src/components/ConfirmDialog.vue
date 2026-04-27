<script setup lang="ts">
import { watch, useTemplateRef } from 'vue';
import { useConfirm } from '../composables/useConfirm';

const { state, respond } = useConfirm();
const dialogRef = useTemplateRef<HTMLDialogElement>('dialog');

watch(state, (val) => {
  if (val) {
    dialogRef.value?.showModal();
  } else {
    dialogRef.value?.close();
  }
});
</script>

<template>
  <dialog
    ref="dialog"
    class="confirm-dialog"
    aria-labelledby="confirm-msg"
    @cancel.prevent="respond(false)"
  >
    <p id="confirm-msg" class="confirm-msg">{{ state?.message }}</p>
    <div class="confirm-actions">
      <button class="btn-cancel" autofocus @click="respond(false)">
        {{ state?.options.cancelText ?? 'Скасувати' }}
      </button>
      <button class="btn-confirm" @click="respond(true)">
        {{ state?.options.confirmText ?? 'Підтвердити' }}
      </button>
    </div>
  </dialog>
</template>

<style scoped>
.confirm-dialog {
  border: none;
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
  background: var(--color-surface);
  color: var(--color-text);
  max-width: 360px;
  width: calc(100vw - var(--space-8));

  &::backdrop {
    background: rgba(0, 0, 0, 0.4);
  }
}

.confirm-msg {
  font-size: var(--text-base);
  margin-bottom: var(--space-6);
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}

.btn-cancel {
  padding: var(--space-2) var(--space-5);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-muted);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  cursor: pointer;

  &:hover { border-color: var(--color-text-muted); }
}

.btn-confirm {
  padding: var(--space-2) var(--space-5);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  background: var(--color-primary);
  color: white;
  cursor: pointer;

  &:hover { background: var(--color-primary-hover); }
}
</style>
