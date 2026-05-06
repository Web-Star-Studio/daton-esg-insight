import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  type ComplianceResponses,
  upsertComplianceProfile,
} from "@/services/complianceProfiles";

type AutosaveStatus = "idle" | "saving" | "saved" | "error";

interface AutosaveOptions {
  branchId: string;
  companyId: string;
  responses: ComplianceResponses;
  enabled: boolean;
  debounceMs?: number;
}

export interface AutosaveState {
  status: AutosaveStatus;
  lastSavedAt: Date | null;
  error: string | null;
}

export const useDebouncedAutosave = ({
  branchId,
  companyId,
  responses,
  enabled,
  debounceMs = 1500,
}: AutosaveOptions): AutosaveState => {
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
        await upsertComplianceProfile({
          branch_id: branchId,
          company_id: companyId,
          responses,
        });
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
  }, [branchId, companyId, responses, enabled, debounceMs, queryClient]);

  return state;
};
