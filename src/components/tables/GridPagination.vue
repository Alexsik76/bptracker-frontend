<script setup lang="ts">
import { computed } from 'vue';
import { formatNumber } from '../../utils/datetime';

const props = defineProps<{
  currentPage: number;
  totalRows: number;
  pageSize: number;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'pageChange', page: number): void;
}>();

const totalPages = computed(() => Math.max(1, Math.ceil(props.totalRows / props.pageSize)));

const paginationInfo = computed(() => {
  if (props.totalRows === 0) return '0 of 0';
  const start = (props.currentPage - 1) * props.pageSize + 1;
  const end = Math.min(props.currentPage * props.pageSize, props.totalRows);
  return `${formatNumber(start)}–${formatNumber(end)} of ${formatNumber(props.totalRows)}`;
});

function goTo(page: number) {
  if (page < 1 || page > totalPages.value || page === props.currentPage || props.loading) return;
  emit('pageChange', page);
}
</script>

<template>
  <nav class="pagination-bar" aria-label="Pagination">
    <span class="mono muted pagination-info">{{ paginationInfo }}</span>

    <span class="pagination-spacer"></span>

    <button
      type="button"
      class="btn btn-icon btn-sm"
      aria-label="Previous page"
      :disabled="currentPage <= 1 || loading"
      @click="goTo(currentPage - 1)"
    >
      <svg class="i i-s" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15 6l-6 6 6 6" />
      </svg>
    </button>

    <!-- First page -->
    <button
      v-if="currentPage > 2"
      type="button"
      class="btn btn-sm page-btn"
      :disabled="loading"
      @click="goTo(1)"
    >
      1
    </button>

    <span v-if="currentPage > 3" class="muted">…</span>

    <!-- Previous page -->
    <button
      v-if="currentPage > 1"
      type="button"
      class="btn btn-sm page-btn"
      :disabled="loading"
      @click="goTo(currentPage - 1)"
    >
      {{ currentPage - 1 }}
    </button>

    <!-- Current page -->
    <button
      type="button"
      class="btn btn-sm btn-tonal page-btn"
      aria-current="page"
    >
      {{ currentPage }}
    </button>

    <!-- Next page -->
    <button
      v-if="currentPage < totalPages"
      type="button"
      class="btn btn-sm page-btn"
      :disabled="loading"
      @click="goTo(currentPage + 1)"
    >
      {{ currentPage + 1 }}
    </button>

    <span v-if="currentPage < totalPages - 2" class="muted">…</span>

    <!-- Last page -->
    <button
      v-if="currentPage < totalPages - 1"
      type="button"
      class="btn btn-sm page-btn"
      :disabled="loading"
      @click="goTo(totalPages)"
    >
      {{ totalPages }}
    </button>

    <button
      type="button"
      class="btn btn-icon btn-sm"
      aria-label="Next page"
      :disabled="currentPage >= totalPages || loading"
      @click="goTo(currentPage + 1)"
    >
      <svg class="i i-s" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 6l6 6-6 6" />
      </svg>
    </button>
  </nav>
</template>

<style scoped>
.pagination-bar {
  display: flex;
  align-items: center;
  gap: var(--bpt-sp-2);
  padding: var(--bpt-sp-3);
  flex-wrap: wrap;
}

.pagination-info {
  font-size: var(--bpt-fs-cell);
}

.pagination-spacer {
  flex: 1;
}

.page-btn {
  width: var(--bpt-h-control-sm);
  padding: 0;
}
</style>
