import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EstruturaOrganizacional() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Estrutura Organizacional</h1>
          <p className="text-muted-foreground">
            Gerencie a estrutura hierárquica, departamentos e cargos da organização
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Módulo em Desenvolvimento</CardTitle>
        </CardHeader>
        <CardContent>
          <p>O módulo de Estrutura Organizacional está sendo implementado.</p>
          <p>Em breve você poderá gerenciar organogramas, departamentos e cargos.</p>
        </CardContent>
      </Card>
    </div>
  );
}