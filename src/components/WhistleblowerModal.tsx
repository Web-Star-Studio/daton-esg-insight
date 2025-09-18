import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Shield, Save, AlertTriangle, Eye, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { createWhistleblowerReport, updateWhistleblowerReport, WhistleblowerReport } from "@/services/governance";

interface WhistleblowerModalProps {
  isOpen: boolean;
  onClose: () => void;
  report?: WhistleblowerReport | null;
  onUpdate: () => void;
  mode?: 'create' | 'view' | 'investigate';
}

export function WhistleblowerModal({ isOpen, onClose, report, onUpdate, mode = 'create' }: WhistleblowerModalProps) {
  const [formData, setFormData] = useState({
    category: report?.category || '',
    description: report?.description || '',
    incident_date: report?.incident_date ? new Date(report.incident_date) : null,
    location: report?.location || '',
    people_involved: report?.people_involved || '',
    evidence_description: report?.evidence_description || '',
    is_anonymous: report?.is_anonymous ?? true,
    reporter_name: report?.reporter_name || '',
    reporter_email: report?.reporter_email || '',
    reporter_phone: report?.reporter_phone || '',
    status: report?.status || 'Nova',
    priority: report?.priority || 'Média',
    assigned_to_user_id: report?.assigned_to_user_id || '',
    investigation_notes: report?.investigation_notes || '',
    resolution_summary: report?.resolution_summary || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isReadOnly = mode === 'view';
  const isInvestigation = mode === 'investigate';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const reportData = {
        ...formData,
        incident_date: formData.incident_date ? format(formData.incident_date, 'yyyy-MM-dd') : undefined,
        // Remove campos do denunciante se for anônimo
        reporter_name: formData.is_anonymous ? null : formData.reporter_name,
        reporter_email: formData.is_anonymous ? null : formData.reporter_email,
        reporter_phone: formData.is_anonymous ? null : formData.reporter_phone,
      };

      if (report) {
        await updateWhistleblowerReport(report.id, reportData);
        toast({
          title: "Sucesso",
          description: "Denúncia atualizada com sucesso!",
        });
      } else {
        await createWhistleblowerReport(reportData as any);
        toast({
          title: "Sucesso",
          description: "Denúncia registrada com sucesso! Você receberá um código de acompanhamento.",
        });
      }

      onUpdate();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar denúncia",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta':
        return 'bg-red-100 text-red-800';
      case 'Média':
        return 'bg-yellow-100 text-yellow-800';
      case 'Baixa':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Nova':
        return 'bg-blue-100 text-blue-800';
      case 'Em Investigação':
        return 'bg-yellow-100 text-yellow-800';
      case 'Concluída':
        return 'bg-green-100 text-green-800';
      case 'Fechada':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'view' ? (
              <Eye className="h-5 w-5" />
            ) : mode === 'investigate' ? (
              <MessageSquare className="h-5 w-5" />
            ) : (
              <Shield className="h-5 w-5" />
            )}
            {mode === 'view' 
              ? `Denúncia ${report?.report_code}`
              : mode === 'investigate'
              ? `Investigar - ${report?.report_code}`
              : 'Nova Denúncia'
            }
          </DialogTitle>
          <DialogDescription>
            {mode === 'view' 
              ? 'Visualizar detalhes da denúncia'
              : mode === 'investigate'
              ? 'Gerenciar investigação da denúncia'
              : 'Registre uma denúncia de forma segura e confidencial'
            }
          </DialogDescription>
        </DialogHeader>

        {report && (
          <div className="flex gap-2 mb-4">
            <Badge className={getStatusColor(report.status)}>
              {report.status}
            </Badge>
            <Badge className={getPriorityColor(report.priority)}>
              Prioridade {report.priority}
            </Badge>
            {report.is_anonymous && (
              <Badge variant="secondary">
                <Shield className="h-3 w-3 mr-1" />
                Anônima
              </Badge>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações da Denúncia */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações da Denúncia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Assédio Moral">Assédio Moral</SelectItem>
                    <SelectItem value="Assédio Sexual">Assédio Sexual</SelectItem>
                    <SelectItem value="Discriminação">Discriminação</SelectItem>
                    <SelectItem value="Corrupção">Corrupção</SelectItem>
                    <SelectItem value="Fraude">Fraude</SelectItem>
                    <SelectItem value="Conflito de Interesses">Conflito de Interesses</SelectItem>
                    <SelectItem value="Violação de Segurança">Violação de Segurança</SelectItem>
                    <SelectItem value="Questões Ambientais">Questões Ambientais</SelectItem>
                    <SelectItem value="Violação de Dados">Violação de Dados</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição Detalhada *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva detalhadamente o ocorrido, incluindo contexto, pessoas envolvidas e impactos..."
                  rows={6}
                  required
                  disabled={isReadOnly}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="incident_date">Data do Incidente</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left" disabled={isReadOnly}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.incident_date ? format(formData.incident_date, 'dd/MM/yyyy') : 'Selecionar data'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.incident_date}
                        onSelect={(date) => setFormData({ ...formData, incident_date: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Local</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ex: Escritório, Fábrica, Reunião online..."
                    disabled={isReadOnly}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="people_involved">Pessoas Envolvidas</Label>
                <Textarea
                  id="people_involved"
                  value={formData.people_involved}
                  onChange={(e) => setFormData({ ...formData, people_involved: e.target.value })}
                  placeholder="Liste as pessoas envolvidas (sem necessariamente identificá-las nominalmente)..."
                  rows={3}
                  disabled={isReadOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="evidence_description">Evidências Disponíveis</Label>
                <Textarea
                  id="evidence_description"
                  value={formData.evidence_description}
                  onChange={(e) => setFormData({ ...formData, evidence_description: e.target.value })}
                  placeholder="Descreva evidências disponíveis (documentos, e-mails, áudios, testemunhas, etc.)..."
                  rows={3}
                  disabled={isReadOnly}
                />
              </div>
            </CardContent>
          </Card>

          {/* Informações do Denunciante (apenas se não for modo de visualização) */}
          {!isReadOnly && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações do Denunciante</CardTitle>
                <CardDescription>
                  Suas informações são opcionais e serão mantidas em sigilo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_anonymous"
                    checked={formData.is_anonymous}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_anonymous: checked })}
                  />
                  <Label htmlFor="is_anonymous">Denúncia Anônima</Label>
                </div>

                {!formData.is_anonymous && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reporter_name">Nome</Label>
                      <Input
                        id="reporter_name"
                        value={formData.reporter_name}
                        onChange={(e) => setFormData({ ...formData, reporter_name: e.target.value })}
                        placeholder="Seu nome completo"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reporter_email">E-mail</Label>
                      <Input
                        id="reporter_email"
                        type="email"
                        value={formData.reporter_email}
                        onChange={(e) => setFormData({ ...formData, reporter_email: e.target.value })}
                        placeholder="seu@email.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reporter_phone">Telefone</Label>
                      <Input
                        id="reporter_phone"
                        value={formData.reporter_phone}
                        onChange={(e) => setFormData({ ...formData, reporter_phone: e.target.value })}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Investigação (apenas para modo investigação) */}
          {isInvestigation && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gestão da Investigação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <SelectItem value="Nova">Nova</SelectItem>
                        <SelectItem value="Em Investigação">Em Investigação</SelectItem>
                        <SelectItem value="Concluída">Concluída</SelectItem>
                        <SelectItem value="Fechada">Fechada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baixa">Baixa</SelectItem>
                        <SelectItem value="Média">Média</SelectItem>
                        <SelectItem value="Alta">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assigned_to_user_id">Responsável</Label>
                    <Input
                      id="assigned_to_user_id"
                      value={formData.assigned_to_user_id}
                      onChange={(e) => setFormData({ ...formData, assigned_to_user_id: e.target.value })}
                      placeholder="ID do responsável"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="investigation_notes">Notas da Investigação</Label>
                  <Textarea
                    id="investigation_notes"
                    value={formData.investigation_notes}
                    onChange={(e) => setFormData({ ...formData, investigation_notes: e.target.value })}
                    placeholder="Registre aqui o progresso da investigação, entrevistas realizadas, evidências coletadas..."
                    rows={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resolution_summary">Resumo da Resolução</Label>
                  <Textarea
                    id="resolution_summary"
                    value={formData.resolution_summary}
                    onChange={(e) => setFormData({ ...formData, resolution_summary: e.target.value })}
                    placeholder="Descreva as ações tomadas e a resolução final do caso..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {isReadOnly ? 'Fechar' : 'Cancelar'}
            </Button>
            {!isReadOnly && (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Salvando...
                  </div>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {report ? 'Atualizar' : 'Registrar'} Denúncia
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}