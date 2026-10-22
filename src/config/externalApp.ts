/** Sistema (v2) hospedado fora deste projeto. Este projeto é apenas a landing page. */
export const PAINEL_URL = "https://painel.daton.com.br";

/** Rotas que continuam servidas por este projeto (institucionais/legais). */
export const PUBLIC_LP_PATHS = [
  "/",
  "/landing",
  "/contato",
  "/sobre-nos",
  "/faq",
  "/privacidade",
  "/termos",
  "/seguranca",
  "/ambiental",
  "/social",
  "/governanca",
  "/funcionalidades",
  "/documentacao",
];

export function isLandingPath(pathname: string): boolean {
  const clean = pathname.replace(/\/+$/, "") || "/";
  return PUBLIC_LP_PATHS.includes(clean);
}

/** Destino no painel: login/auth vai para a raiz; demais rotas preservam o caminho. */
export function buildPainelRedirect(pathname: string, search = "", hash = ""): string {
  const clean = pathname.replace(/\/+$/, "") || "/";
  if (["/auth", "/login", "/entrar"].includes(clean)) return PAINEL_URL;
  return `${PAINEL_URL}${clean}${search}${hash}`;
}
