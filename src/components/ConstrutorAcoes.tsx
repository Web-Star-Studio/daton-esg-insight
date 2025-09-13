import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calculator, Plus, X, Zap, Car, Recycle, Building2, Factory, Sun, Wind } from "lucide-react"
import { CenarioDescarbonizacao, AcaoDescarbonizacao, BIBLIOTECA_ACOES } from "@/services/scenarioPlanning"

interface ConstrutorAcoesProps {
  cenario: CenarioDescarbonizacao
  onAdicionarAcao: (acao: AcaoDescarbonizacao) => void
  onRemoverAcao: (acaoId: string) => void
}

export function ConstrutorAcoes({ cenario, onAdicionarAcao, onRemoverAcao }: ConstrutorAcoesProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [acaoSelecionada, setAcaoSelecionada] = useState<any>(null)
  const [parametros, setParametros] = useState<Record<string, any>>({})

  const categorias = {
    energia: { nome: "Energia", icon: Zap, cor: "bg-yellow-100 text-yellow-700" },
    transporte: { nome: "Transporte", icon: Car, cor: "bg-blue-100 text-blue-700" },
    processos: { nome: "Processos", icon: Factory, cor: "bg-purple-100 text-purple-700" },
    materiais: { nome: "Materiais", icon: Recycle, cor: "bg-green-100 text-green-700" },
    edificacoes: { nome: "Edificações", icon: Building2, cor: "bg-orange-100 text-orange-700" }
  }

  const handleSelecionarAcao = (categoria: string, acao: any) => {
    setAcaoSelecionada({ ...acao, categoria })
    setParametros(acao.parametros_padrao || {})
  }

  const handleAdicionarAcao = () => {
    if (!acaoSelecionada) return

    const novaAcao: AcaoDescarbonizacao = {
      id: Date.now().toString(),
      categoria: acaoSelecionada.categoria,
      tipo: acaoSelecionada.tipo,
      nome: acaoSelecionada.nome,
      parametros,
      cronograma: {
        inicio: new Date(),
        fim: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 ano
      },
      investimento_estimado: calcularInvestimento(acaoSelecionada, parametros),
      reducao_co2e_estimada: calcularReducaoCO2e(acaoSelecionada, parametros),
      status: 'planejada'
    }

    onAdicionarAcao(novaAcao)
    setShowAddModal(false)
    setAcaoSelecionada(null)
    setParametros({})
  }

  const calcularInvestimento = (acao: any, params: Record<string, any>): number => {
    switch (acao.tipo) {
      case "energia-solar":
        return (params.potencia_kw || 0) * acao.custo_por_kw
      case "eletrificacao-frota":
        return (params.numero_veiculos || 0) * acao.custo_por_veiculo
      default:
        return acao.custo_implementacao || 0
    }
  }

  const calcularReducaoCO2e = (acao: any, params: Record<string, any>): number => {
    switch (acao.tipo) {
      case "energia-solar":
        // Assumindo 1.200 kWh/kW/ano no Brasil
        return (params.potencia_kw || 0) * 1200 * acao.fator_reducao_co2e / 1000
      case "eletrificacao-frota":
        return (params.numero_veiculos || 0) * acao.fator_reducao_co2e
      default:
        return params.reducao_co2e || 0
    }
  }

  const renderParametrosAcao = () => {
    if (!acaoSelecionada) return null

    switch (acaoSelecionada.tipo) {
      case "energia-solar":
        return (
          <div className="space-y-4">
            <div>
              <Label>Potência (kW)</Label>
              <Input
                type="number"
                value={parametros.potencia_kw || ''}
                onChange={(e) => setParametros(prev => ({
                  ...prev,
                  potencia_kw: Number(e.target.value)
                }))}
              />
            </div>
            <div>
              <Label>Área disponível (m²)</Label>
              <Input
                type="number"
                value={parametros.area_m2 || ''}
                onChange={(e) => setParametros(prev => ({
                  ...prev,
                  area_m2: Number(e.target.value)
                }))}
              />
            </div>
          </div>
        )
      
      case "eletrificacao-frota":
        return (
          <div className="space-y-4">
            <div>
              <Label>Número de veículos</Label>
              <Input
                type="number"
                value={parametros.numero_veiculos || ''}
                onChange={(e) => setParametros(prev => ({
                  ...prev,
                  numero_veiculos: Number(e.target.value)
                }))}
              />
            </div>
            <div>
              <Label>Tipo de veículo</Label>
              <Select
                value={parametros.tipo_veiculo || ''}
                onValueChange={(value) => setParametros(prev => ({
                  ...prev,
                  tipo_veiculo: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leve">Veículo Leve</SelectItem>
                  <SelectItem value="comercial">Comercial Leve</SelectItem>
                  <SelectItem value="pesado">Veículo Pesado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case "eficiencia-energetica":
        return (
          <div className="space-y-4">
            <div>
              <Label>Redução esperada (%)</Label>
              <Input
                type="number"
                value={parametros.reducao_percentual || ''}
                onChange={(e) => setParametros(prev => ({
                  ...prev,
                  reducao_percentual: Number(e.target.value)
                }))}
              />
            </div>
          </div>
        )

      default:
        return (
          <div>
            <Label>Redução estimada (tCO₂e/ano)</Label>
            <Input
              type="number"
              value={parametros.reducao_co2e || ''}
              onChange={(e) => setParametros(prev => ({
                ...prev,
                reducao_co2e: Number(e.target.value)
              }))}
            />
          </div>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Construtor de Cenários
          </CardTitle>
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Nova Ação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Adicionar Ação de Descarbonização</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Seleção de categoria e ação */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Selecione uma ação:</Label>
                  </div>
                  
                  {Object.entries(BIBLIOTECA_ACOES).map(([categoria, acoes]) => {
                    const categoriaInfo = categorias[categoria as keyof typeof categorias]
                    const Icon = categoriaInfo.icon
                    
                    return (
                      <div key={categoria}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`p-1 rounded-md ${categoriaInfo.cor}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <h4 className="font-medium">{categoriaInfo.nome}</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-7">
                          {acoes.map((acao) => (
                            <Card
                              key={acao.tipo}
                              className={`cursor-pointer transition-colors ${
                                acaoSelecionada?.tipo === acao.tipo ? 'ring-2 ring-primary bg-accent' : 'hover:bg-accent'
                              }`}
                              onClick={() => handleSelecionarAcao(categoria, acao)}
                            >
                              <CardContent className="p-4">
                                <h5 className="font-medium text-sm">{acao.nome}</h5>
                                <p className="text-xs text-muted-foreground mt-1">{acao.descricao}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Configuração de parâmetros */}
                {acaoSelecionada && (
                  <div className="space-y-4 border-t pt-4">
                    <div>
                      <Label className="text-base font-medium">Configure os parâmetros:</Label>
                    </div>
                    
                    {renderParametrosAcao()}
                    
                    {/* Preview do impacto */}
                    <div className="bg-accent p-4 rounded-lg">
                      <p className="font-medium text-sm mb-2">Impacto estimado:</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Investimento:</span>
                          <p className="font-medium">
                            R$ {calcularInvestimento(acaoSelecionada, parametros).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Redução:</span>
                          <p className="font-medium">
                            {calcularReducaoCO2e(acaoSelecionada, parametros).toFixed(1)} tCO₂e/ano
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddModal(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleAdicionarAcao}>
                        Adicionar Ação
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {cenario.acoes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calculator className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma ação no cenário</p>
            <p className="text-sm">Clique em "Nova Ação" para começar</p>
          </div>
        ) : (
          <>
            {cenario.acoes.map((acao) => {
              const categoriaInfo = categorias[acao.categoria]
              const Icon = categoriaInfo.icon
              
              return (
                <Card key={acao.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-md ${categoriaInfo.cor}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{acao.nome}</p>
                          <Badge variant="outline" className="text-xs">
                            {acao.status === 'planejada' ? 'Planejada' : 
                             acao.status === 'em_implementacao' ? 'Em Implementação' : 'Implementada'}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoverAcao(acao.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Investimento:</span>
                        <p className="font-medium">R$ {acao.investimento_estimado.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Redução:</span>
                        <p className="font-medium">{acao.reducao_co2e_estimada.toFixed(1)} tCO₂e/ano</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            
            <div className="mt-4 p-4 bg-accent rounded-lg">
              <p className="font-medium text-sm mb-2">Resumo do Cenário:</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Investimento Total:</span>
                  <p className="font-bold text-lg">
                    R$ {cenario.acoes.reduce((acc, acao) => acc + acao.investimento_estimado, 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Redução Total:</span>
                  <p className="font-bold text-lg text-green-600">
                    -{cenario.acoes.reduce((acc, acao) => acc + acao.reducao_co2e_estimada, 0).toFixed(1)} tCO₂e/ano
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}