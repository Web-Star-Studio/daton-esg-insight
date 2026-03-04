# Análise ISO 9001:2015 — Item 7.5: Administração/Sistema

**Data da análise:** 2026-03-04
**Módulo:** Administração e Configuração do Sistema
**Arquivo(s) principal(is):** `src/pages/Configuracao.tsx`, `src/pages/GestaoUsuarios.tsx`, `src/pages/AdminDashboard.tsx`
**Nota de confiança:** 2.0/5

---

## 1. Descrição do Módulo

O módulo de Administração gerencia configurações do sistema, usuários, roles e parâmetros gerais. Sob a perspectiva do 7.5, este módulo é responsável por aspectos de infraestrutura que suportam o controle de informação documentada: gestão de usuários (quem pode acessar/aprovar), backup e proteção de dados, e configurações que afetam a preservação da informação.

Equivale parcialmente às responsabilidades do "Coordenador do SGI" e "Administrador do Sistema" no PSG-DOC.

## 2. Análise por Sub-requisito ISO 7.5

### 2.1 Item 7.5.1 — Generalidades

**Situação no sistema:**
- [x] Gestão de usuários com roles
- [x] Configurações de empresa
- [ ] Sem configuração de políticas de retenção
- [ ] Sem configuração de backup acessível na UI

### 2.2 Item 7.5.2 — Criando e Atualizando

**Situação no sistema:**
- [x] Criação de usuários com roles e permissões
- [x] Ativação/desativação de usuários
- [ ] Sem template de configuração documental
- [ ] Sem definição de workflow de documentação padrão

### 2.3 Item 7.5.3 — Controle

#### 2.3.1 Proteção
- [x] Autenticação Supabase Auth (email/senha)
- [x] RLS baseado em company_id
- [x] Role-based access (admin, platform-admin)
- [ ] **Backup**: Totalmente delegado ao Supabase — sem configuração/verificação/status na UI
- [ ] **Antivírus**: Sem menção no sistema (PSG-DOC referencia IT-DOC.BACKUP)

#### 2.3.2 Preservação
- [x] Dados em PostgreSQL (Supabase) com replicação automática
- [x] Arquivos em Supabase Storage com redundância
- [ ] Sem dashboard de status de backup
- [ ] Sem verificação de integridade periódica
- [ ] Sem teste de restauração documentado

**Evidências:**
- `src/pages/GestaoUsuarios.tsx` — CRUD de usuários com role management
- `src/pages/Configuracao.tsx` — Configurações gerais
- `src/pages/AdminDashboard.tsx` — Dashboard administrativo
- `src/hooks/admin/useAuditTrail.ts` — Trilha de auditoria administrativa

## 3. Mapeamento PSG-DOC

| # | Requisito PSG-DOC | Status | Evidência |
|---|-------------------|--------|-----------|
| P7 | Delegação de autoridade | ⚠️ Parcial | Roles existem mas sem grupos PSG-DOC |
| P8 | Backup e proteção | ❌ Ausente na UI | Supabase gerencia, mas sem visibilidade no sistema |
| P15 | Retenção configurável | ❌ Ausente | Sem tela de configuração de períodos de retenção |

**Sobre backup PSG-DOC:** O PSG-DOC afirma que "As responsabilidades de backup e proteção das informações documentadas [...] estão definidas em contrato, monitorado através do TI, sendo registrada não conformidade quando detectado alguma anomalia." O sistema delega ao Supabase mas não monitora, não registra anomalias, e não oferece visibilidade.

**Sobre IT-DOC.BACKUP:** O PSG-DOC referencia "IT-DOC.BACKUP" como instrução de trabalho para preservação de documentos eletrônicos com backup e antivírus. Não há equivalente no sistema.

## 4. Evidências Detalhadas

### 4.1 Gestão de Usuários
- Criação/edição/desativação de contas
- Atribuição de roles (admin, user, platform-admin)
- Audit trail de ações administrativas (user_created, user_updated, admin_user_role_changed)

### 4.2 Autenticação
- Supabase Auth (email/senha)
- Reset de senha via email
- Proteção de rotas com `ProtectedLazyPageWrapper` e `RoleGuard`

### 4.3 Backup (Supabase-managed)
- PostgreSQL com replicação automática
- Supabase Storage com redundância S3
- Sem endpoint de verificação acessível ao sistema

## 5. Lacunas e Recomendações

| # | Lacuna | Severidade | Recomendação |
|---|--------|------------|--------------|
| 1 | Sem dashboard de status de backup | Alta | Implementar verificação de health do Supabase + status na UI |
| 2 | Sem configuração de retenção | Alta | Criar tela de configuração de períodos por tipo de registro |
| 3 | Sem teste de restauração | Alta | Documentar e testar procedimento de restore |
| 4 | Sem equivalente a IT-DOC.BACKUP | Alta | Criar documentação interna de procedimentos de backup |
| 5 | Sem monitoramento de anomalias | Média | Implementar alertas para falhas de backup/storage |
| 6 | Roles não mapeiam para grupos PSG-DOC | Média | Criar grupos configuráveis (Admin, Aprovadores, Auditores, etc.) |

## 6. Nota de Confiança: 2.0/5

| Critério | Peso | Nota | Observação |
|----------|------|------|------------|
| Cobertura funcional 7.5 | 30% | 2/5 | Gestão de usuários ok, mas sem backup/retenção |
| Aderência PSG-DOC | 25% | 1.5/5 | Sem backup visible, sem IT-DOC.BACKUP, sem retenção |
| Maturidade do código | 15% | 2.5/5 | Funcionalidades básicas implementadas |
| Rastreabilidade | 15% | 2.5/5 | Audit trail de ações admin existe |
| UX/Usabilidade | 15% | 2.5/5 | Telas de admin funcionais mas incompletas |
| **Média ponderada** | **100%** | **2.0/5** | |

## 7. Guia de Verificação E2E

### Cenários de Teste

1. **Gestão de Usuários**
   - Criar usuário com role "admin"
   - Verificar que pode acessar telas administrativas
   - Desativar usuário → verificar que perde acesso

2. **Audit Trail Admin**
   - Realizar ações administrativas (criar usuário, alterar role)
   - Verificar que aparecem na trilha de auditoria
   - Exportar CSV

3. **Backup (manual)**
   - Acessar painel Supabase → verificar status de backup
   - Documentar resultado (não há interface no sistema para isso)

### Checklist
- [ ] CRUD de usuários funciona
- [ ] Roles são atribuídas corretamente
- [ ] Role guards protegem rotas adequadamente
- [ ] Audit trail registra ações administrativas
- [ ] ⚠️ Status de backup é verificável (esperado: NÃO disponível na UI)
- [ ] ⚠️ Configuração de retenção existe (esperado: NÃO disponível)
