import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ESGRisk } from "@/services/esgRisks";
import { 
  AlertTriangle, 
  Calendar, 
  User, 
  Shield, 
  Target, 
  TrendingUp,
  FileText,
  Activity,
  CheckCircle,
  Clock,
  X
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RiskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  risk: ESGRisk | null;
  onEdit?: () => void;
}

export function RiskDetailsModal({ isOpen, onClose, risk, onEdit }: RiskDetailsModalProps) {
  if (!risk) return null;

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Crítico': return 'bg-red-100 text-red-800 border-red-200';
      case 'Alto': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Médio': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Baixo': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Muito Baixo': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Ambiental': return 'bg-green-100 text-green-800 border-green-200';
      case 'Social': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Governança': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-green-100 text-green-800';
      case 'Inativo': return 'bg-gray-100 text-gray-800';
      case 'Em Monitoramento': return 'bg-yellow-100 text-yellow-800';
      case 'Mitigado': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateResidualRisk = () => {
    if (!risk.residual_probability || !risk.residual_impact) return null;
    
    const probIndex = ['Baixa', 'Média', 'Alta'].indexOf(risk.residual_probability);
    const impactIndex = ['Baixo', 'Médio', 'Alto'].indexOf(risk.residual_impact);
    const riskLevel = probIndex + impactIndex;
    
    if (riskLevel >= 4) return 'Crítico';
    if (riskLevel >= 3) return 'Alto';
    if (riskLevel >= 2) return 'Médio';
    if (riskLevel >= 1) return 'Baixo';
    return 'Muito Baixo';
  };

  const residualRiskLevel = calculateResidualRisk();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Detalhes do Risco ESG
            </DialogTitle>
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button onClick={onEdit} variant="outline" size="sm">
                  Editar
                </Button>
              )}
              <Button onClick={onClose} variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="assessment">Avaliação</TabsTrigger>
            <TabsTrigger value="controls">Controles</TabsTrigger>
            <TabsTrigger value="timeline">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Header do Risco */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold">{risk.risk_title}</h2>
                      <div className="flex items-center gap-2">
                        <Badge className={getRiskLevelColor(risk.inherent_risk_level || 'Indefinido')}>
                          {risk.inherent_risk_level || 'Indefinido'}
                        </Badge>
                        <Badge className={getCategoryColor(risk.esg_category)}>
                          {risk.esg_category}
                        </Badge>
                        <Badge className={getStatusColor(risk.status)}>
                          {risk.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>Criado em: {format(new Date(risk.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                      <p>Atualizado: {format(new Date(risk.updated_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                    </div>
                  </div>
                  
                  {risk.risk_description && (
                    <div className="pt-4 border-t">
                      <h3 className="font-medium mb-2">Descrição</h3>
                      <p className="text-muted-foreground">{risk.risk_description}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Informações Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Responsabilidade
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {risk.risk_owner && (
                    <div>
                      <p className="text-sm font-medium">Proprietário do Risco</p>
                      <p className="text-muted-foreground">{risk.risk_owner}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">Frequência de Revisão</p>
                    <p className="text-muted-foreground">{risk.review_frequency || 'Não definida'}</p>
                  </div>
                  {risk.next_review_date && (
                    <div>
                      <p className="text-sm font-medium">Próxima Revisão</p>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(risk.next_review_date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Classificação de Risco
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Probabilidade</p>
                      <Badge variant="outline" className={
                        risk.probability === 'Alta' ? 'border-red-200 text-red-700' :
                        risk.probability === 'Média' ? 'border-yellow-200 text-yellow-700' :
                        'border-green-200 text-green-700'
                      }>
                        {risk.probability}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Impacto</p>
                      <Badge variant="outline" className={
                        risk.impact === 'Alto' ? 'border-red-200 text-red-700' :
                        risk.impact === 'Médio' ? 'border-yellow-200 text-yellow-700' :
                        'border-green-200 text-green-700'
                      }>
                        {risk.impact}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Nível de Risco Inerente</p>
                    <Badge className={getRiskLevelColor(risk.inherent_risk_level || 'Indefinido')}>
                      {risk.inherent_risk_level || 'Indefinido'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="assessment" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Impacto nos Negócios */}
              {risk.business_impact && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Impacto nos Negócios
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{risk.business_impact}</p>
                  </CardContent>
                </Card>
              )}

              {/* Impacto Regulatório */}
              {risk.regulatory_impact && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Impacto Regulatório
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{risk.regulatory_impact}</p>
                  </CardContent>
                </Card>
              )}

              {/* Impacto Reputacional */}
              {risk.reputation_impact && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Impacto Reputacional
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{risk.reputation_impact}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Risco Residual */}
            {residualRiskLevel && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Risco Residual (Após Controles)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium">Probabilidade Residual</p>
                      <Badge variant="outline">{risk.residual_probability}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Impacto Residual</p>
                      <Badge variant="outline">{risk.residual_impact}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Nível de Risco Residual</p>
                      <Badge className={getRiskLevelColor(residualRiskLevel)}>
                        {residualRiskLevel}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="controls" className="space-y-6">
            {/* Medidas de Controle */}
            {risk.control_measures && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Medidas de Controle
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{risk.control_measures}</p>
                </CardContent>
              </Card>
            )}

            {/* Ações de Mitigação */}
            {risk.mitigation_actions && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Ações de Mitigação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{risk.mitigation_actions}</p>
                </CardContent>
              </Card>
            )}

            {/* Plano de Tratamento */}
            {risk.treatment_plan && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Plano de Tratamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{risk.treatment_plan}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Histórico de Alterações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 pb-4 border-b">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Risco criado</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(risk.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  
                  {risk.updated_at !== risk.created_at && (
                    <div className="flex items-start gap-3 pb-4 border-b">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Última atualização</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(risk.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Placeholder para futuros eventos do histórico */}
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Histórico detalhado em desenvolvimento</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}