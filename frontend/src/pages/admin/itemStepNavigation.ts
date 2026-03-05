export type ProductStep = 1 | 2 | 3 | 4;

interface NavigateWithAutoSaveParams {
  currentStep: ProductStep;
  direction: 'next' | 'prev';
  isBusy: boolean;
  saveCurrentItem: (silent?: boolean) => Promise<boolean>;
  setCurrentStep: (step: ProductStep) => void;
}

export async function navigateStepWithAutoSave({
  currentStep,
  direction,
  isBusy,
  saveCurrentItem,
  setCurrentStep,
}: NavigateWithAutoSaveParams): Promise<boolean> {
  if (isBusy) return false;

  const saved = await saveCurrentItem(true);
  if (!saved) return false;

  if (direction === 'next') {
    const next = Math.min(4, currentStep + 1) as ProductStep;
    setCurrentStep(next);
    return true;
  }

  const prev = Math.max(1, currentStep - 1) as ProductStep;
  setCurrentStep(prev);
  return true;
}

interface JumpToStepWithAutoSaveParams {
  currentStep: ProductStep;
  targetStep: ProductStep;
  isBusy: boolean;
  saveCurrentItem: (silent?: boolean) => Promise<boolean>;
  setCurrentStep: (step: ProductStep) => void;
}

export async function jumpToStepWithAutoSave({
  currentStep,
  targetStep,
  isBusy,
  saveCurrentItem,
  setCurrentStep,
}: JumpToStepWithAutoSaveParams): Promise<boolean> {
  if (currentStep === targetStep) return true;
  if (isBusy) return false;

  const saved = await saveCurrentItem(true);
  if (!saved) return false;

  setCurrentStep(targetStep);
  return true;
}
