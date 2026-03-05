import { describe, expect, it, vi } from 'vitest';
import {
  jumpToStepWithAutoSave,
  navigateStepWithAutoSave,
  type ProductStep,
} from '../../src/pages/admin/itemStepNavigation';

describe('navigateStepWithAutoSave', () => {
  it('does not navigate when busy', async () => {
    const saveCurrentItem = vi.fn().mockResolvedValue(true);
    const setCurrentStep = vi.fn();

    const result = await navigateStepWithAutoSave({
      currentStep: 1,
      direction: 'next',
      isBusy: true,
      saveCurrentItem,
      setCurrentStep,
    });

    expect(result).toBe(false);
    expect(saveCurrentItem).not.toHaveBeenCalled();
    expect(setCurrentStep).not.toHaveBeenCalled();
  });

  it('does not navigate when auto-save fails', async () => {
    const saveCurrentItem = vi.fn().mockResolvedValue(false);
    const setCurrentStep = vi.fn();

    const result = await navigateStepWithAutoSave({
      currentStep: 2,
      direction: 'next',
      isBusy: false,
      saveCurrentItem,
      setCurrentStep,
    });

    expect(result).toBe(false);
    expect(saveCurrentItem).toHaveBeenCalledWith(true);
    expect(setCurrentStep).not.toHaveBeenCalled();
  });

  it('navigates to next step after successful auto-save', async () => {
    const saveCurrentItem = vi.fn().mockResolvedValue(true);
    const setCurrentStep = vi.fn();

    const result = await navigateStepWithAutoSave({
      currentStep: 1,
      direction: 'next',
      isBusy: false,
      saveCurrentItem,
      setCurrentStep,
    });

    expect(result).toBe(true);
    expect(saveCurrentItem).toHaveBeenCalledWith(true);
    expect(setCurrentStep).toHaveBeenCalledWith(2);
  });

  it('navigates to previous step after successful auto-save', async () => {
    const saveCurrentItem = vi.fn().mockResolvedValue(true);
    const setCurrentStep = vi.fn();

    const result = await navigateStepWithAutoSave({
      currentStep: 3,
      direction: 'prev',
      isBusy: false,
      saveCurrentItem,
      setCurrentStep,
    });

    expect(result).toBe(true);
    expect(saveCurrentItem).toHaveBeenCalledWith(true);
    expect(setCurrentStep).toHaveBeenCalledWith(2);
  });

  it('clamps next step at 4', async () => {
    const saveCurrentItem = vi.fn().mockResolvedValue(true);
    const setCurrentStep = vi.fn();

    const result = await navigateStepWithAutoSave({
      currentStep: 4 as ProductStep,
      direction: 'next',
      isBusy: false,
      saveCurrentItem,
      setCurrentStep,
    });

    expect(result).toBe(true);
    expect(setCurrentStep).toHaveBeenCalledWith(4);
  });

  it('clamps previous step at 1', async () => {
    const saveCurrentItem = vi.fn().mockResolvedValue(true);
    const setCurrentStep = vi.fn();

    const result = await navigateStepWithAutoSave({
      currentStep: 1,
      direction: 'prev',
      isBusy: false,
      saveCurrentItem,
      setCurrentStep,
    });

    expect(result).toBe(true);
    expect(setCurrentStep).toHaveBeenCalledWith(1);
  });
});

describe('jumpToStepWithAutoSave', () => {
  it('does not save when target step equals current step', async () => {
    const saveCurrentItem = vi.fn().mockResolvedValue(true);
    const setCurrentStep = vi.fn();

    const result = await jumpToStepWithAutoSave({
      currentStep: 2,
      targetStep: 2,
      isBusy: false,
      saveCurrentItem,
      setCurrentStep,
    });

    expect(result).toBe(true);
    expect(saveCurrentItem).not.toHaveBeenCalled();
    expect(setCurrentStep).not.toHaveBeenCalled();
  });

  it('auto-saves before jumping to target step', async () => {
    const saveCurrentItem = vi.fn().mockResolvedValue(true);
    const setCurrentStep = vi.fn();

    const result = await jumpToStepWithAutoSave({
      currentStep: 1,
      targetStep: 3,
      isBusy: false,
      saveCurrentItem,
      setCurrentStep,
    });

    expect(result).toBe(true);
    expect(saveCurrentItem).toHaveBeenCalledWith(true);
    expect(setCurrentStep).toHaveBeenCalledWith(3);
  });

  it('does not jump when auto-save fails', async () => {
    const saveCurrentItem = vi.fn().mockResolvedValue(false);
    const setCurrentStep = vi.fn();

    const result = await jumpToStepWithAutoSave({
      currentStep: 1,
      targetStep: 4,
      isBusy: false,
      saveCurrentItem,
      setCurrentStep,
    });

    expect(result).toBe(false);
    expect(setCurrentStep).not.toHaveBeenCalled();
  });
});
