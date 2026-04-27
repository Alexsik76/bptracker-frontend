import { ref } from 'vue'
import { useApi } from './useApi'

export function useExport() {
  const api = useApi()
  const isExporting = ref(false)

  async function handleExport() {
    if (!confirm('Надіслати CSV з усіма вимірюваннями на ваш email?')) return
    isExporting.value = true
    try {
      await api.exportCsv()
      alert('Експорт надіслано на ваш email!')
    } catch (err: any) {
      alert(err.message || 'Помилка при експорті. Перевірте налаштування email.')
    } finally {
      isExporting.value = false
    }
  }

  return { isExporting, handleExport }
}
