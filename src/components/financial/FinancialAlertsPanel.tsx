import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, 
  TrendingDown, 
  Calendar, 
  DollarSign,
  ArrowRight,
  Bell
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FinancialAlert {
  id: string;
  type: 'overdue' | 'due_soon' | 'cash_flow_warning' | 'high_expense' | 'revenue_drop';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  amount?: number;
  date?: Date;
  actionUrl?: string;
}

export function FinancialAlertsPanel() {
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['financial-alerts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const alerts: FinancialAlert[] = [];
      const now = new Date();
      const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // 1. Contas em atraso
      const { data: overdue } = await supabase
        .from('accounts_payable')
        .select('invoice_number, final_amount, due_date, supplier_name')
        .eq('company_id', profile.company_id)
        .eq('status', 'Pendente')
        .lt('due_date', now.toISOString())
        .limit(5);

      overdue?.forEach(p => {
        alerts.push({
          id: `overdue-${p.invoice_number}`,
          type: 'overdue',
          severity: 'high',
          title: `Conta em atraso - ${p.supplier_name || p.invoice_number}`,
          description: `Vencimento: ${format(new Date(p.due_date), 'dd/MM/yyyy', { locale: ptBR })}`,
          amount: p.final_amount,
          actionUrl: '/financeiro/contas-pagar'
        });
      });

      // 2. Contas vencendo em 7 dias
      const { data: dueSoon } = await supabase
        .from('accounts_payable')
        .select('invoice_number, final_amount, due_date, supplier_name')
        .eq('company_id', profile.company_id)
        .eq('status', 'Pendente')
        .gte('due_date', now.toISOString())
        .lte('due_date', next7Days.toISOString())
        .limit(5);

      dueSoon?.forEach(p => {
        alerts.push({
          id: `due-soon-${p.invoice_number}`,
          type: 'due_soon',
          severity: 'medium',
          title: `Vence em breve - ${p.supplier_name || p.invoice_number}`,
          description: `Vencimento: ${format(new Date(p.due_date), 'dd/MM/yyyy', { locale: ptBR })}`,
          amount: p.final_amount,
          actionUrl: '/financeiro/contas-pagar'
        });
      });

      // 3. Análise de fluxo de caixa
      const { data: bankAccounts } = await supabase
        .from('bank_accounts')
        .select('current_balance')
        .eq('company_id', profile.company_id)
        .eq('status', 'Ativa');

      const { data: upcomingPayables } = await supabase
        .from('accounts_payable')
        .select('final_amount')
        .eq('company_id', profile.company_id)
        .eq('status', 'Pendente')
        .lte('due_date', next7Days.toISOString());

      const totalBalance = bankAccounts?.reduce((sum, b) => sum + (b.current_balance || 0), 0) || 0;
      const upcomingExpenses = upcomingPayables?.reduce((sum, p) => sum + (p.final_amount || 0), 0) || 0;

      if (upcomingExpenses > totalBalance * 0.8) {
        alerts.push({
          id: 'cash-flow-warning',
          type: 'cash_flow_warning',
          severity: 'high',
          title: 'Alerta de Fluxo de Caixa',
          description: `Despesas próximas (${upcomingExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}) comprometem ${((upcomingExpenses / totalBalance) * 100).toFixed(0)}% do saldo disponível`,
          amount: totalBalance - upcomingExpenses,
          actionUrl: '/financeiro/dashboard'
        });
      }

      // 4. Despesas altas não categorizadas ESG
      const { data: uncategorized, count } = await supabase
        .from('accounts_payable')
        .select('final_amount', { count: 'exact' })
        .eq('company_id', profile.company_id)
        .is('esg_category', null)
        .gte('final_amount', 5000)
        .limit(10);

      if (count && count > 0) {
        alerts.push({
          id: 'uncategorized-esg',
          type: 'high_expense',
          severity: 'low',
          title: `${count} despesas altas sem categoria ESG`,
          description: 'Categorize para melhorar análises de impacto',
          actionUrl: '/financeiro/contas-pagar'
        });
      }

      return alerts.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
    }
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'overdue': return AlertTriangle;
      case 'due_soon': return Calendar;
      case 'cash_flow_warning': return TrendingDown;
      case 'high_expense': return DollarSign;
      default: return Bell;
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Alertas Financeiros</h3>
        </div>
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </Card>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold">Alertas Financeiros</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Nenhum alerta no momento. Tudo sob controle! 🎉
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Alertas Financeiros</h3>
          <Badge variant="secondary">{alerts.length}</Badge>
        </div>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {alerts.map((alert) => {
            const Icon = getAlertIcon(alert.type);
            return (
              <div
                key={alert.id}
                className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    alert.severity === 'high' ? 'bg-destructive/10 text-destructive' :
                    alert.severity === 'medium' ? 'bg-primary/10 text-primary' :
                    'bg-secondary'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-medium text-sm">{alert.title}</p>
                      <Badge variant={getSeverityColor(alert.severity)} className="text-xs">
                        {alert.severity === 'high' ? 'Urgente' : 
                         alert.severity === 'medium' ? 'Atenção' : 'Info'}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2">
                      {alert.description}
                    </p>

                    {alert.amount !== undefined && (
                      <p className="text-sm font-semibold mb-2">
                        {alert.amount.toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL' 
                        })}
                      </p>
                    )}

                    {alert.actionUrl && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs gap-1 -ml-2"
                        onClick={() => window.location.href = alert.actionUrl!}
                      >
                        Ver detalhes
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}
