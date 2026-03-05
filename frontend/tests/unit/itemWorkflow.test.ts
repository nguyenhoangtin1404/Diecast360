import { describe, expect, it } from 'vitest';
import {
  buildStepUrlAfterCreate,
  evaluateFinishDecision,
  shouldBlockEnterSubmit,
} from '../../src/pages/admin/itemWorkflow';

describe('itemWorkflow', () => {
  it('builds create->step2 url correctly', () => {
    expect(buildStepUrlAfterCreate('abc123')).toBe('/admin/items/abc123?step=2');
  });

  it('allows finishing and returning to list when media is complete', () => {
    const decision = evaluateFinishDecision(
      { lastImageUploadFailed: false, missingImages: false, missingSpin360: false },
      true,
    );

    expect(decision.proceed).toBe(true);
    expect(decision.warnings).toHaveLength(0);
  });

  it('blocks finish and sends user back to step 2 when images are missing and user does not confirm', () => {
    const decision = evaluateFinishDecision(
      { lastImageUploadFailed: false, missingImages: true, missingSpin360: false },
      false,
    );

    expect(decision.proceed).toBe(false);
    expect(decision.fallbackStep).toBe(2);
  });

  it('blocks finish and sends user back to step 3 when only 360 images are missing and user does not confirm', () => {
    const decision = evaluateFinishDecision(
      { lastImageUploadFailed: false, missingImages: false, missingSpin360: true },
      false,
    );

    expect(decision.proceed).toBe(false);
    expect(decision.fallbackStep).toBe(3);
  });

  it('blocks Enter submit for non-textarea fields', () => {
    expect(shouldBlockEnterSubmit('Enter', 'input')).toBe(true);
  });

  it('does not block Enter in textarea', () => {
    expect(shouldBlockEnterSubmit('Enter', 'textarea')).toBe(false);
  });
});
