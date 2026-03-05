import type { ProductStep } from './itemStepNavigation';

export function buildStepUrlAfterCreate(itemId: string, step: ProductStep = 2): string {
  return `/admin/items/${itemId}?step=${step}`;
}

export function shouldBlockEnterSubmit(key: string, targetTagName?: string): boolean {
  if (key !== 'Enter') return false;
  if ((targetTagName || '').toLowerCase() === 'textarea') return false;
  return true;
}

export interface FinishMediaState {
  lastImageUploadFailed: boolean;
  missingImages: boolean;
  missingSpin360: boolean;
}

export interface FinishDecision {
  proceed: boolean;
  warnings: string[];
  fallbackStep?: ProductStep;
}

export function evaluateFinishDecision(
  state: FinishMediaState,
  userConfirmed: boolean,
): FinishDecision {
  const warnings: string[] = [];
  if (state.lastImageUploadFailed) warnings.push('- Có lỗi upload ảnh ở lần lưu gần nhất.');
  if (state.missingImages) warnings.push('- Sản phẩm chưa có ảnh.');
  if (state.missingSpin360) warnings.push('- Sản phẩm chưa có ảnh 360.');

  if (warnings.length === 0) {
    return { proceed: true, warnings };
  }

  if (userConfirmed) {
    return { proceed: true, warnings };
  }

  if (state.lastImageUploadFailed || state.missingImages) {
    return { proceed: false, warnings, fallbackStep: 2 };
  }

  return { proceed: false, warnings, fallbackStep: 3 };
}
