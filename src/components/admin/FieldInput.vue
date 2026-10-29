<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ColumnMetadata } from '../../services/adminTables';
import {
  formatLocalDateTimeWithOffset,
  getBrowserUtcOffset,
} from '../../utils/datetime';
import { parseFk } from '../../utils/cellFormat';

const props = defineProps<{
  column: ColumnMetadata;
  modelValue: unknown;
  isNull: boolean;
  isCreate: boolean;
  initialValue?: unknown;
  datetimeLocal?: string;
  jsonString?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown): void;
  (e: 'update:isNull', isNull: boolean): void;
  (e: 'update:datetimeLocal', value: string): void;
  (e: 'update:jsonString', value: string): void;
  (e: 'nullToggle'): void;
  (e: 'closePanel'): void;
}>();

const browserUtcOffset = computed(() => getBrowserUtcOffset());
const copied = ref(false);

const fkInfo = computed(() => parseFk(props.column.foreign_key));

function handleNullChange(e: Event) {
  const target = e.target as HTMLInputElement;
  emit('update:isNull', target.checked);
  emit('nullToggle');
}

function copyValue() {
  if (props.modelValue === null || props.modelValue === undefined || props.modelValue === '') return;
  navigator.clipboard.writeText(String(props.modelValue)).then(() => {
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  });
}
</script>

<template>
  <div class="field">
    <div class="field-header">
      <label class="label" :for="'field-' + column.name">
        <span>{{ column.name }}</span>
        <span v-if="column.read_only" class="badge b-ro">read-only</span>
      </label>

      <!-- Nullable toggle -->
      <label v-if="column.nullable && !column.read_only" class="null-toggle">
        <input
          type="checkbox"
          class="check"
          :checked="isNull"
          @change="handleNullChange"
        />
        <span class="null-hint muted">null</span>
      </label>
    </div>

    <!-- Boolean switch -->
    <div v-if="column.type === 'boolean'" class="switch-row">
      <span class="switch-label mono">{{ column.name }}</span>
      <div class="switch-control-wrap">
        <span class="switch-state muted mono">
          {{ isNull ? 'null' : modelValue ? 'true' : 'false' }}
        </span>
        <button
          type="button"
          class="switch"
          role="switch"
          :aria-checked="Boolean(modelValue)"
          :disabled="column.read_only || isNull || disabled"
          @click="emit('update:modelValue', !modelValue)"
        ></button>
      </div>
    </div>

    <!-- Datetime input -->
    <div v-else-if="column.type === 'datetime'" class="input-wrap">
      <input
        :id="'field-' + column.name"
        type="datetime-local"
        class="input mono"
        :value="datetimeLocal"
        :disabled="column.read_only || isNull || disabled"
        :readonly="column.read_only"
        @input="emit('update:datetimeLocal', ($event.target as HTMLInputElement).value)"
      />
      <div class="helper-text muted mono">
        <span v-if="isNull">null</span>
        <span v-else-if="!isCreate && initialValue">
          Server: {{ formatLocalDateTimeWithOffset(String(initialValue)) }}
        </span>
        <span v-else>
          Local time with UTC offset ({{ browserUtcOffset }})
        </span>
      </div>
    </div>

    <!-- Date input -->
    <div v-else-if="column.type === 'date'" class="input-wrap">
      <input
        :id="'field-' + column.name"
        type="date"
        class="input mono"
        :value="(modelValue as string) || ''"
        :disabled="column.read_only || isNull || disabled"
        :readonly="column.read_only"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- JSON textarea -->
    <div v-else-if="column.type === 'json'" class="input-wrap">
      <textarea
        :id="'field-' + column.name"
        class="input mono"
        rows="5"
        :value="jsonString"
        placeholder="{}"
        :disabled="column.read_only || isNull || disabled"
        :readonly="column.read_only"
        @input="emit('update:jsonString', ($event.target as HTMLTextAreaElement).value)"
      ></textarea>
    </div>

    <!-- Long text textarea -->
    <div v-else-if="column.type === 'text'" class="input-wrap">
      <textarea
        :id="'field-' + column.name"
        class="input"
        rows="3"
        :value="(modelValue as string) || ''"
        :disabled="column.read_only || isNull || disabled"
        :readonly="column.read_only"
        @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      ></textarea>
    </div>

    <!-- Enum select -->
    <div v-else-if="column.type === 'enum'" class="input-wrap">
      <select
        :id="'field-' + column.name"
        class="input select"
        :value="modelValue"
        :disabled="column.read_only || isNull || disabled"
        @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      >
        <option v-for="opt in column.enum_values || []" :key="opt" :value="opt">
          {{ opt }}
        </option>
      </select>
    </div>

    <!-- Number / Integer input -->
    <div v-else-if="column.type === 'integer' || column.type === 'number'" class="input-wrap">
      <input
        :id="'field-' + column.name"
        type="number"
        :step="column.type === 'integer' ? '1' : 'any'"
        class="input mono"
        :value="modelValue !== null && modelValue !== undefined ? modelValue : ''"
        :disabled="column.read_only || isNull || disabled"
        :readonly="column.read_only"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- ID or UUID with copy action -->
    <div v-else-if="column.type === 'uuid' || column.name === 'id'" class="input-wrap">
      <div class="input-with-action">
        <input
          :id="'field-' + column.name"
          type="text"
          class="input mono"
          :value="(modelValue as string) || ''"
          :disabled="column.read_only || isNull || disabled"
          :readonly="column.read_only"
          @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        />
        <button
          v-if="modelValue !== null && modelValue !== undefined && modelValue !== ''"
          type="button"
          class="btn btn-icon btn-sm copy-action-btn"
          :title="copied ? 'Copied!' : 'Copy value'"
          :aria-label="'Copy ' + column.name"
          @click="copyValue"
        >
          <svg class="i i-s" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5a1 1 0 011-1h10" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Default text input -->
    <div v-else class="input-wrap">
      <input
        :id="'field-' + column.name"
        type="text"
        class="input"
        :value="(modelValue as string) || ''"
        :disabled="column.read_only || isNull || disabled"
        :readonly="column.read_only"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- Foreign key link -->
    <div v-if="column.foreign_key && fkInfo" class="fk-link-row">
      <router-link
        v-if="modelValue !== null && modelValue !== undefined && modelValue !== ''"
        :to="{
          path: `/tables/${fkInfo.table}`,
          query: { filter: `${fkInfo.column}:${modelValue}` },
        }"
        class="badge b-link"
        @click="emit('closePanel')"
      >
        <span>Go to {{ fkInfo.table }} ({{ modelValue }}) →</span>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.field-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--bpt-sp-2);
}

.null-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  user-select: none;
}

.null-hint {
  font-size: var(--bpt-fs-label);
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--bpt-sp-3);
  padding: var(--bpt-sp-3) var(--bpt-sp-4);
  border-radius: var(--bpt-radius-container);
  background: var(--md-sys-color-surface-container-highest);
}

.switch-label {
  font-weight: 500;
  font-size: var(--bpt-fs-body);
}

.switch-control-wrap {
  display: flex;
  align-items: center;
  gap: var(--bpt-sp-2);
}

.switch-state {
  font-size: var(--bpt-fs-label);
}

.input-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-with-action {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-action .input {
  padding-right: var(--bpt-h-control-sm);
}

.copy-action-btn {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
}

.helper-text {
  font-size: var(--bpt-fs-label);
}

.fk-link-row {
  margin-top: 2px;
}
</style>
