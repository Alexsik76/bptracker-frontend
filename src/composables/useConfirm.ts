import { ref } from 'vue';

interface ConfirmOptions {
  confirmText?: string;
  cancelText?: string;
}

interface ConfirmState {
  message: string;
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
}

const state = ref<ConfirmState | null>(null);

export function useConfirm() {
  function confirm(message: string, options: ConfirmOptions = {}): Promise<boolean> {
    return new Promise((resolve) => {
      state.value = { message, options, resolve };
    });
  }

  function respond(value: boolean) {
    state.value?.resolve(value);
    state.value = null;
  }

  return { state, confirm, respond };
}
