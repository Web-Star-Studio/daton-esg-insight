import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Building2, Users, Briefcase, RefreshCw } from 'lucide-react';
import { OrganizationalChart } from '@/components/OrganizationalChart';
import { DepartmentManager } from '@/components/DepartmentManager';
import { PositionManager } from '@/components/PositionManager';

export default function EstruturaOrganizacional() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Estrutura Organizacional</h1>
          <p className="text-muted-foreground">
            Gerencie a estrutura hierárquica, departamentos e cargos da organização
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="organograma" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="organograma" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Organograma</span>
          </TabsTrigger>
          <TabsTrigger value="departamentos" className="flex items-center space-x-2">
            <Building2 className="w-4 h-4" />
            <span>Departamentos</span>
          </TabsTrigger>
          <TabsTrigger value="cargos" className="flex items-center space-x-2">
            <Briefcase className="w-4 h-4" />
            <span>Cargos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organograma" className="space-y-4">
          <OrganizationalChart key={`org-${refreshKey}`} onRefresh={handleRefresh} />
        </TabsContent>

        <TabsContent value="departamentos" className="space-y-4">
          <DepartmentManager key={`dept-${refreshKey}`} onRefresh={handleRefresh} />
        </TabsContent>

        <TabsContent value="cargos" className="space-y-4">
          <PositionManager key={`pos-${refreshKey}`} onRefresh={handleRefresh} />
        </TabsContent>
      </Tabs>
    </div>
  );
}