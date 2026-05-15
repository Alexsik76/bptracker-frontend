import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApi } from './useApi';
import { useToast } from './useToast';
import { useConfirm } from './useConfirm';
import { useApiErrorMessage } from './useApiErrorMessage';

export function useExport() {
  const api = useApi();
  const toast = useToast();
  const { confirm } = useConfirm();
  const { t } = useI18n();
  const { toMessage } = useApiErrorMessage();
  const isExporting = ref(false);

  async function handleExport() {
    const ok = await confirm(t('export.confirmMsg'), {
      confirmText: t('export.send'),
      cancelText: t('common.cancel'),
    });
    if (!ok) return;
    isExporting.value = true;
    try {
      await api.exportCsv();
      toast.success(t('export.success'));
    } catch (err: any) {
      toast.error(toMessage(err, 'errors.exportFailed'));
    } finally {
      isExporting.value = false;
    }
  }

  return { isExporting, handleExport };
}
