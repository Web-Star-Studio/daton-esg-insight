/**
 * Accessibility Audit Utilities
 * Development-only tools for WCAG 2.1 AA compliance verification
 */

export interface HeadingAuditResult {
  valid: boolean;
  issues: string[];
  headings: { level: number; text: string; element: Element }[];
}

/**
 * Audit heading hierarchy for WCAG 1.3.1 compliance
 * Checks for:
 * - Single h1 per page
 * - No skipped heading levels (h1 -> h3 without h2)
 * - Presence of h1
 */
export function auditHeadingHierarchy(): HeadingAuditResult {
  if (typeof document === 'undefined') {
    return { valid: true, issues: [], headings: [] };
  }

  const headings: { level: number; text: string; element: Element }[] = [];
  const issues: string[] = [];
  let lastLevel = 0;
  let hasH1 = false;

  document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((el) => {
    const level = parseInt(el.tagName[1]);
    const text = el.textContent?.trim() || '';
    headings.push({ level, text, element: el });

    if (level === 1) {
      if (hasH1) {
        issues.push(`⚠️ Multiple h1 found: "${text.slice(0, 50)}..."`);
      }
      hasH1 = true;
    }

    if (level > lastLevel + 1 && lastLevel !== 0) {
      issues.push(
        `⚠️ Heading level skip: h${lastLevel} → h${level} ("${text.slice(0, 30)}...")`
      );
    }

    lastLevel = level;
  });

  if (!hasH1) {
    issues.push('⚠️ No h1 heading found on page');
  }

  return {
    valid: issues.length === 0,
    issues,
    headings,
  };
}

/**
 * Audit images for alt text (WCAG 1.1.1)
 */
export function auditImages(): { valid: boolean; issues: string[] } {
  if (typeof document === 'undefined') {
    return { valid: true, issues: [] };
  }

  const issues: string[] = [];
  
  document.querySelectorAll('img').forEach((img) => {
    if (!img.hasAttribute('alt')) {
      const src = img.src?.split('/').pop() || 'unknown';
      issues.push(`⚠️ Image missing alt attribute: ${src}`);
    }
  });

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Audit interactive elements for keyboard accessibility (WCAG 2.1.1)
 */
export function auditKeyboardAccessibility(): { valid: boolean; issues: string[] } {
  if (typeof document === 'undefined') {
    return { valid: true, issues: [] };
  }

  const issues: string[] = [];
  
  // Check for clickable divs without proper role/tabindex
  document.querySelectorAll('[onclick], [onkeydown]').forEach((el) => {
    const tagName = el.tagName.toLowerCase();
    if (!['button', 'a', 'input', 'select', 'textarea'].includes(tagName)) {
      if (!el.hasAttribute('role') && !el.hasAttribute('tabindex')) {
        issues.push(`⚠️ Clickable ${tagName} without role or tabindex`);
      }
    }
  });

  // Check for icon buttons without aria-label
  document.querySelectorAll('button').forEach((btn) => {
    const hasText = btn.textContent?.trim();
    const hasAriaLabel = btn.hasAttribute('aria-label');
    const hasSrOnly = btn.querySelector('.sr-only');
    
    if (!hasText && !hasAriaLabel && !hasSrOnly) {
      issues.push('⚠️ Button without accessible name (add aria-label or text)');
    }
  });

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Audit forms for proper labeling (WCAG 1.3.1, 3.3.2)
 */
export function auditFormLabels(): { valid: boolean; issues: string[] } {
  if (typeof document === 'undefined') {
    return { valid: true, issues: [] };
  }

  const issues: string[] = [];
  
  document.querySelectorAll('input, select, textarea').forEach((input) => {
    const id = input.id;
    const hasAriaLabel = input.hasAttribute('aria-label');
    const hasAriaLabelledBy = input.hasAttribute('aria-labelledby');
    const hasLabel = id && document.querySelector(`label[for="${id}"]`);
    
    if (!hasAriaLabel && !hasAriaLabelledBy && !hasLabel) {
      const type = input.getAttribute('type') || 'text';
      if (!['hidden', 'submit', 'button', 'reset'].includes(type)) {
        issues.push(`⚠️ Input (${type}) without label or aria-label`);
      }
    }
  });

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Run full accessibility audit (development only)
 */
export function runAccessibilityAudit(): void {
  if (!import.meta.env.DEV) return;

  const headings = auditHeadingHierarchy();
  const images = auditImages();
  const keyboard = auditKeyboardAccessibility();
  const forms = auditFormLabels();

  const allIssues = [
    ...headings.issues,
    ...images.issues,
    ...keyboard.issues,
    ...forms.issues,
  ];

  if (allIssues.length > 0) {
    console.group('🔍 Accessibility Audit Results');
    console.log(`Found ${allIssues.length} potential issues:`);
    allIssues.forEach(issue => console.warn(issue));
    console.groupEnd();
  } else {
    console.log('✅ Accessibility audit passed');
  }
}

// Auto-run in development with delay
if (import.meta.env.DEV && typeof window !== 'undefined') {
  setTimeout(() => {
    runAccessibilityAudit();
  }, 3000);
}
