/**
 * SkipLinks - Accessibility component for keyboard navigation
 * 
 * Provides a "skip to main content" link that becomes visible on focus,
 * allowing keyboard users to bypass navigation and jump directly to content.
 * 
 * WCAG 2.4.1 - Bypass Blocks compliance
 */

export function SkipLinks() {
  return (
    <>
      <a 
        href="#main-content"
        className="skip-link"
      >
        Pular para o conteúdo principal
      </a>
      <a 
        href="#navigation"
        className="skip-link"
        style={{ left: '15rem' }}
      >
        Pular para a navegação
      </a>
    </>
  );
}
