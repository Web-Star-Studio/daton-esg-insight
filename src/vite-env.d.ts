/// <reference types="vite/client" />

// Injetado pelo plugin `buildVersionPlugin` em vite.config.ts.
// Em dev fica como string vazia (Vite resolve `define` em build).
declare const __BUILD_VERSION__: string;
