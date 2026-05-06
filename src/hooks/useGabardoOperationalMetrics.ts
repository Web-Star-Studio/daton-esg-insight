import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const GABARDO_COMPANY_ID = "021647af-61a5-4075-9db3-bb5024ef7a67";

export type GabardoOperationalMetrics = {
  ncs: { total: number; open: number; closed: number };
  audits: { total: number; inProgress: number };
  licenses: { total: number; expired: number; expiring90d: number };
  sgq: { total: number; expired: number; expiring30d: number };
  trainings: {
    total: number;
    enrolled: number;
    inProgress: number;
    completed: number;
    pendingEfficacy: number;
  };
  laia: { total: number; active: number };
  legislations: { total: number };
  employees: { total: number };
  branches: { total: number };
  documents: { total: number };
};

const closedNcStatuses = new Set([
  "closed",
  "Encerrada",
  "Concluída",
  "Resolvida",
  "Fechada",
  "Cancelada",
]);

export const useGabardoOperationalMetrics = () => {
  return useQuery({
    queryKey: ["gabardo-operational-metrics"],
    refetchInterval: 60_000,
    queryFn: async (): Promise<GabardoOperationalMetrics> => {
      const cid = GABARDO_COMPANY_ID;
      const today = new Date().toISOString().slice(0, 10);
      const in30 = new Date(Date.now() + 30 * 86_400_000)
        .toISOString()
        .slice(0, 10);
      const in90 = new Date(Date.now() + 90 * 86_400_000)
        .toISOString()
        .slice(0, 10);

      const [
        ncRes,
        auditRes,
        licRes,
        sgqRes,
        trnRes,
        laiaRes,
        legRes,
        empRes,
        brRes,
        docRes,
      ] = await Promise.all([
        supabase.from("non_conformities").select("status").eq("company_id", cid),
        supabase.from("audits").select("status").eq("company_id", cid),
        supabase
          .from("licenses")
          .select("status, expiration_date")
          .eq("company_id", cid),
        supabase
          .from("sgq_iso_documents")
          .select("expiration_date")
          .eq("company_id", cid),
        supabase
          .from("employee_trainings")
          .select("status")
          .eq("company_id", cid),
        supabase.from("laia_assessments").select("status").eq("company_id", cid),
        supabase
          .from("legislations")
          .select("id", { count: "exact", head: true })
          .eq("company_id", cid),
        supabase
          .from("employees")
          .select("id", { count: "exact", head: true })
          .eq("company_id", cid),
        supabase
          .from("branches")
          .select("id", { count: "exact", head: true })
          .eq("company_id", cid),
        supabase
          .from("documents")
          .select("id", { count: "exact", head: true })
          .eq("company_id", cid),
      ]);

      const nc = (ncRes.data ?? []) as Array<{ status: string | null }>;
      const au = (auditRes.data ?? []) as Array<{ status: string | null }>;
      const lic = (licRes.data ?? []) as Array<{
        status: string | null;
        expiration_date: string | null;
      }>;
      const sgq = (sgqRes.data ?? []) as Array<{
        expiration_date: string | null;
      }>;
      const trn = (trnRes.data ?? []) as Array<{ status: string | null }>;
      const laia = (laiaRes.data ?? []) as Array<{ status: string | null }>;

      const ncClosed = nc.filter((r) =>
        closedNcStatuses.has(r.status ?? ""),
      ).length;

      const trnByStatus = trn.reduce<Record<string, number>>((acc, r) => {
        const k = r.status ?? "—";
        acc[k] = (acc[k] ?? 0) + 1;
        return acc;
      }, {});

      return {
        ncs: {
          total: nc.length,
          open: nc.length - ncClosed,
          closed: ncClosed,
        },
        audits: {
          total: au.length,
          inProgress: au.filter((r) =>
            (r.status ?? "").toLowerCase().includes("andamento"),
          ).length,
        },
        licenses: {
          total: lic.length,
          expired: lic.filter(
            (r) => r.expiration_date && r.expiration_date < today,
          ).length,
          expiring90d: lic.filter(
            (r) =>
              r.expiration_date &&
              r.expiration_date >= today &&
              r.expiration_date <= in90,
          ).length,
        },
        sgq: {
          total: sgq.length,
          expired: sgq.filter(
            (r) => r.expiration_date && r.expiration_date < today,
          ).length,
          expiring30d: sgq.filter(
            (r) =>
              r.expiration_date &&
              r.expiration_date >= today &&
              r.expiration_date <= in30,
          ).length,
        },
        trainings: {
          total: trn.length,
          enrolled: trnByStatus["Inscrito"] ?? 0,
          inProgress: trnByStatus["Em Andamento"] ?? 0,
          completed: trnByStatus["Concluído"] ?? 0,
          pendingEfficacy: trnByStatus["Pendente Avaliação"] ?? 0,
        },
        laia: {
          total: laia.length,
          active: laia.filter((r) => (r.status ?? "").toLowerCase() === "ativo")
            .length,
        },
        legislations: { total: legRes.count ?? 0 },
        employees: { total: empRes.count ?? 0 },
        branches: { total: brRes.count ?? 0 },
        documents: { total: docRes.count ?? 0 },
      };
    },
  });
};
