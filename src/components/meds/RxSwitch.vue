<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean;
  size?: 'sm' | 'md';
}>();

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();

function toggle(e: Event) {
  e.stopPropagation();
  emit('update:modelValue', !props.modelValue);
}
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :class="['rx-switch', modelValue && 'rx-switch--on', size === 'sm' && 'rx-switch--sm']"
    @click="toggle"
  >
    <span class="rx-switch__knob" />
  </button>
</template>

<style scoped>
.rx-switch {
  width: 46px;
  height: 27px;
  border-radius: 20px;
  background: #2a3042;
  padding: 3px;
  display: flex;
  transition: background 0.2s;
  flex: none;
  cursor: pointer;
}

.rx-switch__knob {
  width: 21px;
  height: 21px;
  border-radius: 50%;
  background: #9aa0b3;
  transition: transform 0.2s, background 0.2s;
}

.rx-switch--on {
  background: linear-gradient(160deg, var(--rx-accent2), var(--rx-accent));

  & .rx-switch__knob {
    transform: translateX(19px);
    background: #fff;
  }
}

.rx-switch--sm {
  width: 40px;
  height: 23px;
  padding: 3px;

  & .rx-switch__knob {
    width: 17px;
    height: 17px;
  }

  &.rx-switch--on .rx-switch__knob {
    transform: translateX(17px);
  }
}
</style>
