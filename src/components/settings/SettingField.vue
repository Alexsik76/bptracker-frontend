<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  adminSettingsApi,
  type AdminSetting,
  type GeminiModel,
  type SettingValue,
} from '../../services/adminSettings';
import { errorMessage, formatDateTime } from '../../utils/activityFormat';

const props = defineProps<{
  setting: AdminSetting;
  /** When set, a string setting is edited through a select over these models */
  models?: GeminiModel[] | null;
}>();

const emit = defineEmits<{
  (e: 'update', setting: AdminSetting): void;
}>();

const draft = ref<string | boolean>(toDraft(props.setting.value));
const saving = ref(false);
const resetting = ref(false);
const error = ref<string | null>(null);

function toDraft(value: SettingValue): string | boolean {
  return typeof value === 'boolean' ? value : String(value);
}

const inputId = computed(() => `setting-${props.setting.key}`);
const busy = computed(() => saving.value || resetting.value);
const dirty = computed(() => draft.value !== toDraft(props.setting.value));
const isDb = computed(() => props.setting.source === 'db');

const constraintHint = computed(() => {
  const { min, max } = props.setting.constraints;
  if (props.setting.type !== 'int') return null;
  if (min !== undefined && max !== undefined) return `${min}–${max}`;
  if (min !== undefined) return `min ${min}`;
  if (max !== undefined) return `max ${max}`;
  return null;
});

// The saved model stays selectable even when the server list does not contain it
const modelChoices = computed(() => {
  const list = props.models ?? [];
  const current = String(draft.value);
  return list.some((m) => m.name === current) || !current
    ? list
    : [{ name: current, display_name: current } as GeminiModel, ...list];
});

// Discard the draft whenever the server copy changes (save, reset, reload)
watch(
  () => props.setting,
  (s) => {
    draft.value = toDraft(s.value);
    error.value = null;
  }
);

function parseDraft(): SettingValue | null {
  if (props.setting.type === 'bool') return Boolean(draft.value);
  const text = String(draft.value).trim();
  if (props.setting.type === 'str') return text;
  if (!/^-?\d+$/.test(text)) {
    error.value = 'Enter a whole number';
    return null;
  }
  return Number(text);
}

async function save() {
  error.value = null;
  const value = parseDraft();
  if (value === null) return;
  saving.value = true;
  try {
    emit('update', await adminSettingsApi.update(props.setting.key, value));
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    saving.value = false;
  }
}

async function reset() {
  error.value = null;
  resetting.value = true;
  try {
    await adminSettingsApi.reset(props.setting.key);
    emit('update', { ...props.setting, value: props.setting.env_value, source: 'env', updated_at: null, updated_by: null });
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    resetting.value = false;
  }
}
</script>

<template>
  <div class="setting card">
    <div class="setting-head">
      <label class="setting-label" :for="inputId">{{ setting.label }}</label>
      <span :class="['badge', isDb ? 'b-db' : '']">
        {{ isDb ? 'changed in panel' : 'from stack settings' }}
      </span>
    </div>
    <span class="mono muted setting-key">{{ setting.key }}</span>

    <div class="setting-control">
      <button
        v-if="setting.type === 'bool'"
        :id="inputId"
        type="button"
        class="switch"
        role="switch"
        :aria-checked="Boolean(draft)"
        :aria-label="setting.label"
        :disabled="busy"
        @click="draft = !draft"
      ></button>

      <select
        v-else-if="models && setting.type === 'str'"
        :id="inputId"
        v-model="draft as string"
        class="input select mono"
        :disabled="busy"
      >
        <option v-for="m in modelChoices" :key="m.name" :value="m.name">
          {{ m.display_name === m.name ? m.name : `${m.display_name} (${m.name})` }}
        </option>
      </select>

      <input
        v-else
        :id="inputId"
        v-model="draft as string"
        :type="setting.type === 'int' ? 'number' : 'text'"
        :step="setting.type === 'int' ? 1 : undefined"
        :min="setting.constraints.min"
        :max="setting.constraints.max"
        class="input mono"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="error ? `${inputId}-error` : undefined"
        :disabled="busy"
        @keydown.enter="dirty && save()"
      />

      <button type="button" class="btn btn-filled btn-sm" :disabled="!dirty || busy" @click="save">
        {{ saving ? 'Saving...' : 'Save' }}
      </button>
      <button v-if="isDb" type="button" class="btn btn-outlined btn-sm" :disabled="busy" @click="reset">
        {{ resetting ? 'Resetting...' : 'Reset' }}
      </button>
      <slot name="actions" :draft="String(draft)" :busy="busy"></slot>
    </div>

    <p v-if="error" :id="`${inputId}-error`" class="setting-error" role="alert">{{ error }}</p>

    <p class="setting-meta muted">
      <span>Stack value: <span class="mono">{{ String(setting.env_value) }}</span></span>
      <span v-if="constraintHint">Allowed: <span class="mono">{{ constraintHint }}</span></span>
      <span v-if="isDb && setting.updated_at">Changed {{ formatDateTime(setting.updated_at) }}</span>
    </p>
  </div>
</template>

<style scoped>
.setting {
  display: flex;
  flex-direction: column;
  gap: var(--bpt-sp-2);
  padding: var(--bpt-sp-4);
  border: 1px solid var(--md-sys-color-outline-variant);
}

.setting-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--bpt-sp-3);
}

.setting-label {
  font-weight: 500;
}

.setting-key {
  font-size: var(--bpt-fs-label);
}

.b-db {
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}

.setting-control {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--bpt-sp-2);
}

.setting-control .input {
  flex: 1;
  max-width: var(--bpt-w-side-sheet);
}

.setting-error {
  color: var(--md-sys-color-error);
  font-size: var(--bpt-fs-cell);
  word-break: break-word;
}

.setting-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--bpt-sp-1) var(--bpt-sp-4);
  font-size: var(--bpt-fs-label);
  line-height: var(--bpt-lh-label);
}
</style>
