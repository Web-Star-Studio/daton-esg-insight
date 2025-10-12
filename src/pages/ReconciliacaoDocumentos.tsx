import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Bot, 
  FileText, 
  AlertTriangle,
  Edit,
  Download,
  Clock,
  TrendingUp,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  getPendingExtractions, 
  approveExtractedData, 
  rejectExtractedData,
  getAIProcessingStats,
  ExtractedDataPreview,
  getDocumentTypeLabel,
  getConfidenceBadgeVariant,
  formatConfidenceScore
} from '@/services/documentAI';

interface StatsData {
  totalProcessed: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  averageConfidence: number;
}

export const ReconciliacaoDocumentos = () => {
  const [pendingExtractions, setPendingExtractions] = useState<ExtractedDataPreview[]>([]);
  const [selectedExtraction, setSelectedExtraction] = useState<ExtractedDataPreview | null>(null);
  const [editedData, setEditedData] = useState<Record<string, any>>({});
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState<StatsData>({
    totalProcessed: 0,
    pendingApproval: 0,
    approved: 0,
    rejected: 0,
    averageConfidence: 0
  });
  // SEO
  useEffect(() => {
    document.title = 'Reconciliação de Documentos IA | Revisão e Aprovação';
    const desc = 'Revise, edite e aprove dados extraídos automaticamente pela IA com confiança e controle.';
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (meta) meta.setAttribute('content', desc);
    else {
      meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = desc;
      document.head.appendChild(meta);
    }
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const href = `${window.location.origin}/reconciliacao-documentos`;
    if (canonical) canonical.setAttribute('href', href);
    else {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      canonical.href = href;
      document.head.appendChild(canonical);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    try {
      setLoading(true);
      const [extractions, statsData] = await Promise.all([
        getPendingExtractions(),
        getAIProcessingStats()
      ]);
      
      setPendingExtractions(extractions);
      setStats(statsData);
      
      if (extractions.length > 0 && !selectedExtraction) {
        setSelectedExtraction(extractions[0]);
        setEditedData(extractions[0].extracted_fields as Record<string, any>);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedExtraction) return;

    try {
      setProcessing(true);
      
      await approveExtractedData(selectedExtraction.id);
      
      toast.success('Dados aprovados e importados com sucesso!');
      
      // Remover da lista e selecionar próximo
      const updatedList = pendingExtractions.filter(item => item.id !== selectedExtraction.id);
      setPendingExtractions(updatedList);
      
      if (updatedList.length > 0) {
        setSelectedExtraction(updatedList[0]);
        setEditedData(updatedList[0].extracted_fields as Record<string, any>);
      } else {
        setSelectedExtraction(null);
        setEditedData({});
      }
      
      // Atualizar estatísticas
      setStats(prev => ({
        ...prev,
        pendingApproval: prev.pendingApproval - 1,
        approved: prev.approved + 1
      }));
      
    } catch (error) {
      console.error('Error approving data:', error);
      toast.error('Erro ao aprovar dados');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedExtraction) return;

    try {
      setProcessing(true);
      
      await rejectExtractedData(selectedExtraction.id, rejectionNotes);
      
      toast.success('Dados rejeitados');
      
      // Remover da lista e selecionar próximo
      const updatedList = pendingExtractions.filter(item => item.id !== selectedExtraction.id);
      setPendingExtractions(updatedList);
      
      if (updatedList.length > 0) {
        setSelectedExtraction(updatedList[0]);
        setEditedData(updatedList[0].extracted_fields as Record<string, any>);
      } else {
        setSelectedExtraction(null);
        setEditedData({});
      }
      
      setRejectionNotes('');
      
      // Atualizar estatísticas
      setStats(prev => ({
        ...prev,
        pendingApproval: prev.pendingApproval - 1,
        rejected: prev.rejected + 1
      }));
      
    } catch (error) {
      console.error('Error rejecting data:', error);
      toast.error('Erro ao rejeitar dados');
    } finally {
      setProcessing(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const selectExtraction = (extraction: ExtractedDataPreview) => {
    setSelectedExtraction(extraction);
    setEditedData(extraction.extracted_fields as Record<string, any>);
    setRejectionNotes('');
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      'document_type': 'Tipo de Documento',
      'license_number': 'Número da Licença',
      'issue_date': 'Data de Emissão',
      'valid_until': 'Válida Até',
      'process_number': 'Número do Processo',
      'company': 'Empresa',
      'cnpj': 'CNPJ',
      'full_address': 'Endereço Completo',
      'coordinates': 'Coordenadas',
      'activity_description': 'Descrição da Atividade',
      'company_size': 'Porte da Empresa'
    };
    return labels[field] || field;
  };

  const renderFieldEditor = (field: string, value: any, confidence?: number) => {
    // Renderização especial para coordenadas
    if (field === 'coordinates') {
      const coords = typeof value === 'string' ? JSON.parse(value) : value;
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{getFieldLabel(field)}</Label>
            {confidence && (
              <Badge variant={getConfidenceBadgeVariant(confidence)} className="text-xs">
                {formatConfidenceScore(confidence)}
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Latitude</Label>
              <Input
                type="number"
                step="any"
                placeholder="Ex: -23.5505"
                value={coords?.latitude || ''}
                onChange={(e) => handleFieldChange(field, {
                  ...coords,
                  latitude: parseFloat(e.target.value) || null
                })}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Longitude</Label>
              <Input
                type="number"
                step="any"
                placeholder="Ex: -46.6333"
                value={coords?.longitude || ''}
                onChange={(e) => handleFieldChange(field, {
                  ...coords,
                  longitude: parseFloat(e.target.value) || null
                })}
              />
            </div>
          </div>
        </div>
      );
    }

    // Renderização especial para porte da empresa
    if (field === 'company_size') {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{getFieldLabel(field)}</Label>
            {confidence && (
              <Badge variant={getConfidenceBadgeVariant(confidence)} className="text-xs">
                {formatConfidenceScore(confidence)}
              </Badge>
            )}
          </div>
          <Select
            value={editedData[field] || value}
            onValueChange={(newValue) => handleFieldChange(field, newValue)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o porte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Microempresa">Microempresa</SelectItem>
              <SelectItem value="Pequeno Porte">Pequeno Porte</SelectItem>
              <SelectItem value="Médio Porte">Médio Porte</SelectItem>
              <SelectItem value="Grande Porte">Grande Porte</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }

    // Detectar tipo do campo para renderizar input apropriado
    if (typeof value === 'number') {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={field}>{getFieldLabel(field)}</Label>
            {confidence && (
              <Badge variant={getConfidenceBadgeVariant(confidence)} className="text-xs">
                {formatConfidenceScore(confidence)}
              </Badge>
            )}
          </div>
          <Input
            id={field}
            type="number"
            value={editedData[field] || value}
            onChange={(e) => handleFieldChange(field, parseFloat(e.target.value) || 0)}
            step="any"
          />
        </div>
      );
    }

    if (field.includes('date') || field.includes('issue_date') || field.includes('valid_until')) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={field}>{getFieldLabel(field)}</Label>
            {confidence && (
              <Badge variant={getConfidenceBadgeVariant(confidence)} className="text-xs">
                {formatConfidenceScore(confidence)}
              </Badge>
            )}
          </div>
          <Input
            id={field}
            type="date"
            value={editedData[field] || value}
            onChange={(e) => handleFieldChange(field, e.target.value)}
          />
        </div>
      );
    }

    if (field === 'activity_description' || field === 'full_address' || (typeof value === 'string' && value.length > 100)) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={field}>{getFieldLabel(field)}</Label>
            {confidence && (
              <Badge variant={getConfidenceBadgeVariant(confidence)} className="text-xs">
                {formatConfidenceScore(confidence)}
              </Badge>
            )}
          </div>
          <Textarea
            id={field}
            value={editedData[field] || value}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            rows={3}
          />
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={field}>{getFieldLabel(field)}</Label>
          {confidence && (
            <Badge variant={getConfidenceBadgeVariant(confidence)} className="text-xs">
              {formatConfidenceScore(confidence)}
            </Badge>
          )}
        </div>
        <Input
          id={field}
          value={editedData[field] || value}
          onChange={(e) => handleFieldChange(field, e.target.value)}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bot className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Reconciliação de Documentos IA</h1>
            <p className="text-muted-foreground">
                Revise e aprove dados extraídos automaticamente pela IA
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData}>
              <Download className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Processado</p>
                  <p className="text-lg font-semibold">{stats.totalProcessed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Pendente</p>
                  <p className="text-lg font-semibold text-orange-600">{stats.pendingApproval}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Aprovado</p>
                  <p className="text-lg font-semibold text-green-600">{stats.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Rejeitado</p>
                  <p className="text-lg font-semibold text-red-600">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Confiança Média</p>
                  <p className="text-lg font-semibold">{Math.round(stats.averageConfidence * 100)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {pendingExtractions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum documento aguardando revisão</h3>
              <p className="text-muted-foreground">
                Todos os documentos processados pela IA foram revisados.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de Documentos */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">
                  Documentos Pendentes ({pendingExtractions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto">
                  {pendingExtractions.map((extraction) => {
                    const isSelected = selectedExtraction?.id === extraction.id;
                    const confidenceScores = extraction.confidence_scores as Record<string, number>;
                    const avgConfidence = Object.values(confidenceScores).reduce((a, b) => a + b, 0) / Object.values(confidenceScores).length || 0;
                    
                    return (
                      <div
                        key={extraction.id}
                        className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                          isSelected ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        onClick={() => selectExtraction(extraction)}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm truncate">
                              Documento #{extraction.id.slice(0, 8)}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {getDocumentTypeLabel(extraction.target_table)}
                            </Badge>
                            <Badge variant={getConfidenceBadgeVariant(avgConfidence)} className="text-xs">
                              {formatConfidenceScore(avgConfidence)}
                            </Badge>
                          </div>
                          
                          <p className="text-xs text-muted-foreground">
                            {new Date(extraction.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Área de Revisão */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Revisão de Dados</span>
                  {selectedExtraction && (
                    <Badge variant="outline">
                      {getDocumentTypeLabel(selectedExtraction.target_table)}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              
              {selectedExtraction ? (
                <CardContent className="space-y-6">
                  {/* Informações do Documento */}
                  <Alert>
                    <Eye className="h-4 w-4" />
                    <AlertDescription>
                      Revise os dados extraídos abaixo. Você pode editar qualquer campo antes de aprovar.
                      Campos com baixa confiança são destacados e precisam de atenção especial.
                    </AlertDescription>
                  </Alert>

                  <Tabs defaultValue="extracted" className="w-full">
                    <TabsList>
                      <TabsTrigger value="extracted">Dados Extraídos</TabsTrigger>
                      <TabsTrigger value="mappings">Mapeamentos</TabsTrigger>
                    </TabsList>

                    <TabsContent value="extracted" className="space-y-6">
                      {/* Informações Básicas */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">Informações da Licença</h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {['document_type', 'license_number', 'issue_date', 'valid_until', 'process_number'].map((field) => {
                            const value = (selectedExtraction.extracted_fields as Record<string, any>)[field];
                            const confidence = (selectedExtraction.confidence_scores as Record<string, number>)[field];
                            
                            if (!value) return null;
                            
                            return (
                              <div key={field}>
                                {renderFieldEditor(field, value, confidence)}
                                {confidence && confidence < 0.6 && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <AlertTriangle className="h-3 w-3 text-orange-500" />
                                    <span className="text-xs text-orange-600">Baixa confiança - verificar</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Informações da Empresa */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">Informações da Empresa</h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {['company', 'cnpj', 'company_size'].map((field) => {
                            const value = (selectedExtraction.extracted_fields as Record<string, any>)[field];
                            const confidence = (selectedExtraction.confidence_scores as Record<string, number>)[field];
                            
                            if (!value) return null;
                            
                            return (
                              <div key={field}>
                                {renderFieldEditor(field, value, confidence)}
                                {confidence && confidence < 0.6 && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <AlertTriangle className="h-3 w-3 text-orange-500" />
                                    <span className="text-xs text-orange-600">Baixa confiança - verificar</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Localização e Atividade */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">Localização e Atividade</h4>
                        <div className="space-y-4">
                          {['full_address', 'coordinates', 'activity_description'].map((field) => {
                            const value = (selectedExtraction.extracted_fields as Record<string, any>)[field];
                            const confidence = (selectedExtraction.confidence_scores as Record<string, number>)[field];
                            
                            if (!value) return null;
                            
                            return (
                              <div key={field}>
                                {renderFieldEditor(field, value, confidence)}
                                {confidence && confidence < 0.6 && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <AlertTriangle className="h-3 w-3 text-orange-500" />
                                    <span className="text-xs text-orange-600">Baixa confiança - verificar</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Condicionantes */}
                      {selectedExtraction.extracted_fields.conditions && Array.isArray(selectedExtraction.extracted_fields.conditions) && (
                        <div className="space-y-4">
                          <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">
                            Condicionantes ({selectedExtraction.extracted_fields.conditions.length})
                          </h4>
                          <div className="space-y-3">
                            {selectedExtraction.extracted_fields.conditions.map((condition: any, index: number) => (
                              <Card key={index} className="p-4">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Código</Label>
                                    <Input
                                      value={condition.code || ''}
                                      onChange={(e) => {
                                        const newConditions = [...selectedExtraction.extracted_fields.conditions];
                                        newConditions[index] = { ...condition, code: e.target.value };
                                        handleFieldChange('conditions', newConditions);
                                      }}
                                      placeholder="Ex: 2.1"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Categoria</Label>
                                    <Select
                                      value={condition.category || 'Outros'}
                                      onValueChange={(value) => {
                                        const newConditions = [...selectedExtraction.extracted_fields.conditions];
                                        newConditions[index] = { ...condition, category: value };
                                        handleFieldChange('conditions', newConditions);
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Monitoramento">Monitoramento</SelectItem>
                                        <SelectItem value="Gestão de Resíduos">Gestão de Resíduos</SelectItem>
                                        <SelectItem value="Emissões Atmosféricas">Emissões Atmosféricas</SelectItem>
                                        <SelectItem value="Recursos Hídricos">Recursos Hídricos</SelectItem>
                                        <SelectItem value="Ruído">Ruído</SelectItem>
                                        <SelectItem value="Solo">Solo</SelectItem>
                                        <SelectItem value="Vegetação">Vegetação</SelectItem>
                                        <SelectItem value="Relatórios">Relatórios</SelectItem>
                                        <SelectItem value="Outros">Outros</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Prazo (dias)</Label>
                                    <Input
                                      type="number"
                                      value={condition.deadline_days || ''}
                                      onChange={(e) => {
                                        const newConditions = [...selectedExtraction.extracted_fields.conditions];
                                        newConditions[index] = { ...condition, deadline_days: parseInt(e.target.value) || null };
                                        handleFieldChange('conditions', newConditions);
                                      }}
                                      placeholder="Ex: 30"
                                    />
                                  </div>
                                </div>
                                <div className="mt-3">
                                  <Label className="text-xs text-muted-foreground">Texto da Condicionante</Label>
                                  <Textarea
                                    value={condition.text || ''}
                                    onChange={(e) => {
                                      const newConditions = [...selectedExtraction.extracted_fields.conditions];
                                      newConditions[index] = { ...condition, text: e.target.value };
                                      handleFieldChange('conditions', newConditions);
                                    }}
                                    rows={2}
                                    placeholder="Descrição completa da condicionante..."
                                  />
                                </div>
                                {condition.confidence && (
                                  <div className="flex justify-end mt-2">
                                    <Badge variant={getConfidenceBadgeVariant(condition.confidence)} className="text-xs">
                                      {formatConfidenceScore(condition.confidence)}
                                    </Badge>
                                  </div>
                                )}
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="mappings" className="space-y-4">
                      <div className="space-y-3">
                        {Object.entries(selectedExtraction.suggested_mappings as Record<string, string>).map(([field, mapping]) => (
                          <div key={field} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <span className="text-sm font-medium">{field}</span>
                            <span className="text-sm text-muted-foreground">{mapping}</span>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>

                  <Separator />

                  {/* Área de Rejeição */}
                  <div className="space-y-3">
                    <Label>Notas de Rejeição (opcional)</Label>
                    <Textarea
                      placeholder="Descreva o motivo da rejeição..."
                      value={rejectionNotes}
                      onChange={(e) => setRejectionNotes(e.target.value)}
                      disabled={processing}
                    />
                  </div>

                  {/* Ações */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={handleReject}
                      disabled={processing}
                      className="gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Rejeitar
                    </Button>
                    
                    <Button
                      onClick={handleApprove}
                      disabled={processing}
                      className="gap-2"
                    >
                      {processing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Aprovar e Importar
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              ) : (
                <CardContent className="p-8 text-center">
                  <Edit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Selecione um documento</h3>
                  <p className="text-muted-foreground">
                    Escolha um documento da lista para revisar os dados extraídos.
                  </p>
                </CardContent>
              )}
            </Card>
          </div>
        )}
      </>
    );
  };