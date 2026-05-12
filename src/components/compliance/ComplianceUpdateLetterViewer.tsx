// Visualização in-app da Carta de Atualização Mensal — replica o formato
// SOGI (cabeçalho + sumário executivo + cinco tabelas categorizadas).
// O download em PDF é via helper irmão `ComplianceUpdateLetterPDF.ts`.

import { Download, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ExternalChangeLine, LetterContent, SerializedLine } from "@/services/complianceUpdateLetters";
import { APPLICABILITY_LABELS, formatReferenceMonthLabel, titleForTheme } from "@/lib/complianceSystems";
import { downloadComplianceUpdateLetterPDF } from "./ComplianceUpdateLetterPDF";

interface SectionDef {
  key: keyof LetterContent["sections"];
  title: string;
  description: string;
}

const SECTIONS: SectionDef[] = [
  { key: "published", title: "Requisitos Publicados", description: "Normas criadas no mês e aplicáveis à unidade." },
  { key: "modified", title: "Requisitos Alterados", description: "Normas existentes com mudança material no mês." },
  { key: "excluded", title: "Requisitos Excluídos", description: "Normas que saíram do escopo (inativadas)." },
  { key: "revoked", title: "Requisitos Revogados", description: "Normas revogadas no mês." },
  { key: "included_by_review", title: "Requisitos Incluídos por Revisão", description: "Normas vinculadas à unidade pela primeira vez no mês." },
];

const APPLICABILITY_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  real: "default",
  potential: "secondary",
  revoked: "destructive",
  na: "outline",
  pending: "outline",
};

interface ComplianceUpdateLetterViewerProps {
  content: LetterContent;
  generatorName?: string | null;
}

export function ComplianceUpdateLetterViewer({
  content,
  generatorName = null,
}: ComplianceUpdateLetterViewerProps) {
  // UTC-safe — ver justificativa em formatReferenceMonthLabel.
  const monthLabelCap = formatReferenceMonthLabel(content.reference_month, "/");

  const externalChanges = content.sections.external_changes ?? [];
  const totalChanges =
    content.sections.published.length +
    content.sections.modified.length +
    content.sections.revoked.length +
    content.sections.excluded.length +
    content.sections.included_by_review.length +
    externalChanges.length;

  const handleDownload = () => downloadComplianceUpdateLetterPDF(content, generatorName ?? null);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Carta de Atualização</h1>
            <p className="text-muted-foreground italic">{monthLabelCap}</p>
            <p className="font-semibold mt-1">
              {content.unit_name}
              {(content.unit_city || content.unit_state) && (
                <span className="font-normal text-muted-foreground">
                  {" — "}
                  {[content.unit_city, content.unit_state].filter(Boolean).join(" / ")}
                </span>
              )}
            </p>
          </div>
          <Button onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Baixar PDF
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-2 text-sm">
            <p>Prezados(as),</p>
            <p>
              Para efeito de atualização do mapa de requisitos legais e outros requisitos da unidade,
              informamos que no mês de <strong>{monthLabelCap}</strong>, foram publicadas, alteradas,
              excluídas e revogadas as seguintes normas pertinentes ao sistema da empresa.
            </p>
          </CardContent>
        </Card>

        {(content.ai_meta.summary_failed || content.ai_meta.diffs_failed) && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Enriquecimento por IA indisponível neste momento
              {content.ai_meta.error ? ` (${content.ai_meta.error})` : ""}.
              O conteúdo abaixo está completo, apenas o sumário e/ou as observações de mudança
              ficam sem o resumo automático.
            </AlertDescription>
          </Alert>
        )}

        {content.ai_meta.incomplete && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              O mês teve volume atípico de mudanças no histórico (acima do limite por carta).
              Estamos exibindo as mais recentes; algumas alterações antigas do mesmo mês podem
              não aparecer.
            </AlertDescription>
          </Alert>
        )}

        {content.executive_summary && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sumário Executivo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-line">{content.executive_summary}</p>
            </CardContent>
          </Card>
        )}

        {SECTIONS.map((section) => {
          const lines = content.sections[section.key];
          if (!lines || lines.length === 0) return null; // espelha SOGI: omite seções vazias
          return <Section key={section.key} {...section} lines={lines} />;
        })}

        {externalChanges.length > 0 && (
          <ExternalChangesSection lines={externalChanges} />
        )}

        {totalChanges === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Nenhuma mudança normativa registrada no período para esta unidade.
            </CardContent>
          </Card>
        )}

        <div className="text-xs text-muted-foreground border-t pt-4">
          Gerado em{" "}
          <strong>
            {format(new Date(content.generated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
          </strong>
          {generatorName ? <> por <strong>{generatorName}</strong></> : null}
          .
        </div>
      </div>
    </TooltipProvider>
  );
}

interface SectionProps extends SectionDef {
  lines: SerializedLine[];
}

function Section({ title, description, lines }: SectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>
            {title} <span className="text-muted-foreground font-normal text-sm">({lines.length})</span>
          </span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="p-0">
        {lines.length === 0 ? (
          <div className="px-6 pb-6 text-sm text-muted-foreground italic">
            Nenhum item neste mês.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Requisito</TableHead>
                  <TableHead>Sumário</TableHead>
                  <TableHead className="w-[120px]">Aplicabilidade</TableHead>
                  <TableHead className="w-[140px]">Sistemas</TableHead>
                  <TableHead className="w-[110px]">Origem</TableHead>
                  <TableHead>Justificativa / Observação</TableHead>
                  <TableHead className="w-[150px]">Alterador</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={`${line.legislation_id}-${line.changed_at ?? "novo"}`}>
                    <TableCell className="align-top">
                      <div className="font-mono text-xs text-muted-foreground">{line.code}</div>
                      <div className="font-medium">{line.title}</div>
                    </TableCell>
                    <TableCell className="align-top text-sm">{line.summary || "—"}</TableCell>
                    <TableCell className="align-top">
                      <Badge variant={APPLICABILITY_VARIANT[line.applicability] ?? "outline"}>
                        {APPLICABILITY_LABELS[line.applicability] ?? line.applicability}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex flex-wrap gap-1">
                        {line.systems.length === 0 && <span className="text-muted-foreground">—</span>}
                        {line.systems.map((sigla) => (
                          <Tooltip key={sigla}>
                            <TooltipTrigger asChild>
                              <Badge variant="secondary" className="cursor-help">{sigla}</Badge>
                            </TooltipTrigger>
                            <TooltipContent>{titleForTheme(siglaToThemeId(sigla))}</TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="align-top text-sm">{line.origin}</TableCell>
                    <TableCell className="align-top text-sm">{line.observation || "—"}</TableCell>
                    <TableCell className="align-top text-sm">{line.alterador || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const CHANGE_TYPE_LABEL: Record<ExternalChangeLine["change_type"], string> = {
  amended: "Alterada",
  revoked: "Revogada",
  superseded: "Substituída",
  clarified: "Esclarecida",
};

const CHANGE_TYPE_VARIANT: Record<ExternalChangeLine["change_type"], "default" | "destructive" | "secondary"> = {
  amended: "default",
  revoked: "destructive",
  superseded: "destructive",
  clarified: "secondary",
};

function ExternalChangesSection({ lines }: { lines: ExternalChangeLine[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>
            Alterações Externas Detectadas{" "}
            <span className="text-muted-foreground font-normal text-sm">({lines.length})</span>
          </span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Mudanças identificadas em fontes oficiais (DOU, planalto, agências) pelo monitoramento contínuo, independente de edição manual.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Requisito</TableHead>
                <TableHead className="w-[130px]">Tipo de mudança</TableHead>
                <TableHead>Resumo da alteração</TableHead>
                <TableHead className="w-[120px]">Confiança</TableHead>
                <TableHead className="w-[120px]">Fonte</TableHead>
                <TableHead className="w-[120px]">Detectado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line) => (
                <TableRow key={`${line.legislation_id}-${line.detected_at}`}>
                  <TableCell className="align-top">
                    <div className="font-mono text-xs text-muted-foreground">{line.code}</div>
                    <div className="font-medium">{line.title}</div>
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge variant={CHANGE_TYPE_VARIANT[line.change_type]}>
                      {CHANGE_TYPE_LABEL[line.change_type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top text-sm">{line.diff_summary || "—"}</TableCell>
                  <TableCell className="align-top text-sm">
                    {line.confidence != null ? `${Math.round(line.confidence * 100)}%` : "—"}
                  </TableCell>
                  <TableCell className="align-top text-sm">
                    {line.source_url ? (
                      <a
                        href={line.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline hover:no-underline"
                      >
                        Abrir
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="align-top text-sm">
                    {format(new Date(line.detected_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// Reverse lookup pequena para o tooltip — sigla → theme_id. Mantém local
// porque só é usada aqui; o serviço expõe theme_id → sigla diretamente.
function siglaToThemeId(sigla: string): string {
  switch (sigla) {
    case "LIC": return "licenciamento";
    case "INS": return "instalacoes";
    case "LOC": return "localizacao_fauna_flora";
    case "PRD": return "produtos_insumos";
    case "FLO": return "produtos_florestais";
    case "CMB": return "combustiveis_inflamaveis";
    case "QUI": return "produtos_quimicos";
    case "HID": return "recursos_hidricos";
    case "ATM": return "emissoes_atmosfericas";
    case "RES": return "residuos";
    case "EQP": return "equipamentos";
    case "ENE": return "energia";
    case "TRP": return "transporte";
    case "PRF": return "profissionais";
    case "PCD": return "pcd";
    case "SST": return "saude_trabalhador";
    case "TER": return "tipos_trabalho_terceiros";
    case "NRG": return "normas_regulamentadoras";
    case "MIN": return "mineracao";
    case "PES": return "pesagem";
    case "LGP": return "lgpd";
    default: return "";
  }
}
