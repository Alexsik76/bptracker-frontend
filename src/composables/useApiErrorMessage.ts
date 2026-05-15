import { useI18n } from 'vue-i18n';
import { isApiError } from '../utils/apiError';

export function useApiErrorMessage() {
  const { t } = useI18n();

  function toMessage(err: unknown, fallbackKey = 'errors.unknown'): string {
    if (isApiError(err)) {
      return t(`errors.${err.code}`);
    }
    return t(fallbackKey);
  }

  return { toMessage };
}
