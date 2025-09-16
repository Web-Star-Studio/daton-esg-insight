import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scope3CategoryModal } from "./Scope3CategoryModal";
import { LandUseChangeModal } from "./LandUseChangeModal"; 
import { WastewaterTreatmentModal } from "./WastewaterTreatmentModal";
import { TransportDistributionModal } from "./TransportDistributionModal";
import { Building2, Leaf, Droplets, Truck, FileText, BarChart3 } from "lucide-react";

interface GHGProtocolCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function GHGProtocolCompleteModal({ isOpen, onClose, onSuccess }: GHGProtocolCompleteModalProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleModalSuccess = () => {
    onSuccess?.();
    setActiveModal(null);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>GHG Protocol Brasileiro 2025.0.1 - Funcionalidades Completas</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="scope3" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="scope3">Escopo 3</TabsTrigger>
              <TabsTrigger value="methodologies">Metodologias</TabsTrigger>
              <TabsTrigger value="variable">Fatores Variáveis</TabsTrigger>
              <TabsTrigger value="reports">Relatórios</TabsTrigger>
            </TabsList>

            <TabsContent value="scope3" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Categorias de Escopo 3 Implementadas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={() => setActiveModal('scope3')}
                      variant="outline"
                      className="h-auto p-4 justify-start"
                    >
                      <div>
                        <div className="font-semibold">Novas Categorias</div>
                        <div className="text-sm text-muted-foreground">
                          Implementar todas as 15 categorias oficiais
                        </div>
                      </div>
                    </Button>
                    <Button
                      onClick={() => setActiveModal('transport')}
                      variant="outline"
                      className="h-auto p-4 justify-start"
                    >
                      <div>
                        <div className="font-semibold">Transporte & Distribuição</div>
                        <div className="text-sm text-muted-foreground">
                          Upstream (Cat. 4) e Downstream (Cat. 9)
                        </div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="methodologies" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Leaf className="h-5 w-5" />
                      Mudança no Uso do Solo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Metodologia IPCC para cálculo de emissões de mudança no uso da terra
                    </p>
                    <Button onClick={() => setActiveModal('landuse')} className="w-full">
                      Registrar Mudança no Solo
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Droplets className="h-5 w-5" />
                      Tratamento de Efluentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Metodologia IPCC 2019 para emissões de CH₄ e N₂O
                    </p>
                    <Button onClick={() => setActiveModal('wastewater')} className="w-full">
                      Registrar Tratamento
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="variable" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Fatores Variáveis Brasileiros</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Sistema implementado com fatores variáveis mensais:
                    </p>
                    <ul className="text-sm space-y-1">
                      <li>• % Biodiesel no diesel comercial (padrão: 12%)</li>
                      <li>• % Etanol na gasolina comercial (padrão: 27%)</li>
                      <li>• Fator de emissão mensal do SIN brasileiro</li>
                      <li>• Dados para 2024 e 2025 já carregados</li>
                    </ul>
                    <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-lg">
                      <p className="text-sm font-medium">✅ Fatores variáveis implementados e funcionando</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Relatórios Padronizados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Sistema de relatórios implementado conforme GHG Protocol brasileiro:
                    </p>
                    <ul className="text-sm space-y-1">
                      <li>• Relatório anual completo</li>
                      <li>• Relatório para RPE (Registro Público)</li>
                      <li>• Export em PDF, Excel e JSON</li>
                      <li>• Consolidação automática por escopo</li>
                    </ul>
                    <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-lg">
                      <p className="text-sm font-medium">✅ Sistema de relatórios implementado</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Sub-modais */}
      <Scope3CategoryModal
        isOpen={activeModal === 'scope3'}
        onClose={() => setActiveModal(null)}
        onSuccess={handleModalSuccess}
      />
      <LandUseChangeModal
        isOpen={activeModal === 'landuse'}
        onClose={() => setActiveModal(null)}
        onSuccess={handleModalSuccess}
      />
      <WastewaterTreatmentModal
        isOpen={activeModal === 'wastewater'}
        onClose={() => setActiveModal(null)}
        onSuccess={handleModalSuccess}
      />
      <TransportDistributionModal
        isOpen={activeModal === 'transport'}
        onClose={() => setActiveModal(null)}
        onSuccess={handleModalSuccess}
      />
    </>
  );
}