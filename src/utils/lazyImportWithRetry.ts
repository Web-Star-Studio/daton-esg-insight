import { lazy, type ComponentType } from "react";

const CHUNK_LOAD_ERROR_PATTERN =
  /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk [\d\w-]+ failed/i;

export function lazyImportWithRetry<T extends ComponentType<any>>(
  importer: () => Promise<{ default: T }>,
  retryKey: string
) {
  return lazy(async () => {
    try {
      const module = await importer();
      sessionStorage.removeItem(retryKey);
      return module;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const hasRetried = sessionStorage.getItem(retryKey) === "1";
      const isChunkLoadError = CHUNK_LOAD_ERROR_PATTERN.test(message);

      if (typeof window !== "undefined" && isChunkLoadError && !hasRetried) {
        sessionStorage.setItem(retryKey, "1");
        window.location.reload();
        return new Promise<never>(() => {});
      }

      sessionStorage.removeItem(retryKey);
      throw error;
    }
  });
}
