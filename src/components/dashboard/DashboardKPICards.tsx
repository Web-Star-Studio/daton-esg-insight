import { CardWithAI } from '@/components/CardWithAI';

interface DashboardKPICardsProps {
  totals: {
    total: number;
    escopo1: number;
    escopo2: number;
    escopo3: number;
  };
  isLoading: boolean;
}

export function DashboardKPICards({ totals, isLoading }: DashboardKPICardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <CardWithAI
        cardType="emissions_total"
        cardData={{ 
          total: totals.total, 
          previous: totals.total * 0.9,
          trend: 'increase' 
        }}
        title="Emissões Totais (tCO₂e)"
        value={totals.total}
        subtitle="Período selecionado"
        className="shadow-card"
        isLoading={isLoading}
      />

      <CardWithAI
        cardType="emissions_scope"
        cardData={{ 
          escopo1: totals.escopo1,
          escopo2: totals.escopo2,
          escopo3: totals.escopo3,
          scope2_percentage: totals.total > 0 ? Math.round((totals.escopo2 / totals.total) * 100) : 0
        }}
        title="Escopo 1 (tCO₂e)"
        value={totals.escopo1}
        subtitle={`${totals.total > 0 ? Math.round((totals.escopo1 / totals.total) * 100) : 0}% do total`}
        className="shadow-card"
        isLoading={isLoading}
      />

      <CardWithAI
        cardType="emissions_scope"
        cardData={{ 
          escopo1: totals.escopo1,
          escopo2: totals.escopo2,
          escopo3: totals.escopo3,
          scope2_percentage: totals.total > 0 ? Math.round((totals.escopo2 / totals.total) * 100) : 0
        }}
        title="Escopo 2 (tCO₂e)"
        value={totals.escopo2}
        subtitle={`${totals.total > 0 ? Math.round((totals.escopo2 / totals.total) * 100) : 0}% do total`}
        className="shadow-card"
        isLoading={isLoading}
      />
    </div>
  );
}
