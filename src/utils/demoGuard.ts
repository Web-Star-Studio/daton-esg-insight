/**
 * Dispara o evento que abre o modal de funcionalidade bloqueada no modo demo.
 * Pode ser chamado de qualquer lugar (proxies, interceptors, componentes).
 */
export function triggerDemoBlocked(): void {
  window.dispatchEvent(new CustomEvent('demo-blocked'));
}

/**
 * Intercepta ações de CRUD no modo demo, exibindo modal informativo.
 * Em modo normal, executa a ação real.
 */
export function demoAction(isDemo: boolean, realAction: () => void): void {
  if (isDemo) {
    triggerDemoBlocked();
    return;
  }
  realAction();
}
