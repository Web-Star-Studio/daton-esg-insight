import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, FileText, Save, Upload } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { createCorporatePolicy, updateCorporatePolicy, CorporatePolicy } from "@/services/governance";

interface CorporatePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  policy?: CorporatePolicy | null;
  onUpdate: () => void;
}

export function CorporatePolicyModal({ isOpen, onClose, policy, onUpdate }: CorporatePolicyModalProps) {
  const [formData, setFormData] = useState({
    title: policy?.title || '',
    category: policy?.category || '',
    description: policy?.description || '',
    content: policy?.content || '',
    version: policy?.version || '1.0',
    effective_date: policy?.effective_date ? new Date(policy.effective_date) : new Date(),
    review_date: policy?.review_date ? new Date(policy.review_date) : null,
    approval_date: policy?.approval_date ? new Date(policy.approval_date) : null,
    status: policy?.status || 'Rascunho',
    file_path: policy?.file_path || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const policyData = {
        ...formData,
        effective_date: format(formData.effective_date, 'yyyy-MM-dd'),
        review_date: formData.review_date ? format(formData.review_date, 'yyyy-MM-dd') : undefined,
        approval_date: formData.approval_date ? format(formData.approval_date, 'yyyy-MM-dd') : undefined,
      };

      if (policy) {
        await updateCorporatePolicy(policy.id, policyData);
        toast({
          title: "Sucesso",
          description: "Política atualizada com sucesso!",
        });
      } else {
        await createCorporatePolicy(policyData as any);
        toast({
          title: "Sucesso",
          description: "Política criada com sucesso!",
        });
      }

      onUpdate();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar política",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getReviewDate = (effectiveDate: Date) => {
    const reviewDate = new Date(effectiveDate);
    reviewDate.setFullYear(reviewDate.getFullYear() + 1);
    return reviewDate;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {policy ? 'Editar Política' : 'Nova Política Corporativa'}
          </DialogTitle>
          <DialogDescription>
            {policy ? 'Edite as informações da política corporativa' : 'Crie uma nova política corporativa'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título da Política *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Política de Sustentabilidade"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sustentabilidade">Sustentabilidade</SelectItem>
                      <SelectItem value="ESG">ESG</SelectItem>
                      <SelectItem value="Código de Conduta">Código de Conduta</SelectItem>
                      <SelectItem value="Anticorrupção">Anticorrupção</SelectItem>
                      <SelectItem value="Diversidade e Inclusão">Diversidade e Inclusão</SelectItem>
                      <SelectItem value="Segurança do Trabalho">Segurança do Trabalho</SelectItem>
                      <SelectItem value="Privacidade de Dados">Privacidade de Dados</SelectItem>
                      <SelectItem value="Governança Corporativa">Governança Corporativa</SelectItem>
                      <SelectItem value="Gestão de Riscos">Gestão de Riscos</SelectItem>
                      <SelectItem value="Compliance">Compliance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="version">Versão</Label>
                  <Input
                    id="version"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="Ex: 1.0, 2.1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Rascunho">Rascunho</SelectItem>
                      <SelectItem value="Em Revisão">Em Revisão</SelectItem>
                      <SelectItem value="Aprovada">Aprovada</SelectItem>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Arquivada">Arquivada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Datas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Controle de Datas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="effective_date">Data de Vigência *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.effective_date, 'dd/MM/yyyy')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.effective_date}
                        onSelect={(date) => {
                          if (date) {
                            setFormData({ 
                              ...formData, 
                              effective_date: date,
                              review_date: formData.review_date || getReviewDate(date)
                            });
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review_date">Data de Revisão</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.review_date ? format(formData.review_date, 'dd/MM/yyyy') : 'Selecionar data'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.review_date}
                        onSelect={(date) => setFormData({ ...formData, review_date: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="approval_date">Data de Aprovação</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.approval_date ? format(formData.approval_date, 'dd/MM/yyyy') : 'Selecionar data'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.approval_date}
                        onSelect={(date) => setFormData({ ...formData, approval_date: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file_path">Arquivo da Política</Label>
                  <div className="flex gap-2">
                    <Input
                      id="file_path"
                      value={formData.file_path}
                      onChange={(e) => setFormData({ ...formData, file_path: e.target.value })}
                      placeholder="URL ou caminho do arquivo"
                    />
                    <Button type="button" variant="outline" size="sm">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Descrição */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Descrição</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descrição do objetivo e escopo da política..."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Conteúdo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conteúdo da Política</CardTitle>
              <CardDescription>
                Conteúdo completo da política (diretrizes, procedimentos, responsabilidades)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Conteúdo detalhado da política..."
                rows={10}
                className="min-h-[200px]"
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Salvando...
                </div>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {policy ? 'Atualizar' : 'Criar'} Política
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}