import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, AlertTriangle } from "lucide-react";
import { useCompanyUsers } from "@/hooks/data/useCompanyUsers";

interface BulkComplianceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBranches: Array<{ id: string; name: string }>;
  onConfirm: (data: BulkComplianceData) => void;
  isLoading?: boolean;
}

export interface BulkComplianceData {
  applicability: 'real' | 'potential' | 'na' | 'revoked' | 'pending';
  compliance_status: 'conforme' | 'para_conhecimento' | 'adequacao' | 'plano_acao' | 'pending';
  unit_responsible_user_id?: string;
  observations?: string;
}

export const BulkComplianceModal: React.FC<BulkComplianceModalProps> = ({
  open,
  onOpenChange,
  selectedBranches,
  onConfirm,
  isLoading,
}) => {
  const { data: users = [] } = useCompanyUsers();
  
  const [formData, setFormData] = useState<BulkComplianceData>({
    applicability: 'real',
    compliance_status: 'conforme',
  });

  const handleSubmit = () => {
    onConfirm(formData);
  };

  const handleClose = () => {
    setFormData({
      applicability: 'real',
      compliance_status: 'conforme',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Edição em Lote
          </DialogTitle>
          <DialogDescription>
            Aplicar configurações para {selectedBranches.length} unidade(s) selecionada(s)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Esta ação irá sobrescrever as configurações existentes nas unidades selecionadas.
            </p>
          </div>

          {/* Applicability */}
          <div className="space-y-2">
            <Label>Aplicabilidade</Label>
            <Select
              value={formData.applicability}
              onValueChange={(value) => setFormData({ ...formData, applicability: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="real">Aplicabilidade Real</SelectItem>
                <SelectItem value="potential">Aplicabilidade Potencial</SelectItem>
                <SelectItem value="na">Não Aplicável</SelectItem>
                <SelectItem value="revoked">Revogada</SelectItem>
                <SelectItem value="pending">Pendente de Avaliação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Compliance Status */}
          <div className="space-y-2">
            <Label>Status de Atendimento</Label>
            <Select
              value={formData.compliance_status}
              onValueChange={(value) => setFormData({ ...formData, compliance_status: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conforme">Conforme</SelectItem>
                <SelectItem value="para_conhecimento">Para Conhecimento</SelectItem>
                <SelectItem value="adequacao">Em Adequação</SelectItem>
                <SelectItem value="plano_acao">Plano de Ação</SelectItem>
                <SelectItem value="pending">Pendente de Avaliação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Responsible User (Optional) */}
          <div className="space-y-2">
            <Label>Responsável (opcional)</Label>
            <Select
              value={formData.unit_responsible_user_id || "none"}
              onValueChange={(value) => 
                setFormData({ 
                  ...formData, 
                  unit_responsible_user_id: value === "none" ? undefined : value 
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Manter responsável atual" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Manter responsável atual</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Observations (Optional) */}
          <div className="space-y-2">
            <Label>Observações (opcional)</Label>
            <Textarea
              placeholder="Adicionar observações para todas as unidades..."
              value={formData.observations || ""}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value || undefined })}
              rows={2}
            />
          </div>

          {/* Selected Branches Preview */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Unidades a serem atualizadas:</Label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 border rounded-lg bg-muted/30">
              {selectedBranches.map((branch) => (
                <Badge key={branch.id} variant="secondary" className="text-xs">
                  {branch.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Aplicando...
              </>
            ) : (
              `Aplicar a ${selectedBranches.length} Unidade(s)`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
