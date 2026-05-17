import { ref } from 'vue';

const pending = ref<Blob | null>(null);

export function usePendingPhoto() {
  function set(blob: Blob) {
    pending.value = blob;
  }

  function take(): Blob | null {
    const v = pending.value;
    pending.value = null;
    return v;
  }

  return { set, take };
}
