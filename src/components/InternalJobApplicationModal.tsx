import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useCreateInternalJobApplication } from "@/services/careerDevelopment";
import { unifiedToast } from "@/utils/unifiedToast";
import type { InternalJobPosting } from "@/services/careerDevelopment";

interface InternalJobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: InternalJobPosting | null;
  employeeId: string;
  onSuccess: () => void;
}

export function InternalJobApplicationModal({
  isOpen,
  onClose,
  job,
  employeeId,
  onSuccess,
}: InternalJobApplicationModalProps) {
  const [coverLetter, setCoverLetter] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  const createApplication = useCreateInternalJobApplication();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!job || !employeeId) {
      unifiedToast.error("Informações da vaga ou funcionário não encontradas");
      return;
    }

    const application = {
      job_posting_id: job.id,
      employee_id: employeeId,
      cover_letter: coverLetter || null,
      additional_info: additionalInfo || null,
      application_date: new Date().toISOString().split('T')[0],
      status: "Em Análise",
    };

    createApplication.mutate(application, {
      onSuccess: () => {
        unifiedToast.success("Candidatura enviada com sucesso!");
        handleClose();
        onSuccess();
      },
      onError: (error) => {
        console.error("Erro ao enviar candidatura:", error);
        unifiedToast.error("Erro ao enviar candidatura");
      },
    });
  };

  const handleClose = () => {
    setCoverLetter("");
    setAdditionalInfo("");
    onClose();
  };

  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Candidatar-se à Vaga</DialogTitle>
          <DialogDescription>
            Você está se candidatando para: <strong>{job.title}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coverLetter">Carta de Apresentação</Label>
            <Textarea
              id="coverLetter"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Descreva brevemente por que você é um bom candidato para esta posição..."
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              Opcional: Conte um pouco sobre sua experiência e motivação para esta vaga
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalInfo">Informações Adicionais</Label>
            <Textarea
              id="additionalInfo"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Certificações, projetos relevantes, disponibilidade..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Opcional: Adicione qualquer informação relevante que não esteja no seu currículo
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Atenção:</strong> Sua candidatura será analisada pelo time de RH e pelo gestor da área. 
              Você receberá atualizações sobre o status da sua candidatura por e-mail.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createApplication.isPending}>
              {createApplication.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Candidatura
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
