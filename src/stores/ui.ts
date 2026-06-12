import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUiStore = defineStore('ui', () => {
  const hasOpenedShutter = ref(false);

  function markShutterAsOpened() {
    hasOpenedShutter.value = true;
  }

  return {
    hasOpenedShutter,
    markShutterAsOpened,
  };
});
