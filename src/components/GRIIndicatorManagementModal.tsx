import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Settings,
  Link,
  Target,
  Database,
  Bot,
  FileText,
  Plus,
  Trash,
  Edit
} from "lucide-react";

interface GRIIndicatorManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicators: any[];
}

export function GRIIndicatorManagementModal({ 
  isOpen, 
  onClose, 
  indicators 
}: GRIIndicatorManagementModalProps) {
  const [activeTab, setActiveTab] = useState("mappings");

  const mappingTypes = [
    { value: "direct", label: "Direto", description: "Valor copiado diretamente" },
    { value: "calculated", label: "Calculado", description: "Aplicar fórmula de cálculo" },
    { value: "aggregated", label: "Agregado", description: "Somar/agregar múltiplos valores" }
  ];

  const sourceTables = [
    { value: "calculated_emissions", label: "Emissões Calculadas" },
    { value: "activity_data", label: "Dados de Atividade" },
    { value: "emission_sources", label: "Fontes de Emissão" },
    { value: "assets", label: "Ativos" },
    { value: "esg_metrics", label: "Métricas ESG" }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Gerenciamento de Indicadores GRI
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="mappings">Mapeamentos</TabsTrigger>
            <TabsTrigger value="targets">Metas</TabsTrigger>
            <TabsTrigger value="validations">Validações</TabsTrigger>
            <TabsTrigger value="automations">Automações</TabsTrigger>
          </TabsList>

          {/* Data Mappings Tab */}
          <TabsContent value="mappings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  Mapeamento de Dados
                </CardTitle>
                <CardDescription>
                  Configure como os dados existentes alimentam automaticamente os indicadores GRI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Create New Mapping */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Novo Mapeamento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Indicador GRI</Label>
                        <select className="w-full p-2 border rounded-md">
                          <option value="">Selecione um indicador...</option>
                          {indicators.map((indicator) => (
                            <option key={indicator.id} value={indicator.id}>
                              {indicator.code} - {indicator.title || indicator.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Tabela de Origem</Label>
                        <select className="w-full p-2 border rounded-md">
                          <option value="">Selecione uma tabela...</option>
                          {sourceTables.map((table) => (
                            <option key={table.value} value={table.value}>
                              {table.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Coluna</Label>
                        <Input placeholder="Nome da coluna (ex: total_co2e)" />
                      </div>

                      <div className="space-y-2">
                        <Label>Tipo de Mapeamento</Label>
                        <select className="w-full p-2 border rounded-md">
                          {mappingTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label} - {type.description}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Fórmula (opcional)</Label>
                        <Input placeholder="Ex: SUM(total_co2e) / 1000" />
                      </div>

                      <Button className="w-full gap-2">
                        <Plus className="h-4 w-4" />
                        Criar Mapeamento
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Existing Mappings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Mapeamentos Existentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Sample mapping */}
                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">GRI 305-1</Badge>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Trash className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm font-medium">Emissões Diretas (Escopo 1)</p>
                          <p className="text-xs text-muted-foreground">
                            calculated_emissions.total_co2e → Soma automática
                          </p>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            Ativo
                          </Badge>
                        </div>

                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">GRI 302-1</Badge>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Trash className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm font-medium">Consumo de Energia</p>
                          <p className="text-xs text-muted-foreground">
                            activity_data.quantity → Agregação por categoria
                          </p>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            Ativo
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Targets Tab */}
          <TabsContent value="targets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Gestão de Metas
                </CardTitle>
                <CardDescription>
                  Defina metas e acompanhe o progresso dos indicadores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Create New Target */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Nova Meta</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Indicador</Label>
                        <select className="w-full p-2 border rounded-md">
                          <option value="">Selecione um indicador...</option>
                          {indicators.map((indicator) => (
                            <option key={indicator.id} value={indicator.id}>
                              {indicator.code} - {indicator.title || indicator.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Ano da Meta</Label>
                          <Input type="number" placeholder="2025" />
                        </div>
                        <div className="space-y-2">
                          <Label>Valor da Meta</Label>
                          <Input type="number" placeholder="1000" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Baseline (Valor)</Label>
                          <Input type="number" placeholder="1200" />
                        </div>
                        <div className="space-y-2">
                          <Label>Baseline (Ano)</Label>
                          <Input type="number" placeholder="2023" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Input placeholder="Reduzir emissões em 20% até 2025" />
                      </div>

                      <Button className="w-full gap-2">
                        <Plus className="h-4 w-4" />
                        Criar Meta
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Existing Targets */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Metas Existentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">GRI 305-1</Badge>
                            <Badge variant="secondary">2025</Badge>
                          </div>
                          <p className="text-sm font-medium">Meta: 800 tCO2e</p>
                          <p className="text-xs text-muted-foreground mb-2">
                            Baseline: 1200 tCO2e (2023)
                          </p>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span>Progresso</span>
                              <span>25%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{width: '25%'}}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Validations Tab */}
          <TabsContent value="validations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Regras de Validação
                </CardTitle>
                <CardDescription>
                  Configure validações automáticas para garantir a qualidade dos dados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Em desenvolvimento - Funcionalidade para criar regras de validação personalizadas
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Automations Tab */}
          <TabsContent value="automations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Automações
                </CardTitle>
                <CardDescription>
                  Configure automações para preenchimento e alertas inteligentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Preenchimento Automático</p>
                      <p className="text-sm text-muted-foreground">
                        Preencher automaticamente indicadores com dados disponíveis
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Alertas de Prazo</p>
                      <p className="text-sm text-muted-foreground">
                        Notificar sobre prazos de preenchimento de indicadores
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Sugestões por IA</p>
                      <p className="text-sm text-muted-foreground">
                        Sugerir valores baseados em dados históricos e benchmarks
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button>
            Salvar Configurações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
