import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Calendar, Clock, MapPin, Users, Target } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

interface AuditPlanTabProps {
  audit: any;
  plan: any;
}

export function AuditPlanTab({ audit, plan }: AuditPlanTabProps) {
  if (!plan) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Target className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Nenhum plano criado</h3>
          <p className="text-muted-foreground mb-4">
            Crie um plano detalhado para esta auditoria através da página de Programas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Plano de Auditoria</h3>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Objetivo e Escopo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Objetivo</p>
              <p className="text-sm mt-1">{plan.objective || 'Não definido'}</p>
            </div>

            {plan.scope_areas && plan.scope_areas.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Áreas de Escopo</p>
                <div className="flex flex-wrap gap-2">
                  {plan.scope_areas.map((area: string, idx: number) => (
                    <Badge key={idx} variant="secondary">{area}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">Tipo de Auditoria</p>
              <p className="text-sm mt-1 capitalize">{plan.audit_type?.replace('_', ' ')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Cronograma
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {plan.planned_date && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Data Planejada</p>
                  <p className="text-sm font-medium">
                    {format(new Date(plan.planned_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}

            {plan.opening_meeting_date && (
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Reunião de Abertura</p>
                  <p className="text-sm font-medium">
                    {format(new Date(plan.opening_meeting_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}

            {plan.closing_meeting_date && (
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Reunião de Encerramento</p>
                  <p className="text-sm font-medium">
                    {format(new Date(plan.closing_meeting_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}

            {plan.duration_hours && (
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Duração Estimada</p>
                  <p className="text-sm font-medium">{plan.duration_hours} horas</p>
                </div>
              </div>
            )}

            {plan.location && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Local</p>
                  <p className="text-sm font-medium">{plan.location}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metodologia</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{plan.methodology || 'Não especificada'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plano de Amostragem</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{plan.sampling_plan || 'Não definido'}</p>
          </CardContent>
        </Card>
      </div>

      {plan.criteria && (
        <Card>
          <CardHeader>
            <CardTitle>Critérios de Auditoria</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm whitespace-pre-wrap">
              {typeof plan.criteria === 'string' ? plan.criteria : JSON.stringify(plan.criteria, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
