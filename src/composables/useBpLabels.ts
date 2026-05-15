import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { BpClass } from '../utils/bp';

export function useBpLabels() {
  const { t } = useI18n();
  return computed<Record<BpClass, string>>(() => ({
    optimal: t('bp.classes.optimal'),
    normal:  t('bp.classes.normal'),
    stage1:  t('bp.classes.stage1'),
    stage2:  t('bp.classes.stage2'),
  }));
}
