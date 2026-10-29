<script setup lang="ts">
import { computed } from 'vue';
import type { UsageGroupBy, UsageStatItem } from '../services/adminActivity';
import { useActivityQuery } from '../composables/useActivityQuery';
import PeriodPicker from '../components/activity/PeriodPicker.vue';
import UsersOverview from '../components/activity/UsersOverview.vue';
import UsageStats from '../components/activity/UsageStats.vue';

const GROUPS: UsageGroupBy[] = ['user', 'module', 'client', 'day', 'route'];

const { str, patch, period, customFrom, customTo, range, setPeriod } = useActivityQuery();

const groupBy = computed<UsageGroupBy>(() => {
  const g = str('group') as UsageGroupBy | undefined;
  return g && GROUPS.includes(g) ? g : 'user';
});
const userId = computed(() => str('user_id'));
const userLabel = computed(() => str('user_label') || userId.value);
const module = computed(() => str('module'));

function filterUser(item: UsageStatItem) {
  patch({ user_id: item.key, user_label: item.label });
}

function filterModule(item: UsageStatItem) {
  patch({ module: item.key });
}
</script>

<template>
  <div class="stats-view">
    <h1 class="view-title">Statistics</h1>

    <UsersOverview />

    <div class="usage-filters">
      <PeriodPicker
        :period="period"
        :from="customFrom"
        :to="customTo"
        @update:period="setPeriod"
        @update:from="patch({ from: $event })"
        @update:to="patch({ to: $event })"
      />

      <div v-if="userId || module" class="active-chips">
        <span v-if="userId" class="chip">
          <span>user: {{ userLabel }}</span>
          <button type="button" aria-label="Remove user filter" @click="patch({ user_id: null, user_label: null })">
            <svg class="i i-s" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </span>
        <span v-if="module" class="chip">
          <span>module: {{ module }}</span>
          <button type="button" aria-label="Remove module filter" @click="patch({ module: null })">
            <svg class="i i-s" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </span>
      </div>
    </div>

    <UsageStats
      :range="range"
      :group-by="groupBy"
      :user-id="userId"
      :module="module"
      @update:group-by="patch({ group: $event === 'user' ? null : $event })"
      @filter-user="filterUser"
      @filter-module="filterModule"
    />
  </div>
</template>

<style scoped>
.stats-view {
  display: flex;
  flex-direction: column;
  gap: var(--bpt-sp-4);
  min-width: 0;
}

.view-title {
  font-size: var(--bpt-fs-title-page);
  line-height: var(--bpt-lh-title-page);
  font-weight: 500;
}

.usage-filters {
  display: flex;
  align-items: flex-end;
  gap: var(--bpt-sp-4);
  flex-wrap: wrap;
}

.active-chips {
  display: flex;
  align-items: center;
  gap: var(--bpt-sp-2);
  flex-wrap: wrap;
  min-height: var(--bpt-h-control);
}
</style>
