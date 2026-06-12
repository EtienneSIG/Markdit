import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Shared axe-core accessibility scan harness (T015, FR-013). Scans against the
 * WCAG 2.2 AA tag set so every primary flow can assert zero violations.
 */
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

export async function scanA11y(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  return results.violations;
}
