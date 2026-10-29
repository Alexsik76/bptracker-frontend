<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  search: string;
  parsedFilters: Record<string, string>;
}>();

const emit = defineEmits<{
  (e: 'update:search', value: string): void;
  (e: 'search'): void;
  (e: 'clearSearch'): void;
  (e: 'removeFilter', colName: string): void;
  (e: 'clearAll'): void;
}>();

const inputElement = ref<HTMLInputElement | null>(null);

function focusInput() {
  inputElement.value?.focus();
}

defineExpose({
  focusInput,
});
</script>

<template>
  <div class="table-toolbar">
    <form class="search-wrap ig" @submit.prevent="emit('search')">
      <svg class="i i-s" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-4-4" />
      </svg>
      <input
        ref="inputElement"
        :value="search"
        aria-label="Search table"
        placeholder="Search table..."
        @input="emit('update:search', ($event.target as HTMLInputElement).value)"
      />
      <span v-if="!search" class="kbd">/</span>
      <button
        v-else
        type="button"
        class="btn-icon-clear"
        aria-label="Clear search"
        @click="emit('clearSearch')"
      >
        ✕
      </button>
    </form>

    <!-- Active filter chips -->
    <div v-if="Object.keys(parsedFilters).length > 0" class="active-chips">
      <span
        v-for="(val, col) in parsedFilters"
        :key="col"
        class="chip"
      >
        <span>{{ col }}: {{ val }}</span>
        <button
          type="button"
          :aria-label="'Remove filter ' + col"
          @click="emit('removeFilter', col as string)"
        >
          <svg class="i i-s" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </span>

      <button
        type="button"
        class="btn btn-outlined btn-sm"
        @click="emit('clearAll')"
      >
        Clear all
      </button>
    </div>
  </div>
</template>

<style scoped>
.table-toolbar {
  display: flex;
  gap: var(--bpt-sp-3);
  padding: var(--bpt-sp-3);
  align-items: center;
  flex-wrap: wrap;
}

.search-wrap {
  flex: 1 1 240px;
  max-width: 360px;
}

.btn-icon-clear {
  background: none;
  border: none;
  color: var(--md-sys-color-on-surface-variant);
  cursor: pointer;
  padding: 4px;
}

.active-chips {
  display: flex;
  align-items: center;
  gap: var(--bpt-sp-2);
  flex-wrap: wrap;
}
</style>
