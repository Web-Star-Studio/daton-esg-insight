import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, AlertCircle, FileQuestion, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast as sonnerToast } from "sonner";

interface AuditChecklistTabProps {
  auditId: string;
}

export function AuditChecklistTab({ auditId }: AuditChecklistTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: checklists } = useQuery({
    queryKey: ['audit-checklists'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      const { data, error } = await supabase
        .from('audit_checklists')
        .select('*')
        .eq('company_id', profile?.company_id)
        .eq('active', true);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: responses } = useQuery({
    queryKey: ['checklist-responses', auditId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_checklist_responses')
        .select('*')
        .eq('audit_id', auditId);
      if (error) throw error;
      return data || [];
    },
  });

  const saveResponse = useMutation({
    mutationFn: async ({ questionId, checklistId, response, notes, question }: any) => {
      const existing = responses?.find(r => r.question_id === questionId);

      if (existing) {
        const { error } = await supabase
          .from('audit_checklist_responses')
          .update({ response, evidence_notes: notes })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('audit_checklist_responses')
          .insert({
            audit_id: auditId,
            checklist_id: checklistId,
            question_id: questionId,
            response,
            evidence_notes: notes,
          });
        if (error) throw error;
      }

      // Se for não conforme, criar achado automaticamente
      if (response === 'nao_conforme' && (!existing || existing.response !== 'nao_conforme')) {
        const { data: audit } = await supabase
          .from('audits')
          .select('title')
          .eq('id', auditId)
          .single();

        const findingDescription = `Não conformidade identificada: ${question?.question || 'Item do checklist'}\n\nEvidências: ${notes || 'Não fornecidas'}`;

        const { error: findingError } = await supabase
          .from('audit_findings')
          .insert({
            audit_id: auditId,
            description: findingDescription,
            severity: 'major',
            status: 'open',
          });

        if (!findingError) {
          sonnerToast.success('Achado criado automaticamente', {
            description: 'Uma não conformidade foi registrada como achado de auditoria'
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-responses', auditId] });
      queryClient.invalidateQueries({ queryKey: ['audit-findings', auditId] });
      toast({ title: "Resposta salva", description: "Resposta do checklist registrada." });
    },
  });

  const getResponseIcon = (response: string) => {
    switch (response) {
      case 'conforme':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'nao_conforme':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'nao_aplicavel':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      case 'observacao':
        return <FileQuestion className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  if (!checklists || checklists.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Nenhum checklist disponível</h3>
          <p className="text-muted-foreground">
            Crie checklists ISO para começar a auditar.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Checklist de Auditoria</h3>
        <p className="text-sm text-muted-foreground">
          Responda as perguntas do checklist baseado nas evidências coletadas
        </p>
      </div>

      {checklists.map((checklist: any) => {
        const questions = Array.isArray(checklist.questions) ? checklist.questions : [];
        const checklistResponses = responses?.filter(r => r.checklist_id === checklist.id) || [];
        const progress = questions.length > 0 
          ? (checklistResponses.length / questions.length) * 100 
          : 0;

        return (
          <Card key={checklist.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{checklist.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge>{checklist.standard}</Badge>
                    {checklist.version && <Badge variant="outline">v{checklist.version}</Badge>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Progresso</p>
                  <p className="text-2xl font-bold">{progress.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">
                    {checklistResponses.length} de {questions.length}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {questions.map((question: any, idx: number) => {
                  const existingResponse = checklistResponses.find(r => r.question_id === question.id);
                  const [localResponse, setLocalResponse] = useState(existingResponse?.response || '');
                  const [localNotes, setLocalNotes] = useState(existingResponse?.evidence_notes || '');

                  return (
                    <AccordionItem key={question.id || idx} value={`question-${idx}`}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-3 text-left">
                          {existingResponse && getResponseIcon(existingResponse.response)}
                          <span className="font-medium">{question.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-4">
                          {question.reference && (
                            <p className="text-sm text-muted-foreground">
                              Referência: {question.reference}
                            </p>
                          )}

                          <RadioGroup
                            value={localResponse}
                            onValueChange={setLocalResponse}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="conforme" id={`${question.id}-c`} />
                              <Label htmlFor={`${question.id}-c`} className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Conforme
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="nao_conforme" id={`${question.id}-nc`} />
                              <Label htmlFor={`${question.id}-nc`} className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-500" />
                                Não Conforme
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="nao_aplicavel" id={`${question.id}-na`} />
                              <Label htmlFor={`${question.id}-na`} className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-gray-500" />
                                Não Aplicável
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="observacao" id={`${question.id}-obs`} />
                              <Label htmlFor={`${question.id}-obs`} className="flex items-center gap-2">
                                <FileQuestion className="h-4 w-4 text-blue-500" />
                                Observação
                              </Label>
                            </div>
                          </RadioGroup>

                          <div>
                            <Label>Evidências / Notas</Label>
                            <Textarea
                              value={localNotes}
                              onChange={(e) => setLocalNotes(e.target.value)}
                              placeholder="Descreva as evidências encontradas..."
                              rows={3}
                            />
                          </div>

                          {localResponse === 'nao_conforme' && !existingResponse && (
                            <Alert variant="destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                Atenção: Um achado de auditoria será criado automaticamente para esta não conformidade.
                              </AlertDescription>
                            </Alert>
                          )}

                          <Button
                            onClick={() => saveResponse.mutate({
                              questionId: question.id,
                              checklistId: checklist.id,
                              response: localResponse,
                              notes: localNotes,
                              question: question,
                            })}
                            disabled={!localResponse}
                          >
                            Salvar Resposta
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
