import { forwardRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getNCStatusLabel, getNCseravityColor } from "@/utils/ncStatusUtils";

interface NCData {
  nc_number: string;
  title: string;
  description: string;
  category?: string;
  severity: string;
  source: string;
  detected_date: string;
  status: string;
  damage_level?: string;
  responsible?: { full_name: string };
  due_date?: string;
  completion_date?: string;
}

interface ImmediateAction {
  description: string;
  due_date: string;
  status: string;
  responsible?: { full_name: string };
  completion_date?: string;
}

interface CauseAnalysis {
  analysis_method: string;
  root_cause: string;
  ishikawa_data?: any;
  five_whys_data?: any[];
}

interface ActionPlan {
  what_action: string;
  why_reason?: string;
  how_method?: string;
  where_location?: string;
  who_responsible?: { full_name: string };
  when_deadline: string;
  how_much_cost?: string;
  status: string;
}

interface Effectiveness {
  is_effective?: boolean;
  evaluation_notes?: string;
  verified_by?: { full_name: string };
  verification_date?: string;
}

interface NCPrintViewProps {
  nc: NCData;
  immediateActions?: ImmediateAction[];
  causeAnalysis?: CauseAnalysis | null;
  actionPlans?: ActionPlan[];
  effectiveness?: Effectiveness | null;
}

export const NCPrintView = forwardRef<HTMLDivElement, NCPrintViewProps>(
  ({ nc, immediateActions = [], causeAnalysis, actionPlans = [], effectiveness }, ref) => {
    const formatDate = (date: string | undefined) => {
      if (!date) return "Não definido";
      try {
        return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
      } catch {
        return date;
      }
    };

    const getAnalysisMethodLabel = (method: string) => {
      switch (method) {
        case "5_whys": return "5 Porquês";
        case "ishikawa": return "Diagrama de Ishikawa";
        case "root_cause": return "Análise de Causa Raiz";
        default: return method || "Não especificado";
      }
    };

    return (
      <div ref={ref} className="bg-white p-8 max-w-4xl mx-auto text-sm print:p-4">
        {/* Header */}
        <div className="border-b-2 border-gray-800 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Relatório de Não Conformidade</h1>
              <p className="text-lg font-semibold text-primary mt-1">{nc.nc_number}</p>
            </div>
            <div className="text-right text-sm text-gray-600">
              <p>Data de Impressão: {format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
              <p className="mt-1">
                Status: <span className="font-semibold">{getNCStatusLabel(nc.status)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Etapa 1: Detalhes da NC */}
        <section className="mb-6">
          <h2 className="text-lg font-bold bg-gray-100 p-2 mb-3 border-l-4 border-primary">
            1. Registro da Não Conformidade
          </h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-gray-600 text-xs uppercase">Título</p>
              <p className="font-medium">{nc.title}</p>
            </div>
            <div>
              <p className="text-gray-600 text-xs uppercase">Severidade</p>
              <p className="font-medium">{nc.severity}</p>
            </div>
            <div>
              <p className="text-gray-600 text-xs uppercase">Categoria</p>
              <p className="font-medium">{nc.category || "Não especificada"}</p>
            </div>
            <div>
              <p className="text-gray-600 text-xs uppercase">Fonte</p>
              <p className="font-medium">{nc.source}</p>
            </div>
            <div>
              <p className="text-gray-600 text-xs uppercase">Data de Detecção</p>
              <p className="font-medium">{formatDate(nc.detected_date)}</p>
            </div>
            <div>
              <p className="text-gray-600 text-xs uppercase">Grau de Dano</p>
              <p className="font-medium">{nc.damage_level || "Não avaliado"}</p>
            </div>
          </div>
          
          <div className="mt-4">
            <p className="text-gray-600 text-xs uppercase mb-1">Descrição</p>
            <p className="p-3 bg-gray-50 rounded border whitespace-pre-wrap">{nc.description}</p>
          </div>
        </section>

        {/* Etapa 2: Ações Imediatas */}
        <section className="mb-6">
          <h2 className="text-lg font-bold bg-gray-100 p-2 mb-3 border-l-4 border-blue-500">
            2. Ações Imediatas
          </h2>
          
          {immediateActions.length > 0 ? (
            <table className="w-full border-collapse border text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Ação</th>
                  <th className="border p-2 text-left w-24">Responsável</th>
                  <th className="border p-2 text-left w-24">Prazo</th>
                  <th className="border p-2 text-left w-20">Status</th>
                </tr>
              </thead>
              <tbody>
                {immediateActions.map((action, idx) => (
                  <tr key={idx}>
                    <td className="border p-2">{action.description}</td>
                    <td className="border p-2">{action.responsible?.full_name || "N/A"}</td>
                    <td className="border p-2">{formatDate(action.due_date)}</td>
                    <td className="border p-2">{action.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 italic">Nenhuma ação imediata registrada.</p>
          )}
        </section>

        {/* Etapa 3: Análise de Causa */}
        <section className="mb-6">
          <h2 className="text-lg font-bold bg-gray-100 p-2 mb-3 border-l-4 border-yellow-500">
            3. Análise de Causa Raiz
          </h2>
          
          {causeAnalysis ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-xs uppercase">Método de Análise</p>
                  <p className="font-medium">{getAnalysisMethodLabel(causeAnalysis.analysis_method)}</p>
                </div>
              </div>
              
              <div>
                <p className="text-gray-600 text-xs uppercase mb-1">Causa Raiz Identificada</p>
                <p className="p-3 bg-yellow-50 rounded border border-yellow-200 font-medium">
                  {causeAnalysis.root_cause || "Não identificada"}
                </p>
              </div>

              {/* 5 Whys */}
              {causeAnalysis.analysis_method === "5_whys" && causeAnalysis.five_whys_data && (
                <div className="mt-4">
                  <p className="text-gray-600 text-xs uppercase mb-2">Cadeia dos 5 Porquês</p>
                  <div className="space-y-2">
                    {causeAnalysis.five_whys_data.map((item: any, idx: number) => (
                      <div key={idx} className="pl-4 border-l-2 border-yellow-300">
                        <p className="text-xs text-gray-600">{idx + 1}º Por quê: {item.pergunta}</p>
                        <p className="font-medium">{item.resposta || "Sem resposta"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 italic">Análise de causa raiz não realizada.</p>
          )}
        </section>

        {/* Etapa 4: Plano de Ações */}
        <section className="mb-6">
          <h2 className="text-lg font-bold bg-gray-100 p-2 mb-3 border-l-4 border-green-500">
            4. Plano de Ações (5W2H)
          </h2>
          
          {actionPlans.length > 0 ? (
            <div className="space-y-4">
              {actionPlans.map((plan, idx) => (
                <div key={idx} className="border rounded p-3 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium">
                      Ação {idx + 1}
                    </span>
                    <span className="text-xs">{plan.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="col-span-2">
                      <p className="text-gray-600">O QUÊ (What)?</p>
                      <p className="font-medium">{plan.what_action}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">POR QUÊ (Why)?</p>
                      <p>{plan.why_reason || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">COMO (How)?</p>
                      <p>{plan.how_method || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">ONDE (Where)?</p>
                      <p>{plan.where_location || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">QUEM (Who)?</p>
                      <p>{plan.who_responsible?.full_name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">QUANDO (When)?</p>
                      <p>{formatDate(plan.when_deadline)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">QUANTO (How Much)?</p>
                      <p>{plan.how_much_cost || "N/A"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">Nenhuma ação planejada.</p>
          )}
        </section>

        {/* Etapa 6: Eficácia */}
        <section className="mb-6">
          <h2 className="text-lg font-bold bg-gray-100 p-2 mb-3 border-l-4 border-purple-500">
            6. Avaliação de Eficácia
          </h2>
          
          {effectiveness ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-xs uppercase">Resultado</p>
                  <p className={`font-medium ${effectiveness.is_effective ? "text-green-700" : "text-red-700"}`}>
                    {effectiveness.is_effective ? "Eficaz" : "Não Eficaz"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs uppercase">Data de Verificação</p>
                  <p className="font-medium">{formatDate(effectiveness.verification_date)}</p>
                </div>
              </div>
              
              {effectiveness.evaluation_notes && (
                <div>
                  <p className="text-gray-600 text-xs uppercase mb-1">Observações</p>
                  <p className="p-3 bg-gray-50 rounded border whitespace-pre-wrap">
                    {effectiveness.evaluation_notes}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 italic">Avaliação de eficácia não realizada.</p>
          )}
        </section>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-xs text-gray-500 text-center">
          <p>Documento gerado automaticamente pelo Sistema de Gestão de Não Conformidades</p>
          <p>Responsável: {nc.responsible?.full_name || "Não definido"}</p>
        </div>
      </div>
    );
  }
);

NCPrintView.displayName = "NCPrintView";
