<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import type { TableMetadata, ColumnMetadata } from '../../services/adminTables';
import { adminTablesApi } from '../../services/adminTables';
import { ApiError } from '../../services/api';
import {
  toDatetimeLocal,
  fromDatetimeLocal,
} from '../../utils/datetime';
import ConfirmDialog from '../ui/ConfirmDialog.vue';
import FieldInput from './FieldInput.vue';

const props = defineProps<{
  table: TableMetadata;
  row: Record<string, unknown> | null;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved', updatedRow: Record<string, unknown>): void;
  (e: 'deleted', pk: Record<string, unknown>): void;
}>();

const isCreate = computed(() => props.row === null);

// Form state
const formValues = ref<Record<string, unknown>>({});
const datetimeLocalMap = ref<Record<string, string>>({});
const jsonStringMap = ref<Record<string, string>>({});
const isNullMap = ref<Record<string, boolean>>({});

// Keep copy of initial values to determine what changed
const initialValues = ref<Record<string, unknown>>({});

// Error and loading states
const formError = ref<string | null>(null);
const saving = ref(false);
const deleting = ref(false);

// Dialogs
const showUnsavedDialog = ref(false);
const showDeleteConfirm = ref(false);
const copiedPk = ref(false);

// Primary key display
const pkDisplay = computed(() => {
  if (isCreate.value) return 'New record';
  const parts = props.table.primary_key.map((k) => `${props.row?.[k] ?? ''}`);
  return parts.join(' · ') || 'Record';
});

function initForm() {
  formError.value = null;
  formValues.value = {};
  datetimeLocalMap.value = {};
  jsonStringMap.value = {};
  isNullMap.value = {};
  initialValues.value = {};

  for (const col of props.table.columns) {
    if (isCreate.value) {
      // Create mode defaults
      if (col.nullable) {
        isNullMap.value[col.name] = true;
        formValues.value[col.name] = null;
      } else if (col.type === 'boolean') {
        formValues.value[col.name] = false;
        isNullMap.value[col.name] = false;
      } else if (col.type === 'integer' || col.type === 'number') {
        formValues.value[col.name] = 0;
        isNullMap.value[col.name] = false;
      } else if (col.type === 'enum' && col.enum_values && col.enum_values.length > 0) {
        formValues.value[col.name] = col.enum_values[0];
        isNullMap.value[col.name] = false;
      } else {
        formValues.value[col.name] = '';
        isNullMap.value[col.name] = false;
      }
      initialValues.value[col.name] = formValues.value[col.name];
    } else {
      // Edit mode: populate from props.row
      const val = props.row?.[col.name];
      initialValues.value[col.name] = val;

      if (val === null || val === undefined) {
        isNullMap.value[col.name] = true;
        formValues.value[col.name] = null;
        if (col.type === 'datetime') {
          datetimeLocalMap.value[col.name] = '';
        } else if (col.type === 'json') {
          jsonStringMap.value[col.name] = '';
        }
      } else {
        isNullMap.value[col.name] = false;
        formValues.value[col.name] = val;

        if (col.type === 'datetime') {
          datetimeLocalMap.value[col.name] = toDatetimeLocal(String(val));
        } else if (col.type === 'json') {
          jsonStringMap.value[col.name] =
            typeof val === 'string' ? val : JSON.stringify(val, null, 2);
        }
      }
    }
  }
}

watch(
  () => [props.isOpen, props.row, props.table],
  ([open]) => {
    if (open) {
      initForm();
    }
  },
  { immediate: true }
);

function handleNullToggle(colName: string) {
  if (isNullMap.value[colName]) {
    formValues.value[colName] = null;
  } else {
    // Reset to default value when unchecking null
    const col = props.table.columns.find((c) => c.name === colName);
    if (!col) return;
    if (col.type === 'boolean') {
      formValues.value[colName] = false;
    } else if (col.type === 'integer' || col.type === 'number') {
      formValues.value[colName] = 0;
    } else if (col.type === 'datetime') {
      datetimeLocalMap.value[colName] = toDatetimeLocal(new Date().toISOString());
      formValues.value[colName] = fromDatetimeLocal(datetimeLocalMap.value[colName]);
    } else if (col.type === 'json') {
      jsonStringMap.value[colName] = '{}';
      formValues.value[colName] = {};
    } else if (col.type === 'enum' && col.enum_values && col.enum_values.length > 0) {
      formValues.value[colName] = col.enum_values[0];
    } else {
      formValues.value[colName] = '';
    }
  }
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    copiedPk.value = true;
    setTimeout(() => {
      copiedPk.value = false;
    }, 2000);
  });
}

function buildValueForColumn(col: ColumnMetadata): unknown {
  if (isNullMap.value[col.name]) {
    return null;
  }

  if (col.type === 'datetime') {
    const localVal = datetimeLocalMap.value[col.name];
    if (!localVal) return col.nullable ? null : '';
    return fromDatetimeLocal(localVal);
  }

  if (col.type === 'json') {
    const raw = jsonStringMap.value[col.name];
    if (!raw || raw.trim() === '') {
      return col.nullable ? null : {};
    }
    try {
      return JSON.parse(raw);
    } catch (e: unknown) {
      const err = e as Error;
      throw new Error(`Field "${col.name}": invalid JSON (${err.message})`);
    }
  }

  if (col.type === 'integer') {
    const v = formValues.value[col.name];
    if (v === '' || v === null || v === undefined) {
      return col.nullable ? null : 0;
    }
    const parsed = parseInt(String(v), 10);
    if (isNaN(parsed)) throw new Error(`Field "${col.name}": integer expected`);
    return parsed;
  }

  if (col.type === 'number') {
    const v = formValues.value[col.name];
    if (v === '' || v === null || v === undefined) {
      return col.nullable ? null : 0;
    }
    const parsed = parseFloat(String(v));
    if (isNaN(parsed)) throw new Error(`Field "${col.name}": number expected`);
    return parsed;
  }

  if (col.type === 'boolean') {
    return Boolean(formValues.value[col.name]);
  }

  return formValues.value[col.name];
}

const hasUnsavedChanges = computed(() => {
  for (const col of props.table.columns) {
    if (col.read_only) continue;

    const originalNull =
      initialValues.value[col.name] === null || initialValues.value[col.name] === undefined;
    const currentNull = Boolean(isNullMap.value[col.name]);

    if (originalNull !== currentNull) return true;
    if (currentNull) continue;

    if (col.type === 'datetime') {
      const origLocal = toDatetimeLocal(String(initialValues.value[col.name] ?? ''));
      if (origLocal !== (datetimeLocalMap.value[col.name] ?? '')) return true;
    } else if (col.type === 'json') {
      const origRaw =
        initialValues.value[col.name] === null || initialValues.value[col.name] === undefined
          ? ''
          : typeof initialValues.value[col.name] === 'string'
            ? (initialValues.value[col.name] as string)
            : JSON.stringify(initialValues.value[col.name], null, 2);
      if (origRaw.trim() !== (jsonStringMap.value[col.name] ?? '').trim()) return true;
    } else {
      if (formValues.value[col.name] !== initialValues.value[col.name]) return true;
    }
  }
  return false;
});

function requestClose() {
  if (hasUnsavedChanges.value) {
    showUnsavedDialog.value = true;
  } else {
    emit('close');
  }
}

function confirmDiscardChanges() {
  showUnsavedDialog.value = false;
  emit('close');
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen) {
    if (showDeleteConfirm.value) {
      showDeleteConfirm.value = false;
    } else if (showUnsavedDialog.value) {
      showUnsavedDialog.value = false;
    } else {
      requestClose();
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

async function handleSave() {
  formError.value = null;
  saving.value = true;

  try {
    if (isCreate.value) {
      // Create mode
      const values: Record<string, unknown> = {};
      for (const col of props.table.columns) {
        if (col.read_only) continue;
        values[col.name] = buildValueForColumn(col);
      }

      const res = await adminTablesApi.createRow(props.table.name, values);
      emit('saved', res);
      emit('close');
    } else {
      // Edit mode: send only changed values
      const changedValues: Record<string, unknown> = {};

      for (const col of props.table.columns) {
        if (col.read_only) continue;

        const originalNull =
          initialValues.value[col.name] === null || initialValues.value[col.name] === undefined;
        const currentNull = Boolean(isNullMap.value[col.name]);

        if (originalNull !== currentNull) {
          changedValues[col.name] = currentNull ? null : buildValueForColumn(col);
          continue;
        }

        if (currentNull) continue;

        const currentBuilt = buildValueForColumn(col);
        const originalVal = initialValues.value[col.name];

        if (col.type === 'json') {
          if (JSON.stringify(currentBuilt) !== JSON.stringify(originalVal)) {
            changedValues[col.name] = currentBuilt;
          }
        } else if (col.type === 'datetime') {
          const origIso = originalVal ? new Date(String(originalVal)).toISOString() : '';
          const curIso = currentBuilt ? new Date(String(currentBuilt)).toISOString() : '';
          if (origIso !== curIso) {
            changedValues[col.name] = currentBuilt;
          }
        } else if (currentBuilt !== originalVal) {
          changedValues[col.name] = currentBuilt;
        }
      }

      if (Object.keys(changedValues).length === 0) {
        emit('close');
        return;
      }

      // Build primary key
      const pk: Record<string, unknown> = {};
      for (const pkCol of props.table.primary_key) {
        pk[pkCol] = initialValues.value[pkCol];
      }

      const res = await adminTablesApi.updateRow(props.table.name, pk, changedValues);
      emit('saved', res);
      emit('close');
    }
  } catch (err: unknown) {
    console.error('Save error:', err);
    if (err instanceof ApiError) {
      if (err.status === 409) {
        formError.value = `Conflict (409): ${err.message || 'unique or foreign key constraint violation'}`;
      } else {
        formError.value = `Server error (${err.status}): ${err.message}`;
      }
    } else if (err instanceof Error) {
      formError.value = err.message;
    } else {
      formError.value = 'Unknown error while saving';
    }
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  formError.value = null;
  deleting.value = true;

  try {
    const pk: Record<string, unknown> = {};
    for (const pkCol of props.table.primary_key) {
      pk[pkCol] = initialValues.value[pkCol];
    }

    await adminTablesApi.deleteRow(props.table.name, pk);
    showDeleteConfirm.value = false;
    emit('deleted', pk);
    emit('close');
  } catch (err: unknown) {
    console.error('Delete error:', err);
    showDeleteConfirm.value = false;
    if (err instanceof ApiError) {
      if (err.status === 409) {
        formError.value = `Conflict (409): cannot delete record due to related data (${err.message})`;
      } else {
        formError.value = `Server error (${err.status}): ${err.message}`;
      }
    } else if (err instanceof Error) {
      formError.value = err.message;
    } else {
      formError.value = 'Unknown error while deleting';
    }
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <div v-if="isOpen">
    <!-- Backdrop -->
    <div class="sheet-backdrop" @click="requestClose"></div>

    <!-- Side Sheet -->
    <aside
      class="side-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-title"
    >
      <!-- Header -->
      <div class="sheet-header">
        <div class="header-titles">
          <div class="label">{{ table.name }} · {{ isCreate ? 'new record' : 'edit' }}</div>
          <h2 id="sheet-title" class="sheet-title mono">{{ pkDisplay }}</h2>
        </div>

        <button
          v-if="!isCreate"
          type="button"
          class="btn btn-icon btn-sm"
          :title="copiedPk ? 'Copied!' : 'Copy identifier'"
          aria-label="Copy identifier"
          @click="copyToClipboard(pkDisplay)"
        >
          <svg class="i i-s" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5a1 1 0 011-1h10" />
          </svg>
        </button>

        <button
          type="button"
          class="btn btn-icon btn-sm"
          aria-label="Close panel"
          @click="requestClose"
        >
          <svg class="i i-s" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Server Error Banner -->
      <div v-if="formError" class="error-banner" role="alert">
        <svg class="i i-s" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{{ formError }}</span>
      </div>

      <!-- Form Content -->
      <form class="sheet-form" @submit.prevent="handleSave">
        <FieldInput
          v-for="col in table.columns"
          :key="col.name"
          :column="col"
          v-model="formValues[col.name]"
          v-model:is-null="isNullMap[col.name]"
          v-model:datetime-local="datetimeLocalMap[col.name]"
          v-model:json-string="jsonStringMap[col.name]"
          :is-create="isCreate"
          :initial-value="initialValues[col.name]"
          :disabled="saving || deleting"
          @null-toggle="handleNullToggle(col.name)"
          @close-panel="emit('close')"
        />
      </form>

      <!-- Footer -->
      <div class="sheet-footer">
        <button
          v-if="!isCreate && table.can_delete"
          type="button"
          class="btn btn-danger"
          :disabled="saving || deleting"
          @click="showDeleteConfirm = true"
        >
          <svg class="i i-s" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
          </svg>
          <span>Delete</span>
        </button>

        <span class="sheet-footer-spacer"></span>

        <button
          type="button"
          class="btn btn-outlined"
          :disabled="saving || deleting"
          @click="requestClose"
        >
          Cancel
        </button>

        <button
          v-if="isCreate ? table.can_create : table.can_update"
          type="button"
          class="btn btn-filled"
          :disabled="saving || deleting"
          @click="handleSave"
        >
          <span>{{ saving ? 'Saving...' : isCreate ? 'Create' : 'Save' }}</span>
        </button>
      </div>
    </aside>

    <!-- Confirmation Dialog: Unsaved Changes -->
    <ConfirmDialog
      :is-open="showUnsavedDialog"
      title="Unsaved Changes"
      confirm-text="Discard changes and close"
      cancel-text="Continue editing"
      confirm-danger
      @confirm="confirmDiscardChanges"
      @cancel="showUnsavedDialog = false"
    >
      You have unsaved changes. If you close the panel, all changes will be lost.
    </ConfirmDialog>

    <!-- Confirmation Dialog: Delete Row -->
    <ConfirmDialog
      :is-open="showDeleteConfirm"
      title="Delete record?"
      :confirm-text="deleting ? 'Deleting...' : 'Yes, delete'"
      cancel-text="Cancel"
      confirm-danger
      :loading="deleting"
      @confirm="handleDelete"
      @cancel="showDeleteConfirm = false"
    >
      Are you sure you want to delete record <strong class="mono dialog-strong">{{ pkDisplay }}</strong> from table "{{ table.name }}"? This action cannot be undone.
    </ConfirmDialog>
  </div>
</template>

<style scoped>
.sheet-backdrop {
  position: fixed;
  inset: 0;
  background: var(--bpt-scrim);
  z-index: var(--bpt-z-side-sheet);
  animation: fadeIn var(--bpt-dur-short) ease;
}

.side-sheet {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(var(--bpt-w-side-sheet), 100%);
  background: var(--md-sys-color-surface-container-high);
  border-radius: var(--bpt-radius-card) 0 0 var(--bpt-radius-card);
  box-shadow: var(--bpt-shadow-overlay);
  display: flex;
  flex-direction: column;
  z-index: calc(var(--bpt-z-side-sheet) + 1);
  animation: slideInRight var(--bpt-dur-medium) var(--bpt-ease-standard);
}

.sheet-header {
  display: flex;
  align-items: center;
  gap: var(--bpt-sp-2);
  padding: var(--bpt-sp-4) var(--bpt-sp-3) var(--bpt-sp-3) var(--bpt-sp-6);
  flex-shrink: 0;
}

.header-titles {
  flex: 1;
  min-width: 0;
}

.sheet-title {
  font-size: var(--bpt-fs-title);
  line-height: var(--bpt-lh-title);
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: var(--bpt-sp-2);
  margin: 0 var(--bpt-sp-6) var(--bpt-sp-3);
  padding: var(--bpt-sp-2) var(--bpt-sp-3);
  border-radius: var(--bpt-radius-control);
  background: var(--md-sys-color-error-container);
  border: 1px solid var(--md-sys-color-error);
  color: var(--md-sys-color-on-error-container);
  font-size: var(--bpt-fs-cell);
}

.sheet-form {
  flex: 1;
  overflow-y: auto;
  padding: var(--bpt-sp-2) var(--bpt-sp-6) var(--bpt-sp-5);
  display: flex;
  flex-direction: column;
  gap: var(--bpt-sp-4);
}

.sheet-footer {
  display: flex;
  gap: var(--bpt-sp-2);
  padding: var(--bpt-sp-3) var(--bpt-sp-6) var(--bpt-sp-5);
  flex-wrap: wrap;
  align-items: center;
  border-top: 1px solid var(--md-sys-color-outline-variant);
  flex-shrink: 0;
}

.sheet-footer-spacer {
  flex: 1;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
</style>
