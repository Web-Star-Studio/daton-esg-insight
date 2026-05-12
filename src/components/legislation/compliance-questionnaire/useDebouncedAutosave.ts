import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  type ComplianceResponses,
  upsertComplianceProfile,
  upsertCompliancePreResponses,
} from "@/services/complianceProfiles";

type AutosaveStatus = "idle" | "saving" | "saved" | "error";

interface MainAutosaveOptions {
  mode?: "main";
  branchId: string;
  companyId: string;
  responses: ComplianceResponses;
  enabled: boolean;
  debounceMs?: number;
}

interface PreAutosaveOptions {
  mode: "pre";
  branchId: string;
  companyId: string;
  preResponses: ComplianceResponses;
  enabled: boolean;
  debounceMs?: number;
}

type AutosaveOptions = MainAutosaveOptions | PreAutosaveOptions;

export interface AutosaveState {
  status: AutosaveStatus;
  lastSavedAt: Date | null;
  error: string | null;
}

export const useDebouncedAutosave = (options: AutosaveOptions): AutosaveState => {
  const { branchId, companyId, enabled, debounceMs = 1500 } = options;
  const mode = options.mode ?? "main";

  // Em pre-mode, autosave grava APENAS pre_responses (rascunho). suppressed_keys
  // só vira na ação explícita "Aplicar escopo" — pré-form é não-mandatório.
  const responses = mode === "main" ? (options as MainAutosaveOptions).responses : null;
  const preResponses = mode === "pre" ? (options as PreAutosaveOptions).preResponses : null;

  const [state, setState] = useState<AutosaveState>({
    status: "idle",
    lastSavedAt: null,
    error: null,
  });
  const queryClient = useQueryClient();
  const isFirstRun = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      if (inFlight.current) return;
      inFlight.current = true;
      setState((s) => ({ ...s, status: "saving", error: null }));
      try {
        if (mode === "pre") {
          await upsertCompliancePreResponses({
            branch_id: branchId,
            company_id: companyId,
            pre_responses: preResponses ?? {},
          });
        } else {
          await upsertComplianceProfile({
            branch_id: branchId,
            company_id: companyId,
            responses: responses ?? {},
          });
        }
        queryClient.invalidateQueries({ queryKey: ["compliance-profile", branchId] });
        queryClient.invalidateQueries({ queryKey: ["compliance-profiles"] });
        setState({ status: "saved", lastSavedAt: new Date(), error: null });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        setState((s) => ({ ...s, status: "error", error: message }));
      } finally {
        inFlight.current = false;
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [mode, branchId, companyId, responses, preResponses, enabled, debounceMs, queryClient]);

  return state;
};
