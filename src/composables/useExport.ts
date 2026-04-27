import { ref } from 'vue';
import { useApi } from './useApi';
import { useToast } from './useToast';
import { useConfirm } from './useConfirm';

export function useExport() {
  const api = useApi();
  const toast = useToast();
  const { confirm } = useConfirm();
  const isExporting = ref(false);

  async function handleExport() {
    const ok = await confirm('Надіслати CSV з усіма вимірюваннями на ваш email?', {
      confirmText: 'Надіслати',
      cancelText: 'Скасувати',
    });
    if (!ok) return;
    isExporting.value = true;
    try {
      await api.exportCsv();
      toast.success('Готово — CSV надіслано на ваш email!');
    } catch (err: any) {
      toast.error(err.message || 'Помилка при експорті. Перевірте налаштування email.');
    } finally {
      isExporting.value = false;
    }
  }

  return { isExporting, handleExport };
}
