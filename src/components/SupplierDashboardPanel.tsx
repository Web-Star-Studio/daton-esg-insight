import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  X,
  Activity,
  Shield
} from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  type: string;
  status: string;
}

interface SupplierDashboardPanelProps {
  supplier: Supplier;
  onClose: () => void;
}

export const SupplierDashboardPanel: React.FC<SupplierDashboardPanelProps> = ({
  supplier,
  onClose
}) => {
  // Empty state - supplier data not configured yet
  const data = {
    contracts: { active: 0, total: 0, totalValue: 0, renewalsNeeded: 0 },
    performance: { overallScore: 0, qualityScore: 0, deliveryScore: 0, serviceScore: 0 },
    incidents: { open: 0, total: 0, resolved: 0 },
    compliance: { licenseStatus: "Não configurado", licenseExpiry: "-", certificationsValid: 0, certificationsTotal: 0 }
  };

  const getLicenseStatusColor = (status: string) => {
    switch (status) {
      case 'Válida':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Vencida':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Vencendo':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{supplier.name}</h2>
          <p className="text-muted-foreground">
            {supplier.type} • Status: <span className="capitalize">{supplier.status}</span>
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.contracts.active}</div>
            <p className="text-xs text-muted-foreground">
              Dados não configurados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {data.contracts.totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Dados não configurados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.performance.overallScore}/10</div>
            <p className="text-xs text-muted-foreground">
              Dados não configurados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.incidents.open}</div>
            <p className="text-xs text-muted-foreground">
              Dados não configurados
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-muted-foreground py-8">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Dados de Performance Não Configurados</h3>
                <p className="text-sm">As métricas de performance do fornecedor serão exibidas aqui quando configuradas.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status de Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-muted-foreground py-8">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Compliance Não Configurado</h3>
                <p className="text-sm">As informações de compliance do fornecedor serão exibidas aqui quando configuradas.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Interações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Histórico Não Disponível</h3>
                <p className="text-sm">O histórico de interações com o fornecedor será exibido aqui quando configurado.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};