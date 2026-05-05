import { useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Detector de "nova versão deployada" — resolve o cenário de user
 * logado que ficou com o bundle antigo em cache.
 *
 * Como funciona:
 *   1. No build, o plugin `buildVersionPlugin` injeta `__BUILD_VERSION__`
 *      no bundle e emite `dist/build-version.json` com a mesma versão.
 *   2. Em runtime, este componente faz fetch periódico de
 *      `/build-version.json?t=<now>` (cache-buster).
 *   3. Se a versão remota != injetada → toast persistente "Atualizar".
 *   4. User clica → `window.location.reload()` traz o bundle novo.
 *
 * Frequência: 5 min. Roda também em `visibilitychange→visible` pra
 * detectar imediatamente quando o user volta pra aba.
 *
 * Deploy depende de:
 *   - vercel.json com `no-cache` em /build-version.json e index.html
 *   - host do Lovable propagar esses headers (geralmente Vercel-like)
 */

const CHECK_INTERVAL_MS = 5 * 60_000;
const TOAST_ID = "app-version-update";

const isProd = import.meta.env.PROD;

const fetchRemoteVersion = async (): Promise<string | null> => {
  try {
    const res = await fetch(`/build-version.json?t=${Date.now()}`, {
      cache: "no-store",
      credentials: "omit",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { version?: string };
    return data?.version ?? null;
  } catch {
    return null;
  }
};

export const VersionUpdatePrompt = () => {
  const promptedRef = useRef(false);

  useEffect(() => {
    // Em dev `__BUILD_VERSION__` é stale (definido só no build);
    // ainda assim deixa rodar pra exercitar o caminho — mas só se prod.
    if (!isProd) return;

    const localVersion = __BUILD_VERSION__;

    const checkAndPrompt = async () => {
      if (promptedRef.current) return;
      const remote = await fetchRemoteVersion();
      if (!remote || remote === localVersion) return;

      promptedRef.current = true;
      toast.info("Nova versão disponível", {
        id: TOAST_ID,
        description:
          "Recarregue a página pra carregar as últimas atualizações.",
        duration: Infinity,
        action: {
          label: "Atualizar agora",
          onClick: () => window.location.reload(),
        },
        onDismiss: () => {
          // Permite re-aviso no próximo ciclo se ele dispensou e a
          // versão continua antiga.
          promptedRef.current = false;
        },
      });
    };

    void checkAndPrompt();
    const interval = window.setInterval(checkAndPrompt, CHECK_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") void checkAndPrompt();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return null;
};
