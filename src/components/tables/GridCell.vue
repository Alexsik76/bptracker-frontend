<script setup lang="ts">
import { computed } from 'vue';
import type { ColumnMetadata } from '../../services/adminTables';
import {
  formatCellValue,
  truncate,
  formatIdOrUuid,
  parseFk,
  getFullCellTooltip,
} from '../../utils/cellFormat';

const props = defineProps<{
  value: unknown;
  column: ColumnMetadata;
}>();

const fkInfo = computed(() => parseFk(props.column.foreign_key));
const isNull = computed(() => props.value === null || props.value === undefined);
</script>

<template>
  <!-- Null value -->
  <span v-if="isNull" class="cell-null muted mono">null</span>

  <!-- Foreign key link -->
  <router-link
    v-else-if="column.foreign_key && fkInfo"
    :to="{
      path: `/tables/${fkInfo.table}`,
      query: { filter: `${fkInfo.column}:${value}` },
    }"
    class="badge b-link"
    :title="`Open in ${fkInfo.table}`"
    @click.stop
  >
    {{ truncate(String(value), 25) }}
  </router-link>

  <!-- Boolean badge -->
  <span
    v-else-if="column.type === 'boolean'"
    :class="['badge', value ? 'b-ok' : '']"
  >
    {{ value ? '✓ yes' : '× no' }}
  </span>

  <!-- ID / UUID (shortened, full in tooltip) -->
  <span
    v-else-if="column.type === 'uuid' || column.name === 'id'"
    class="cell-id mono muted"
    :title="String(value)"
  >
    {{ formatIdOrUuid(value) }}
  </span>

  <!-- Integer / Number -->
  <span
    v-else-if="column.type === 'integer' || column.type === 'number'"
    class="cell-num mono"
    :title="getFullCellTooltip(value, column.type)"
  >
    {{ formatCellValue(value, column.type) }}
  </span>

  <!-- Date / Datetime -->
  <span
    v-else-if="column.type === 'date' || column.type === 'datetime'"
    class="cell-date mono"
    :title="getFullCellTooltip(value, column.type)"
  >
    {{ formatCellValue(value, column.type) }}
  </span>

  <!-- Default / Text / JSON / Enum -->
  <span
    v-else
    class="cell-text"
    :title="getFullCellTooltip(value, column.type)"
  >
    {{ truncate(formatCellValue(value, column.type), 45) }}
  </span>
</template>

<style scoped>
.cell-null {
  font-size: var(--bpt-fs-label);
}

.cell-id {
  display: inline-block;
  white-space: nowrap;
  font-size: var(--bpt-fs-mono);
}

.cell-num {
  display: inline-block;
  white-space: nowrap;
}

.cell-date {
  display: inline-block;
  white-space: nowrap;
}

.cell-text {
  display: inline-block;
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
  white-space: nowrap;
}
</style>
