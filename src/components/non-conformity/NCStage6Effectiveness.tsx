import { useState, useEffect } from "react";
import { Check, X, AlertTriangle, Calendar, RefreshCw, Shield, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  useEffectiveness, 
  useCreateEffectiveness,
  useUpdateEffectiveness,
  useCompanyUsers 
} from "@/hooks/useNonConformity";
import { format, addDays } from "date-fns";
import { toast } from "sonner";

interface NCStage6EffectivenessProps {
  ncId: string;
  onComplete?: () => void;
  onReopen?: () => void;
}

export function NCStage6Effectiveness({ ncId, onComplete, onReopen }: NCStage6EffectivenessProps) {
  const { data: effectiveness, isLoading } = useEffectiveness(ncId);
  const { data: users } = useCompanyUsers();
  const createMutation = useCreateEffectiveness();
  const updateMutation = useUpdateEffectiveness();

  const [isEffective, setIsEffective] = useState<boolean | null>(null);
  const [evidence, setEvidence] = useState("");
  const [requiresRiskUpdate, setRequiresRiskUpdate] = useState(false);
  const [riskUpdateNotes, setRiskUpdateNotes] = useState("");
  const [requiresSGQChange, setRequiresSGQChange] = useState(false);
  const [sgqChangeNotes, setSGQChangeNotes] = useState("");
  const [postponedTo, setPostponedTo] = useState("");
  const [postponedReason, setPostponedReason] = useState("");
  const [postponedResponsibleId, setPostponedResponsibleId] = useState("");
  const [mode, setMode] = useState<"evaluate" | "postpone">("evaluate");

  // Load existing data
  useEffect(() => {
    if (effectiveness) {
      setIsEffective(effectiveness.is_effective ?? null);
      setEvidence(effectiveness.evidence || "");
      setRequiresRiskUpdate(effectiveness.requires_risk_update);
      setRiskUpdateNotes(effectiveness.risk_update_notes || "");
      setRequiresSGQChange(effectiveness.requires_sgq_change);
      setSGQChangeNotes(effectiveness.sgq_change_notes || "");
      setPostponedTo(effectiveness.postponed_to || "");
      setPostponedReason(effectiveness.postponed_reason || "");
      setPostponedResponsibleId(effectiveness.postponed_responsible_id || "");
    }
  }, [effectiveness]);

  const handlePostpone = () => {
    if (!postponedTo) {
      toast.error("Defina a data para nova avaliação");
      return;
    }
    if (!postponedReason.trim()) {
      toast.error("Justifique a postergação");
      return;
    }

    const data = {
      non_conformity_id: ncId,
      evidence: "Avaliação postergada",
      postponed_to: postponedTo,
      postponed_reason: postponedReason,
      postponed_responsible_id: postponedResponsibleId || undefined,
      requires_risk_update: false,
      requires_sgq_change: false,
      revision_number: (effectiveness?.revision_number || 0) + 1,
      attachments: [],
    };

    if (effectiveness) {
      updateMutation.mutate({ id: effectiveness.id, updates: data });
    } else {
      createMutation.mutate(data as any);
    }
  };

  const handleEvaluate = () => {
    if (isEffective === null) {
      toast.error("Selecione se as ações foram eficazes");
      return;
    }
    if (!evidence.trim()) {
      toast.error("Descreva a evidência da avaliação");
      return;
    }

    const data = {
      non_conformity_id: ncId,
      is_effective: isEffective,
      evidence,
      requires_risk_update: requiresRiskUpdate,
      risk_update_notes: riskUpdateNotes,
      requires_sgq_change: requiresSGQChange,
      sgq_change_notes: sgqChangeNotes,
      revision_number: (effectiveness?.revision_number || 0) + 1,
      attachments: [],
    };

    if (effectiveness) {
      updateMutation.mutate({ 
        id: effectiveness.id, 
        updates: data 
      }, {
        onSuccess: () => {
          if (isEffective) {
            onComplete?.();
          } else {
            onReopen?.();
          }
        }
      });
    } else {
      createMutation.mutate(data as any, {
        onSuccess: () => {
          if (isEffective) {
            onComplete?.();
          } else {
            onReopen?.();
          }
        }
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">6</span>
          Avaliação de Eficácia
        </CardTitle>
        <CardDescription>
          Verifique se as ações implementadas eliminaram a causa raiz do problema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mode Selection */}
        <div className="flex gap-2">
          <Button
            variant={mode === "evaluate" ? "default" : "outline"}
            onClick={() => setMode("evaluate")}
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-2" />
            Avaliar Agora
          </Button>
          <Button
            variant={mode === "postpone" ? "default" : "outline"}
            onClick={() => setMode("postpone")}
            className="flex-1"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Postergar
          </Button>
        </div>

        {mode === "evaluate" ? (
          <div className="space-y-6">
            {/* Effectiveness Question */}
            <div className="p-4 border rounded-lg bg-muted/30">
              <Label className="text-base font-medium">
                As ações implementadas eliminaram a causa raiz do problema?
              </Label>
              <RadioGroup
                value={isEffective === null ? "" : isEffective ? "yes" : "no"}
                onValueChange={(v) => setIsEffective(v === "yes")}
                className="mt-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="effective-yes" />
                  <Label htmlFor="effective-yes" className="flex items-center gap-2 cursor-pointer">
                    <Check className="h-4 w-4 text-green-600" />
                    Sim, as ações foram eficazes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="effective-no" />
                  <Label htmlFor="effective-no" className="flex items-center gap-2 cursor-pointer">
                    <X className="h-4 w-4 text-red-600" />
                    Não, o problema persiste ou reincidiu
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Evidence */}
            <div>
              <Label htmlFor="evidence" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Evidência da Avaliação *
              </Label>
              <Textarea
                id="evidence"
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder="Descreva as evidências que comprovam a eficácia (ou ineficácia) das ações..."
                rows={4}
                className="mt-2"
              />
            </div>

            {/* Risk Update */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="risk-update"
                  checked={requiresRiskUpdate}
                  onCheckedChange={(checked) => setRequiresRiskUpdate(!!checked)}
                />
                <Label htmlFor="risk-update" className="flex items-center gap-2 cursor-pointer">
                  <Shield className="h-4 w-4" />
                  Necessário atualizar análise de riscos
                </Label>
              </div>
              {requiresRiskUpdate && (
                <Textarea
                  value={riskUpdateNotes}
                  onChange={(e) => setRiskUpdateNotes(e.target.value)}
                  placeholder="Descreva as alterações necessárias na análise de riscos..."
                  rows={2}
                  className="mt-3"
                />
              )}
            </div>

            {/* SGQ Change */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sgq-change"
                  checked={requiresSGQChange}
                  onCheckedChange={(checked) => setRequiresSGQChange(!!checked)}
                />
                <Label htmlFor="sgq-change" className="flex items-center gap-2 cursor-pointer">
                  <RefreshCw className="h-4 w-4" />
                  Necessário atualizar documentação do SGQ
                </Label>
              </div>
              {requiresSGQChange && (
                <Textarea
                  value={sgqChangeNotes}
                  onChange={(e) => setSGQChangeNotes(e.target.value)}
                  placeholder="Descreva as alterações necessárias na documentação..."
                  rows={2}
                  className="mt-3"
                />
              )}
            </div>

            {/* Warning for ineffective */}
            {isEffective === false && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Ao confirmar que as ações foram ineficazes, a NC será reaberta para nova análise
                  de causa e planejamento de ações adicionais (Revisão {(effectiveness?.revision_number || 0) + 1}).
                </AlertDescription>
              </Alert>
            )}

            {/* Submit */}
            <div className="flex justify-end">
              <Button
                onClick={handleEvaluate}
                disabled={isEffective === null || !evidence.trim() || createMutation.isPending || updateMutation.isPending}
                variant={isEffective ? "default" : "destructive"}
              >
                {isEffective ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirmar Eficácia e Encerrar NC
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Registrar Ineficácia e Reabrir NC
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                Use esta opção quando ainda não for possível avaliar a eficácia das ações
                (ex: aguardando período de observação).
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="postpone-date">Nova data para avaliação *</Label>
              <Input
                id="postpone-date"
                type="date"
                value={postponedTo}
                onChange={(e) => setPostponedTo(e.target.value)}
                min={format(addDays(new Date(), 1), "yyyy-MM-dd")}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="postpone-reason">Justificativa *</Label>
              <Textarea
                id="postpone-reason"
                value={postponedReason}
                onChange={(e) => setPostponedReason(e.target.value)}
                placeholder="Por que a avaliação precisa ser postergada?"
                rows={3}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="postpone-responsible">Responsável pela nova avaliação</Label>
              <Select
                value={postponedResponsibleId}
                onValueChange={setPostponedResponsibleId}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handlePostpone}
                disabled={!postponedTo || !postponedReason.trim() || createMutation.isPending || updateMutation.isPending}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Postergar Avaliação
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
