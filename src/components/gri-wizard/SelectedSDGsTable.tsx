import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { SDG_DATA } from '@/constants/sdgData';

interface SDGDetails {
  sdg_number: number;
  selected_targets: string[];
  impact_level: 'Alto' | 'Médio' | 'Baixo';
  actions_taken?: string;
  results_achieved?: string;
  future_commitments?: string;
  kpis?: Array<{
    indicator: string;
    baseline: number;
    target: number;
    current: number;
    unit: string;
  }>;
}

interface SelectedSDGsTableProps {
  selectedSDGs: number[];
  sdgDetails: Map<number, SDGDetails>;
  onEdit: (sdgNumber: number) => void;
  onRemove: (sdgNumber: number) => void;
}

export function SelectedSDGsTable({ 
  selectedSDGs, 
  sdgDetails, 
  onEdit, 
  onRemove 
}: SelectedSDGsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (sdgNumber: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sdgNumber)) {
        newSet.delete(sdgNumber);
      } else {
        newSet.add(sdgNumber);
      }
      return newSet;
    });
  };

  const getImpactColor = (level?: string) => {
    switch (level) {
      case 'Alto': return 'bg-green-100 text-green-700 border-green-300';
      case 'Médio': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Baixo': return 'bg-orange-100 text-orange-700 border-orange-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getImpactEmoji = (level?: string) => {
    switch (level) {
      case 'Alto': return '🟢';
      case 'Médio': return '🟡';
      case 'Baixo': return '🟠';
      default: return '⚪';
    }
  };

  if (selectedSDGs.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ODS Prioritários Selecionados ({selectedSDGs.length})</CardTitle>
        <CardDescription>
          Gerencie os detalhes de cada ODS e suas configurações
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="w-[80px]">ODS</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="w-[120px]">Contribuição</TableHead>
                <TableHead className="w-[120px]">Metas</TableHead>
                <TableHead className="w-[100px]">KPIs</TableHead>
                <TableHead className="w-[150px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedSDGs.map(sdgNumber => {
                const sdg = SDG_DATA.find(s => s.number === sdgNumber);
                const details = sdgDetails.get(sdgNumber);
                const isExpanded = expandedRows.has(sdgNumber);
                const isConfigured = details && details.selected_targets.length > 0;

                if (!sdg) return null;

                return (
                  <>
                    <TableRow key={sdgNumber} className={isExpanded ? 'border-b-0' : ''}>
                      <TableCell>
                        {isConfigured && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRow(sdgNumber)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-xl text-white shadow-sm"
                          style={{ backgroundColor: sdg.color }}
                        >
                          {sdg.icon}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">ODS {sdg.number}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {sdg.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getImpactColor(details?.impact_level)}
                        >
                          {getImpactEmoji(details?.impact_level)} {details?.impact_level || 'Não definido'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isConfigured ? (
                          <Badge variant="secondary">
                            {details.selected_targets.length} de {sdg.targets.length}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Não configurado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {details?.kpis && details.kpis.length > 0 ? (
                          <Badge variant="secondary">{details.kpis.length}</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(sdgNumber)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemove(sdgNumber)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {isConfigured && isExpanded && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/50 p-6">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2 text-sm">Metas Selecionadas:</h4>
                              <div className="flex flex-wrap gap-2">
                                {details.selected_targets.map(targetCode => {
                                  const target = sdg.targets.find(t => t.code === targetCode);
                                  return target ? (
                                    <Badge key={targetCode} variant="outline">
                                      {targetCode}: {target.description}
                                    </Badge>
                                  ) : null;
                                })}
                              </div>
                            </div>

                            {details.actions_taken && (
                              <div>
                                <h4 className="font-semibold mb-2 text-sm">Ações Realizadas:</h4>
                                <p className="text-sm text-muted-foreground">
                                  {details.actions_taken}
                                </p>
                              </div>
                            )}

                            {details.results_achieved && (
                              <div>
                                <h4 className="font-semibold mb-2 text-sm">Resultados Alcançados:</h4>
                                <p className="text-sm text-muted-foreground">
                                  {details.results_achieved}
                                </p>
                              </div>
                            )}

                            {details.kpis && details.kpis.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2 text-sm">Indicadores (KPIs):</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {details.kpis.map((kpi, index) => (
                                    <Card key={index}>
                                      <CardContent className="pt-4">
                                        <div className="text-sm font-medium mb-2">{kpi.indicator}</div>
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                          <span>Linha Base: {kpi.baseline} {kpi.unit}</span>
                                          <span>Meta: {kpi.target} {kpi.unit}</span>
                                          <span>Atual: {kpi.current} {kpi.unit}</span>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
