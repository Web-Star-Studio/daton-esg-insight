import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Trash2, Plus, Save } from 'lucide-react';
import { SDGInfo } from '@/constants/sdgData';
import { toast } from 'sonner';

interface KPI {
  id: string;
  indicator: string;
  baseline: number;
  target: number;
  current: number;
  unit: string;
}

interface SDGDetailModalProps {
  sdg: SDGInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    sdg_number: number;
    selected_targets: string[];
    impact_level: 'Alto' | 'Médio' | 'Baixo';
    actions_taken?: string;
    results_achieved?: string;
    future_commitments?: string;
    evidence_documents?: string[];
    kpis?: KPI[];
  }) => void;
  initialData?: {
    selected_targets?: string[];
    impact_level?: 'Alto' | 'Médio' | 'Baixo';
    actions_taken?: string;
    results_achieved?: string;
    future_commitments?: string;
    evidence_documents?: string[];
    kpis?: KPI[];
  };
}

export function SDGDetailModal({ 
  sdg, 
  isOpen, 
  onClose, 
  onSave,
  initialData 
}: SDGDetailModalProps) {
  const [selectedTargets, setSelectedTargets] = useState<string[]>(initialData?.selected_targets || []);
  const [impactLevel, setImpactLevel] = useState<'Alto' | 'Médio' | 'Baixo'>(initialData?.impact_level || 'Médio');
  const [actionsTaken, setActionsTaken] = useState(initialData?.actions_taken || '');
  const [resultsAchieved, setResultsAchieved] = useState(initialData?.results_achieved || '');
  const [futureCommitments, setFutureCommitments] = useState(initialData?.future_commitments || '');
  const [kpis, setKpis] = useState<KPI[]>(initialData?.kpis || []);
  const [activeTab, setActiveTab] = useState('description');

  if (!sdg) return null;

  const toggleTarget = (targetCode: string) => {
    setSelectedTargets(prev =>
      prev.includes(targetCode)
        ? prev.filter(t => t !== targetCode)
        : [...prev, targetCode]
    );
  };

  const addKPI = () => {
    const newKPI: KPI = {
      id: crypto.randomUUID(),
      indicator: '',
      baseline: 0,
      target: 0,
      current: 0,
      unit: ''
    };
    setKpis([...kpis, newKPI]);
  };

  const updateKPI = (id: string, field: keyof KPI, value: any) => {
    setKpis(kpis.map(kpi => 
      kpi.id === id ? { ...kpi, [field]: value } : kpi
    ));
  };

  const removeKPI = (id: string) => {
    setKpis(kpis.filter(kpi => kpi.id !== id));
  };

  const handleSave = () => {
    if (selectedTargets.length === 0) {
      toast.error('Selecione pelo menos uma meta');
      return;
    }

    onSave({
      sdg_number: sdg.number,
      selected_targets: selectedTargets,
      impact_level: impactLevel,
      actions_taken: actionsTaken,
      results_achieved: resultsAchieved,
      future_commitments: futureCommitments,
      kpis: kpis.filter(kpi => kpi.indicator.trim() !== '')
    });

    toast.success(`ODS ${sdg.number} configurado com sucesso!`);
    onClose();
  };

  const getImpactLevelValue = (level: string) => {
    switch (level) {
      case 'Alto': return 3;
      case 'Médio': return 2;
      case 'Baixo': return 1;
      default: return 2;
    }
  };

  const getImpactLevelFromValue = (value: number): 'Alto' | 'Médio' | 'Baixo' => {
    if (value === 3) return 'Alto';
    if (value === 1) return 'Baixo';
    return 'Médio';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl text-white shadow-lg"
              style={{ backgroundColor: sdg.color }}
            >
              {sdg.icon}
            </div>
            <div>
              <DialogTitle className="text-2xl">
                ODS {sdg.number} - {sdg.name}
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                {sdg.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="description">Descrição</TabsTrigger>
            <TabsTrigger value="targets">
              Metas {selectedTargets.length > 0 && `(${selectedTargets.length})`}
            </TabsTrigger>
            <TabsTrigger value="contribution">Contribuição</TabsTrigger>
            <TabsTrigger value="kpis">KPIs</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sobre este ODS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {sdg.longDescription}
                </p>

                {sdg.globalPactPrinciples && sdg.globalPactPrinciples.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      🤝 Relação com Pacto Global
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {sdg.globalPactPrinciples.map(principle => (
                        <Badge key={principle} variant="outline">
                          Princípio {principle}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Total de Metas</h4>
                  <p className="text-sm text-muted-foreground">
                    Este ODS possui <strong>{sdg.targets.length} metas</strong> específicas da Agenda 2030.
                    Selecione as metas relevantes para sua organização na aba "Metas".
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="targets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Selecione as Metas da Agenda 2030
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Marque as metas específicas que sua organização contribui ou pretende contribuir
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sdg.targets.map(target => (
                    <div
                      key={target.code}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-muted/50 ${
                        selectedTargets.includes(target.code)
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
                      onClick={() => toggleTarget(target.code)}
                    >
                      <Checkbox
                        checked={selectedTargets.includes(target.code)}
                        onCheckedChange={() => toggleTarget(target.code)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{target.code}</Badge>
                        </div>
                        <p className="text-sm">{target.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedTargets.length === 0 && (
                  <p className="text-sm text-amber-600 mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    ⚠️ Selecione pelo menos uma meta para continuar
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contribution" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Nível de Contribuição</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Nível de impacto da sua organização neste ODS</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[getImpactLevelValue(impactLevel)]}
                      onValueChange={(value) => setImpactLevel(getImpactLevelFromValue(value[0]))}
                      min={1}
                      max={3}
                      step={1}
                      className="flex-1"
                    />
                    <Badge
                      variant="outline"
                      className={`w-20 justify-center ${
                        impactLevel === 'Alto'
                          ? 'bg-green-100 text-green-700 border-green-300'
                          : impactLevel === 'Médio'
                          ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                          : 'bg-orange-100 text-orange-700 border-orange-300'
                      }`}
                    >
                      {impactLevel}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {impactLevel === 'Alto' && '🟢 Contribuição significativa com ações estruturadas e resultados mensuráveis'}
                    {impactLevel === 'Médio' && '🟡 Contribuição moderada com algumas iniciativas implementadas'}
                    {impactLevel === 'Baixo' && '🟠 Contribuição inicial ou em planejamento'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actions">Ações Realizadas</Label>
                  <Textarea
                    id="actions"
                    placeholder="Descreva as principais ações e iniciativas implementadas pela organização para contribuir com este ODS..."
                    value={actionsTaken}
                    onChange={(e) => setActionsTaken(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="results">Resultados Alcançados</Label>
                  <Textarea
                    id="results"
                    placeholder="Descreva os resultados mensuráveis obtidos até o momento..."
                    value={resultsAchieved}
                    onChange={(e) => setResultsAchieved(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commitments">Compromissos Futuros</Label>
                  <Textarea
                    id="commitments"
                    placeholder="Descreva os compromissos e metas futuras para este ODS..."
                    value={futureCommitments}
                    onChange={(e) => setFutureCommitments(e.target.value)}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kpis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Indicadores de Progresso</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Defina KPIs para monitorar sua contribuição a este ODS
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {kpis.map((kpi, index) => (
                  <Card key={kpi.id} className="border-2">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">KPI #{index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeKPI(kpi.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label>Nome do Indicador</Label>
                        <Input
                          placeholder="Ex: Redução de emissões de CO₂"
                          value={kpi.indicator}
                          onChange={(e) => updateKPI(kpi.id, 'indicator', e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-4 gap-3">
                        <div className="space-y-2">
                          <Label>Linha Base</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={kpi.baseline}
                            onChange={(e) => updateKPI(kpi.id, 'baseline', parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Meta</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={kpi.target}
                            onChange={(e) => updateKPI(kpi.id, 'target', parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Atual</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={kpi.current}
                            onChange={(e) => updateKPI(kpi.id, 'current', parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Unidade</Label>
                          <Input
                            placeholder="tCO₂e"
                            value={kpi.unit}
                            onChange={(e) => updateKPI(kpi.id, 'unit', e.target.value)}
                          />
                        </div>
                      </div>

                      {kpi.baseline > 0 && kpi.target > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Progresso</span>
                            <span>
                              {Math.round(((kpi.current - kpi.baseline) / (kpi.target - kpi.baseline)) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    ((kpi.current - kpi.baseline) / (kpi.target - kpi.baseline)) * 100
                                  )
                                )}%`
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={addKPI}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar KPI
                </Button>

                {kpis.length === 0 && (
                  <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p className="text-sm">Nenhum KPI definido ainda</p>
                    <p className="text-xs mt-1">Clique em "Adicionar KPI" para começar</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-6 border-t mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Salvar Configuração
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
