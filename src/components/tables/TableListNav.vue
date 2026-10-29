<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { TableMetadata } from '../../services/adminTables';

const props = defineProps<{
  tables: TableMetadata[];
  currentTableName: string;
  loading?: boolean;
  error?: string | null;
}>();

interface TableGroup {
  name: string;
  tables: TableMetadata[];
}

const STORAGE_KEY = 'bpt_collapsed_table_groups';

function loadCollapsedGroups(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    }
  } catch (e) {
    // ignore localStorage errors
  }
  return new Set();
}

const collapsedGroups = ref<Set<string>>(loadCollapsedGroups());

function saveCollapsedGroups() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(collapsedGroups.value)));
  } catch (e) {
    // ignore localStorage errors
  }
}

// Group tables by module in server order, with ungrouped tables in a final group "other"
const groupedTables = computed<TableGroup[]>(() => {
  const groupsMap = new Map<string, TableMetadata[]>();
  const otherTables: TableMetadata[] = [];

  for (const tbl of props.tables) {
    const m = tbl.module?.trim();
    if (m) {
      if (!groupsMap.has(m)) {
        groupsMap.set(m, []);
      }
      groupsMap.get(m)!.push(tbl);
    } else {
      otherTables.push(tbl);
    }
  }

  const result: TableGroup[] = [];
  for (const [name, tblList] of groupsMap.entries()) {
    result.push({ name, tables: tblList });
  }

  if (otherTables.length > 0) {
    result.push({ name: 'other', tables: otherTables });
  }

  return result;
});

// Group name that contains the currently active table
const activeGroupName = computed(() => {
  if (!props.currentTableName) return null;
  const currentTbl = props.tables.find((t) => t.name === props.currentTableName);
  if (!currentTbl) return null;
  const m = currentTbl.module?.trim();
  return m || 'other';
});

// Ensure the active table's group is always expanded
watch(
  activeGroupName,
  (activeGroup) => {
    if (activeGroup && collapsedGroups.value.has(activeGroup)) {
      collapsedGroups.value.delete(activeGroup);
      saveCollapsedGroups();
    }
  },
  { immediate: true }
);

function isCollapsed(groupName: string): boolean {
  if (groupName === activeGroupName.value) {
    return false;
  }
  return collapsedGroups.value.has(groupName);
}

function toggleGroup(groupName: string) {
  if (groupName === activeGroupName.value) {
    // Active group is always expanded
    return;
  }
  if (collapsedGroups.value.has(groupName)) {
    collapsedGroups.value.delete(groupName);
  } else {
    collapsedGroups.value.add(groupName);
  }
  saveCollapsedGroups();
}
</script>

<template>
  <nav class="table-list-card card" aria-label="Database tables">
    <div class="table-list-title label">Database tables</div>

    <div v-if="loading" class="table-list-status muted">
      Loading...
    </div>

    <div v-else-if="error" class="table-list-status error">
      {{ error }}
    </div>

    <div v-else class="groups-container">
      <div
        v-for="group in groupedTables"
        :key="group.name"
        class="table-group"
      >
        <!-- Group Header Button -->
        <button
          type="button"
          class="group-header-btn"
          :aria-expanded="!isCollapsed(group.name)"
          @click="toggleGroup(group.name)"
        >
          <svg
            class="i i-s chevron-icon"
            :class="{ collapsed: isCollapsed(group.name) }"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
          <span class="group-title mono">{{ group.name }}</span>
          <span class="group-count muted">({{ group.tables.length }})</span>
        </button>

        <!-- Group items -->
        <div v-show="!isCollapsed(group.name)" class="group-items">
          <router-link
            v-for="tbl in group.tables"
            :key="tbl.name"
            :to="{ path: `/tables/${tbl.name}` }"
            class="table-link mono"
            :class="{ 'table-link-active': tbl.name === currentTableName }"
            :aria-current="tbl.name === currentTableName ? 'page' : undefined"
          >
            <span class="table-name-text mono">{{ tbl.name }}</span>
          </router-link>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.table-list-card {
  flex: 1 1 200px;
  max-width: var(--bpt-w-sidebar);
  padding: var(--bpt-sp-3) var(--bpt-sp-2);
  display: flex;
  flex-direction: column;
  gap: var(--bpt-sp-1);
  flex-shrink: 0;
  border: 1px solid var(--md-sys-color-outline-variant);
}

.table-list-title {
  padding: var(--bpt-sp-1) var(--bpt-sp-3) var(--bpt-sp-2);
}

.table-list-status {
  padding: var(--bpt-sp-2) var(--bpt-sp-3);
  font-size: var(--bpt-fs-cell);
}

.table-list-status.error {
  color: var(--md-sys-color-error);
}

.groups-container {
  display: flex;
  flex-direction: column;
  gap: var(--bpt-sp-2);
}

.table-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.group-header-btn {
  all: unset;
  display: flex;
  align-items: center;
  gap: var(--bpt-sp-1);
  padding: var(--bpt-sp-1) var(--bpt-sp-2);
  cursor: pointer;
  border-radius: var(--bpt-radius-badge);
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--bpt-fs-label);
  line-height: var(--bpt-lh-label);
  font-weight: 500;
  user-select: none;
  box-sizing: border-box;
}

.group-header-btn:hover {
  color: var(--md-sys-color-on-surface);
  background: var(--bpt-state-hover);
}

.group-header-btn:focus-visible {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: 2px;
}

.group-title {
  font-weight: 600;
  font-family: var(--bpt-font-mono);
}

.group-count {
  font-size: var(--bpt-fs-label);
}

.chevron-icon {
  transition: transform var(--bpt-dur-short) var(--bpt-ease-standard);
}

.chevron-icon.collapsed {
  transform: rotate(-90deg);
}

.group-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: var(--bpt-sp-2);
}

.table-link {
  display: flex;
  align-items: center;
  min-height: 36px;
  padding: var(--bpt-sp-2) var(--bpt-sp-3);
  border-radius: var(--bpt-radius-full);
  color: var(--md-sys-color-on-surface-variant);
  text-decoration: none;
  font-family: var(--bpt-font-mono);
  font-size: var(--bpt-fs-mono);
  line-height: var(--bpt-lh-mono);
  word-break: break-all;
  white-space: normal;
  transition: background-color var(--bpt-dur-short) var(--bpt-ease-standard),
              color var(--bpt-dur-short) var(--bpt-ease-standard);
}

.table-link:hover {
  background: var(--bpt-state-hover);
  color: var(--md-sys-color-on-surface);
}

.table-link-active,
.table-link[aria-current='page'] {
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}

.table-name-text {
  white-space: normal;
  word-break: break-all;
}
</style>
