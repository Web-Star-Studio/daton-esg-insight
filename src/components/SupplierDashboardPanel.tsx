import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  FileText, 
  AlertTriangle, 
  DollarSign,
  Calendar,
  Award,
  Building2,
  Phone,
  Mail
} from 'lucide-react';

interface SupplierDashboardPanelProps {
  supplier: {
    id: string;
    name: string;
    type: string;
    status: string;
    contact_phone?: string;
    contact_email?: string;
  };
  onClose: () => void;
}

export const SupplierDashboardPanel: React.FC<SupplierDashboardPanelProps> = ({
  supplier,
  onClose
}) => {
  // Mock data - será substituído pelos dados reais dos serviços
  const mockData = {
    contracts: {
      active: 3,
      total: 5,
      totalValue: 450000,
      expiring: 1
    },
    performance: {
      overallScore: 8.5,
      qualityScore: 9.0,
      deliveryScore: 8.0,
      serviceScore: 8.5
    },
    compliance: {
      licenseStatus: 'Válida',
      licenseExpiry: '2024-12-31',
      certificationsValid: 4,
      certificationsTotal: 5
    },
    incidents: {
      open: 1,
      resolved: 5,
      total: 6
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ativo': return 'bg-green-500';
      case 'inativo': return 'bg-red-500';
      case 'suspenso': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getLicenseStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'válida': return 'text-green-600';
      case 'vencendo': return 'text-yellow-600';
      case 'vencida': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{supplier.name}</h2>
            <p className="text-muted-foreground">{supplier.type}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(supplier.status)}>
            {supplier.status}
          </Badge>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Phone className="h-5 w-5" />
            <span>Informações de Contato</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {supplier.contact_phone && (
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{supplier.contact_phone}</span>
            </div>
          )}
          {supplier.contact_email && (
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{supplier.contact_email}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.contracts.active}</div>
            <p className="text-xs text-muted-foreground">
              de {mockData.contracts.total} totais
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
              R$ {mockData.contracts.totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              em contratos ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.performance.overallScore}/10</div>
            <p className="text-xs text-muted-foreground">
              avaliação geral
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.incidents.open}</div>
            <p className="text-xs text-muted-foreground">
              abertos de {mockData.incidents.total} totais
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="contracts">Contratos</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="incidents">Incidentes</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>Indicadores de Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm">
                  <span>Qualidade</span>
                  <span>{mockData.performance.qualityScore}/10</span>
                </div>
                <Progress 
                  value={mockData.performance.qualityScore * 10} 
                  className="h-2 mt-1" 
                />
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>Entrega</span>
                  <span>{mockData.performance.deliveryScore}/10</span>
                </div>
                <Progress 
                  value={mockData.performance.deliveryScore * 10} 
                  className="h-2 mt-1" 
                />
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>Atendimento</span>
                  <span>{mockData.performance.serviceScore}/10</span>
                </div>
                <Progress 
                  value={mockData.performance.serviceScore * 10} 
                  className="h-2 mt-1" 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contratos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Contrato de Serviços - 2024</p>
                    <p className="text-sm text-muted-foreground">Vigência: 01/01/2024 - 31/12/2024</p>
                  </div>
                  <Badge variant="secondary">Ativo</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Acordo de Nível de Serviço</p>
                    <p className="text-sm text-muted-foreground">Vigência: 15/03/2024 - 14/03/2025</p>
                  </div>
                  <Badge variant="outline" className="text-yellow-600">Vencendo</Badge>
                </div>
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
              <div className="flex justify-between items-center">
                <span>Licença Principal</span>
                <Badge className={getLicenseStatusColor(mockData.compliance.licenseStatus)}>
                  {mockData.compliance.licenseStatus}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Vencimento da Licença</span>
                <span className="text-sm">{mockData.compliance.licenseExpiry}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Certificações Válidas</span>
                <span className="text-sm">
                  {mockData.compliance.certificationsValid}/{mockData.compliance.certificationsTotal}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Incidentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Atraso na Entrega</p>
                    <p className="text-sm text-muted-foreground">15/03/2024</p>
                  </div>
                  <Badge variant="destructive">Aberto</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Produto Fora de Especificação</p>
                    <p className="text-sm text-muted-foreground">02/03/2024</p>
                  </div>
                  <Badge variant="secondary">Resolvido</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};