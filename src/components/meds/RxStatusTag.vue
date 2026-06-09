<script setup lang="ts">
defineProps<{ active: boolean }>();
</script>

<template>
  <span :class="['rx-tag', active ? 'rx-tag--on' : 'rx-tag--off']">
    <span class="rx-tag__dot" />
    {{ active ? 'Активна' : 'Неактивна' }}
  </span>
</template>

<style scoped>
.rx-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 20px;
  padding: 4px 11px 4px 9px;
  font-size: 12px;
  font-weight: 800;
  flex: none;
}

.rx-tag__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.rx-tag--on {
  background: rgba(141, 140, 245, 0.16);
  color: var(--rx-accent2);

  & .rx-tag__dot {
    background: var(--rx-accent2);
    box-shadow: 0 0 8px var(--rx-accent2);
  }
}

.rx-tag--off {
  background: var(--rx-card2);
  color: var(--rx-dim);

  & .rx-tag__dot {
    background: var(--rx-faint);
  }
}
</style>
