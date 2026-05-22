import type { ProductStep } from './itemStepNavigation';

export function buildStepUrlAfterCreate(itemId: string, step: ProductStep = 2): string {
  return `/admin/items/${itemId}?step=${step}`;
}

/** Reads `?step=` for the admin item wizard (1–5). Invalid or missing → null (caller defaults to step 1). */
export function parseProductStepFromSearchParams(searchParams: URLSearchParams): ProductStep | null {
  const raw = searchParams.get('step');
  if (raw === null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n === 1 || n === 2 || n === 3 || n === 4 || n === 5) return n;
  return null;
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
