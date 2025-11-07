import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, Briefcase, DollarSign, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { InternalJobPosting } from "@/services/careerDevelopment";

interface InternalJobDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: InternalJobPosting | null;
  onApply: () => void;
  hasApplied: boolean;
}

export function InternalJobDetailsModal({
  isOpen,
  onClose,
  job,
  onApply,
  hasApplied,
}: InternalJobDetailsModalProps) {
  if (!job) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aberto":
        return "default";
      case "Fechado":
        return "secondary";
      case "Preenchido":
        return "outline";
      default:
        return "outline";
    }
  };

  const isDeadlinePassed = new Date(job.application_deadline) < new Date();
  const canApply = job.status === "Aberto" && !isDeadlinePassed && !hasApplied;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
              <div className="space-y-2">
                <DialogTitle className="text-2xl">{job.title}</DialogTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(job.status)}>{job.status}</Badge>
                  {job.level && <Badge variant="outline">{job.level}</Badge>}
                  {job.employment_type && <Badge variant="outline">{job.employment_type}</Badge>}
                </div>
              </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Departamento:</span>
              <span className="font-medium">{job.department}</span>
            </div>

            {job.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Localização:</span>
                <span className="font-medium">{job.location}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Publicado em:</span>
              <span className="font-medium">
                {format(new Date(job.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Prazo:</span>
              <span className={`font-medium ${isDeadlinePassed ? 'text-destructive' : ''}`}>
                {format(new Date(job.application_deadline), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>

            {(job.salary_range_min || job.salary_range_max) && (
              <div className="flex items-center gap-2 text-sm col-span-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Faixa Salarial:</span>
                <span className="font-medium">
                  {job.salary_range_min && `R$ ${job.salary_range_min.toLocaleString('pt-BR')}`}
                  {job.salary_range_min && job.salary_range_max && " - "}
                  {job.salary_range_max && `R$ ${job.salary_range_max.toLocaleString('pt-BR')}`}
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Descrição da Vaga</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
          </div>

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Requisitos</h3>
                <ul className="space-y-2">
                  {job.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Benefícios</h3>
                <ul className="space-y-2">
                  {job.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Application Status Messages */}
          {hasApplied && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <p className="font-medium text-primary">Você já se candidatou a esta vaga</p>
              </div>
            </div>
          )}

          {isDeadlinePassed && !hasApplied && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-destructive" />
                <p className="font-medium text-destructive">O prazo para candidaturas encerrou</p>
              </div>
            </div>
          )}

          {job.status !== "Aberto" && !hasApplied && (
            <div className="bg-muted border rounded-lg p-4">
              <p className="font-medium text-muted-foreground">Esta vaga não está mais aceitando candidaturas</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            {canApply && (
              <Button onClick={onApply}>
                Candidatar-se a esta vaga
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
