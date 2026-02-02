
# Plano de Implementacao - Dashboard Admin Avancado: Auditoria e Dados

## Resumo Executivo

Este plano implementa um dashboard administrativo completo com 4 modulos avancados: Auditoria (Activity Log), Estatisticas do Sistema, Configuracoes Administrativas e Health Check. A implementacao integra-se com a infraestrutura existente de logging e seguranca.

---

## Analise do Estado Atual

### Componentes e Servicos Existentes

| Recurso | Arquivo | Status |
|---------|---------|--------|
| Activity Logs Table | `activity_logs` (DB) | Existe - id, company_id, user_id, action_type, description, details_json, created_at |
| Audit Service | `src/services/audit.ts` | Existe - logActivity(), getActivityLogs(), getAuditTrail() |
| Health Check Utility | `src/utils/healthCheck.ts` | Existe - healthChecker com DB, Auth, Storage checks |
| Platform Admin Dashboard | `src/pages/PlatformAdminDashboard.tsx` | Existe - KPIs basicos de empresas |
| System Status Page | `src/pages/SystemStatus.tsx` | Existe - Health check visual |
| CSV Export Utility | `src/services/reportService.ts` | Existe - exportToCSV() |
| Login History Table | `login_history` (DB) | Existe - ip_address, user_agent, login_success, failure_reason |
| User Sessions Table | `user_sessions` (DB) | Existe - device_info, last_active_at |
| Permission System | `usePermissions` hook | Existe - platform_admin, super_admin roles |

### Lacunas Identificadas

| Funcionalidade | Status | Modulo |
|----------------|--------|--------|
| Visualizador de Activity Logs completo | NAO EXISTE | Auditoria |
| Filtros por usuario, acao, data range | NAO EXISTE | Auditoria |
| Exportacao CSV de logs | NAO EXISTE | Auditoria |
| Politica de retencao 90 dias | NAO EXISTE | Auditoria |
| Dashboard de estatisticas de usuarios | NAO EXISTE | Estatisticas |
| Metricas de logins/erros 7 dias | NAO EXISTE | Estatisticas |
| Taxa de erro de requisicoes | NAO EXISTE | Estatisticas |
| Tabela system_settings | NAO EXISTE | Configuracoes |
| UI para ajustar timeout, upload limit | NAO EXISTE | Configuracoes |
| Historico de mudancas de config | NAO EXISTE | Configuracoes |
| Status de backups visual | NAO EXISTE | Health Check |
| Alertas administrativos | NAO EXISTE | Health Check |
| Pagina unificada Admin Dashboard | NAO EXISTE | Todos |

---

## Arquitetura da Solucao

```text
+-----------------------------------------------+
|          AdminDashboard.tsx (NOVA)            |
|  Pagina principal com Tabs para cada modulo   |
+-----------------------------------------------+
           |
   +-------+-------+-------+-------+
   |       |       |       |       |
   v       v       v       v       v
+------+ +------+ +------+ +------+
|Audit | |Stats | |Config| |Health|
|Trail | |Module| |Module| |Check |
|Module| |      | |      | |Module|
+------+ +------+ +------+ +------+
           |
           v
+-----------------------------------------------+
|        useAdminDashboard.ts (NOVO)            |
|  Hook consolidado para todas as queries       |
+-----------------------------------------------+
           |
           v
+-----------------------------------------------+
|           Supabase / Edge Functions           |
|  activity_logs, profiles, system_settings     |
+-----------------------------------------------+
```

---

## Modulo 1: Auditoria (Activity Log)

### 1.1 Componente AuditTrailModule.tsx

**Funcionalidades:**
- Tabela com colunas: Acao, Usuario, Recurso, Timestamp, Status/Detalhes
- Tipos de acao categorizados com badges coloridos:
  - CREATE (verde), UPDATE (azul), DELETE (vermelho), LOGIN (amarelo), LOGOUT (cinza)
- Filtros integrados:
  - Dropdown por usuario (lista de profiles)
  - Dropdown por tipo de acao
  - Date Range Picker (usando componente existente)
- Botao "Exportar CSV" dos logs filtrados
- Paginacao com 20 itens por pagina

### 1.2 Hook useAuditTrail.ts

```typescript
interface AuditTrailFilters {
  userId?: string;
  actionType?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

interface AuditLogEntry {
  id: string;
  user_id: string;
  user_name: string;
  action_type: string;
  description: string;
  details_json: Json;
  created_at: string;
}

// Funcoes:
fetchAuditLogs(filters: AuditTrailFilters): Promise<PaginatedResult<AuditLogEntry>>
exportAuditLogsToCSV(filters: AuditTrailFilters): void
```

### 1.3 Politica de Retencao 90 Dias

**Migracao SQL (opcional - cleanup function):**
```sql
-- Funcao para limpar logs antigos (executar via cron)
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM activity_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Nota:** A UI exibira apenas logs dos ultimos 90 dias por padrao.

---

## Modulo 2: Estatisticas do Sistema

### 2.1 Componente SystemStatsModule.tsx

**Metricas exibidas:**
- Total de usuarios / Ativos / Inativos (usando `profiles.is_active`)
- Distribuicao por role (grafico de pizza ou barras)
- Ultimos 7 dias:
  - Novos usuarios (profiles.created_at)
  - Logins bem-sucedidos (login_history.login_success = true)
  - Falhas de login (login_history.login_success = false)
- Taxa de erro (baseado em login_history)

### 2.2 Hook useSystemStats.ts

```typescript
interface SystemStats {
  users: {
    total: number;
    active: number;
    inactive: number;
  };
  roleDistribution: Array<{
    role: string;
    count: number;
  }>;
  last7Days: {
    newUsers: number;
    successfulLogins: number;
    failedLogins: number;
    errorRate: number; // percentual
  };
  performance: {
    avgResponseTime: number; // ms (estimado via health checks)
  };
}
```

### 2.3 Visualizacao

- Cards com numeros grandes para KPIs
- Graficos usando Recharts (ja instalado)
- Trend indicators (seta verde/vermelha)

---

## Modulo 3: Configuracoes do Sistema

### 3.1 Nova Tabela system_settings

**Migracao SQL:**
```sql
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by_user_id UUID REFERENCES auth.users(id)
);

-- Valores iniciais
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('session_timeout_minutes', '30', 'Tempo de timeout de sessao em minutos'),
  ('max_upload_size_mb', '10', 'Tamanho maximo de upload em MB'),
  ('max_login_attempts', '5', 'Tentativas maximas de login antes do lock'),
  ('login_lock_duration_minutes', '15', 'Duracao do lock em minutos'),
  ('password_min_length', '8', 'Tamanho minimo de senha'),
  ('password_require_uppercase', 'true', 'Exigir letra maiuscula'),
  ('password_require_number', 'true', 'Exigir numero'),
  ('password_require_special', 'true', 'Exigir caractere especial')
ON CONFLICT (setting_key) DO NOTHING;

-- RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Apenas platform_admin e super_admin podem ver/editar
CREATE POLICY "Admins can manage settings" ON system_settings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('platform_admin', 'super_admin')
  )
);
```

### 3.2 Nova Tabela system_settings_history

**Historico imutavel de mudancas:**
```sql
CREATE TABLE IF NOT EXISTS system_settings_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB NOT NULL,
  changed_by_user_id UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para logar mudancas
CREATE OR REPLACE FUNCTION log_setting_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO system_settings_history (setting_key, old_value, new_value, changed_by_user_id)
  VALUES (NEW.setting_key, OLD.setting_value, NEW.setting_value, auth.uid());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_log_setting_change
AFTER UPDATE ON system_settings
FOR EACH ROW EXECUTE FUNCTION log_setting_change();

-- RLS para historico (somente leitura para admins)
ALTER TABLE system_settings_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view settings history" ON system_settings_history
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('platform_admin', 'super_admin')
  )
);
```

### 3.3 Componente SystemConfigModule.tsx

**Interface:**
- Form com inputs numericos para cada configuracao
- Validacao client-side (min/max values)
- Botao "Salvar Alteracoes"
- Historico de mudancas (accordion mostrando quem mudou, quando, valor anterior/novo)
- Toast de sucesso/erro

**Campos editaveis:**
| Campo | Tipo | Min | Max | Descricao |
|-------|------|-----|-----|-----------|
| session_timeout_minutes | number | 5 | 1440 | Timeout de sessao |
| max_upload_size_mb | number | 1 | 100 | Limite de upload |
| max_login_attempts | number | 3 | 10 | Tentativas de login |
| login_lock_duration_minutes | number | 5 | 60 | Duracao do lock |

---

## Modulo 4: Health Check

### 4.1 Componente HealthCheckModule.tsx

**Aproveitando o existente:**
- Integrar com `healthChecker` de `src/utils/healthCheck.ts`
- Adicionar novos checks:
  - Status do servidor (sempre "Online" se pagina carrega)
  - Ultima sincronizacao (timestamp do ultimo health check)
  - Espaco em disco (simulado - Supabase gerencia)
  - Status de backups (simulado - informativo)

**Alertas:**
- Card de alertas com issues criticos
- Cores: verde (saudavel), amarelo (degradado), vermelho (critico)
- Botao "Verificar Novamente"

### 4.2 Extensao do HealthChecker

```typescript
// Novos checks a adicionar em healthCheck.ts
async checkLoginHistory(): Promise<HealthStatus> {
  // Verificar se houve muitas falhas de login recentes (possivel ataque)
  const { count } = await supabase
    .from('login_history')
    .select('*', { count: 'exact', head: true })
    .eq('login_success', false)
    .gte('created_at', new Date(Date.now() - 3600000).toISOString()); // ultima hora
  
  if (count && count > 50) {
    return { status: 'warn', message: `${count} falhas de login na ultima hora` };
  }
  return { status: 'pass', message: 'Atividade de login normal' };
}
```

---

## Pagina Principal: AdminDashboard.tsx

### Estrutura da Pagina

```typescript
// src/pages/AdminDashboard.tsx
const AdminDashboard = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1>Dashboard Administrativo</h1>
        <p>Auditoria, estatisticas e configuracoes do sistema</p>
      </div>
      
      <Tabs defaultValue="audit">
        <TabsList>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
          <TabsTrigger value="stats">Estatisticas</TabsTrigger>
          <TabsTrigger value="config">Configuracoes</TabsTrigger>
          <TabsTrigger value="health">Health Check</TabsTrigger>
        </TabsList>
        
        <TabsContent value="audit">
          <AuditTrailModule />
        </TabsContent>
        <TabsContent value="stats">
          <SystemStatsModule />
        </TabsContent>
        <TabsContent value="config">
          <SystemConfigModule />
        </TabsContent>
        <TabsContent value="health">
          <HealthCheckModule />
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

---

## Seguranca

### Controles Implementados

| Requisito | Implementacao |
|-----------|---------------|
| Apenas admin acessa auditoria | RoleGuard + PermissionGate no frontend, RLS no backend |
| Logs imutaveis | Nenhuma policy DELETE na tabela activity_logs |
| Historico de config imutavel | Tabela separada system_settings_history, sem UPDATE/DELETE |
| Alertas confidenciais | Dados sensiveis nao expostos em logs publicos |
| Senhas nunca exibidas | Nenhum campo de senha em APIs/UI |
| Verificacao backend | RLS policies em todas as tabelas |

### RLS Policies Adicionais

```sql
-- Impedir DELETE em activity_logs (logs imutaveis)
-- NAO criar policy de DELETE

-- Impedir UPDATE/DELETE em system_settings_history
-- NAO criar policies de UPDATE/DELETE
```

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/AdminDashboard.tsx` | Pagina principal com tabs |
| `src/components/admin/AuditTrailModule.tsx` | Modulo de auditoria |
| `src/components/admin/SystemStatsModule.tsx` | Modulo de estatisticas |
| `src/components/admin/SystemConfigModule.tsx` | Modulo de configuracoes |
| `src/components/admin/HealthCheckModule.tsx` | Modulo de health check |
| `src/components/admin/AuditLogFilters.tsx` | Filtros para logs |
| `src/components/admin/StatsCard.tsx` | Card de estatistica reutilizavel |
| `src/components/admin/SettingsHistoryTable.tsx` | Historico de mudancas |
| `src/hooks/admin/useAuditTrail.ts` | Hook para auditoria |
| `src/hooks/admin/useSystemStats.ts` | Hook para estatisticas |
| `src/hooks/admin/useSystemSettings.ts` | Hook para configuracoes |

## Arquivos a Modificar

| Arquivo | Modificacao |
|---------|-------------|
| `src/App.tsx` | Adicionar rota `/admin-dashboard` com RoleGuard |
| `src/components/AppSidebar.tsx` | Adicionar link ao menu Admin |
| `src/utils/healthCheck.ts` | Adicionar novos checks |

---

## Migracao SQL Completa

```sql
-- 1. Tabela de configuracoes do sistema
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by_user_id UUID REFERENCES auth.users(id)
);

-- 2. Tabela de historico de configuracoes (imutavel)
CREATE TABLE IF NOT EXISTS system_settings_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB NOT NULL,
  changed_by_user_id UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Trigger para logar mudancas
CREATE OR REPLACE FUNCTION log_setting_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO system_settings_history (setting_key, old_value, new_value, changed_by_user_id)
  VALUES (NEW.setting_key, OLD.setting_value, NEW.setting_value, NEW.updated_by_user_id);
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_log_setting_change ON system_settings;
CREATE TRIGGER tr_log_setting_change
BEFORE UPDATE ON system_settings
FOR EACH ROW EXECUTE FUNCTION log_setting_change();

-- 4. Valores iniciais
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('session_timeout_minutes', '30', 'Tempo de timeout de sessao em minutos'),
  ('max_upload_size_mb', '10', 'Tamanho maximo de upload em MB'),
  ('max_login_attempts', '5', 'Tentativas maximas de login antes do lock'),
  ('login_lock_duration_minutes', '15', 'Duracao do lock em minutos')
ON CONFLICT (setting_key) DO NOTHING;

-- 5. RLS para system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view settings" ON system_settings
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('platform_admin', 'super_admin', 'admin')
  )
);

CREATE POLICY "Super admins can update settings" ON system_settings
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('platform_admin', 'super_admin')
  )
);

-- 6. RLS para system_settings_history (somente leitura)
ALTER TABLE system_settings_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view settings history" ON system_settings_history
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('platform_admin', 'super_admin', 'admin')
  )
);

-- 7. Indice para consultas de logs por data (performance)
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at 
ON activity_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type 
ON activity_logs(action_type);

CREATE INDEX IF NOT EXISTS idx_login_history_created_at 
ON login_history(created_at DESC);
```

---

## Ordem de Execucao

1. **Fase 1:** Migracao SQL (system_settings, historico, indices)
2. **Fase 2:** Hooks (useAuditTrail, useSystemStats, useSystemSettings)
3. **Fase 3:** Componentes UI (AuditTrailModule, SystemStatsModule, SystemConfigModule, HealthCheckModule)
4. **Fase 4:** Pagina AdminDashboard.tsx e roteamento
5. **Fase 5:** Atualizacao do sidebar e health check utility
6. **Fase 6:** Testes end-to-end

---

## Entregaveis

- Dashboard admin unificado com 4 modulos
- Auditoria com filtros, paginacao e exportacao CSV
- Estatisticas em tempo real de usuarios e sistema
- Configuracoes ajustaveis com historico imutavel
- Health check expandido com alertas
- Todas as operacoes protegidas por RLS e roles
- Logs de auditoria para todas as acoes administrativas
