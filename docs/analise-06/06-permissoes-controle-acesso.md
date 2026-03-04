# Análise ISO 9001:2015 — Item 7.5: Permissões e Controle de Acesso

**Data da análise:** 2026-03-04
**Módulo:** Permissões e Controle de Acesso a Documentos
**Arquivo(s) principal(is):** `src/components/DocumentPermissionsModal.tsx`, `src/services/gedDocuments.ts` (documentPermissionsService)
**Nota de confiança:** 3.5/5

---

## 1. Descrição do Módulo

O módulo de Permissões implementa controle de acesso granular para documentos e pastas, com 4 níveis de permissão (leitura, escrita, aprovação, admin). Suporta permissões por usuário e por role, com expiração temporal. Complementado por Row Level Security (RLS) do Supabase para isolamento por empresa.

Equivale aos "grupos de acesso" do PSG-DOC que definem autoridades por inclusão em grupos como Administradores, Aprovadores, responsáveis por Cópias Físicas, etc.

## 2. Análise por Sub-requisito ISO 7.5

### 2.1 Item 7.5.1 — Generalidades

**Situação no sistema:**
- [x] Controle de acesso à informação documentada
- [x] Separação entre leitura e escrita
- [x] Nível "aprovação" permite designar aprovadores

### 2.2 Item 7.5.2 — Criando e Atualizando

**Situação no sistema:**
- [x] Nível `aprovacao` vincula ao processo de análise crítica
- [x] Nível `admin` permite gestão completa do documento
- [ ] Sem vinculação automática entre permissão de aprovação e o fluxo de aprovação

### 2.3 Item 7.5.3 — Controle

#### 2.3.1 Disponibilidade e Proteção
- [x] 4 níveis: `leitura`, `escrita`, `aprovacao`, `admin`
- [x] Permissões por documento e por pasta
- [x] Expiração temporal (`expires_at`)
- [x] Revogação de permissão (`revokePermission`)
- [x] RLS no Supabase filtra por `company_id`

#### 2.3.2 Distribuição e Acesso
- [x] Permissão pode ser atribuída por `user_id` ou por `role`
- [x] `granted_by_user_id` rastreia quem concedeu acesso
- [x] `granted_at` registra quando o acesso foi concedido
- [ ] Sem conceito de "grupo" como PSG-DOC (Administradores, Aprovadores, Equipe Auditores, etc.)
- [ ] Sem log de acesso (quem acessou qual documento e quando)

**Evidências:**
- `src/services/gedDocuments.ts:85-96` — Interface `DocumentPermission`:
  ```typescript
  interface DocumentPermission {
    permission_level: 'leitura' | 'escrita' | 'aprovacao' | 'admin';
    user_id?: string;
    role?: string;
    granted_by_user_id: string;
    expires_at?: string;
    is_active: boolean;
  }
  ```
- `src/components/DocumentPermissionsModal.tsx:31-36` — Formulário com 4 níveis
- `src/components/DocumentPermissionsModal.tsx:45-56` — Mutation para concessão
- `src/components/DocumentPermissionsModal.tsx:58-66` — Mutation para revogação

## 3. Mapeamento PSG-DOC

| # | Requisito PSG-DOC | Status | Evidência |
|---|-------------------|--------|-----------|
| P7 | Grupos de acesso (Admin, Aprovadores, etc.) | ⚠️ Parcial | Permissões por user/role, mas sem "grupos" pré-definidos |
| P9 | Distribuição controlada | ✅ Implementado | Permissões determinam quem acessa |
| P1 | Controle via software | ✅ Implementado | Interface web com concessão/revogação |

**Sobre os grupos do PSG-DOC:**
O PSG-DOC define grupos como: Administradores/Responsáveis, Aprovadores, responsáveis por Cópias Físicas, Pessoas Físicas, Auditor Líder, Equipe Auditores, Recursos Humanos, Recebimento, Suprimentos, Área Técnica, responsáveis por Processos/Projetos.

O sistema usa `role` (string livre) e `permission_level` (enum de 4 valores) em vez de grupos nomeados. A funcionalidade é equivalente mas a nomenclatura e organização diferem.

## 4. Evidências Detalhadas

### 4.1 Tabela `document_permissions`
| Campo | Tipo | Função |
|-------|------|--------|
| `document_id` | uuid FK | Documento (mutuamente exclusivo com folder_id) |
| `folder_id` | uuid FK | Pasta (mutuamente exclusivo com document_id) |
| `user_id` | uuid | Usuário que recebe permissão |
| `role` | string | Role alternativa ao user_id |
| `permission_level` | enum | leitura/escrita/aprovacao/admin |
| `granted_by_user_id` | uuid | Quem concedeu |
| `granted_at` | timestamp | Quando foi concedida |
| `expires_at` | timestamp | Expiração (opcional) |
| `is_active` | boolean | Permissão ativa |

### 4.2 RLS (Row Level Security)
```sql
-- Políticas em regulatory_document_settings (exemplo)
CREATE POLICY "Users can manage their company regulatory settings"
ON public.regulatory_document_settings
FOR ALL
USING (company_id = get_user_company_id())
WITH CHECK (company_id = get_user_company_id());
```

### 4.3 Serviço
- `documentPermissionsService.getPermissions(documentId, folderId)` — Lista permissões
- `documentPermissionsService.grantPermission(data)` — Concede permissão
- `documentPermissionsService.revokePermission(id)` — Revoga permissão

## 5. Lacunas e Recomendações

| # | Lacuna | Severidade | Recomendação |
|---|--------|------------|--------------|
| 1 | Sem grupos nomeados (Admin, Auditores, etc.) | Média | Criar tabela `permission_groups` com membros e vincular |
| 2 | Sem log de acesso a documentos | Média | Registrar visualizações na `document_audit_trail` |
| 3 | Sem herança de permissões pasta→documento | Baixa | Implementar herança de permissões de pasta para documentos filhos |
| 4 | `role` é string livre, sem validação | Baixa | Usar enum ou tabela de roles válidos |
| 5 | Sem visualização consolidada de "quem pode acessar o quê" | Média | Dashboard de permissões por usuário/departamento |

## 6. Nota de Confiança: 3.5/5

| Critério | Peso | Nota | Observação |
|----------|------|------|------------|
| Cobertura funcional 7.5 | 30% | 4/5 | 4 níveis, expiração, revogação, per-doc e per-folder |
| Aderência PSG-DOC | 25% | 3/5 | Funcionalidade equivalente mas sem grupos nomeados |
| Maturidade do código | 15% | 3.5/5 | React Query, mutations, tratamento de erro |
| Rastreabilidade | 15% | 3/5 | granted_by/granted_at, mas sem log de acesso |
| UX/Usabilidade | 15% | 4/5 | Modal com concessão/revogação, badges de nível |
| **Média ponderada** | **100%** | **3.5/5** | |

## 7. Guia de Verificação E2E

### Cenários de Teste

1. **Concessão de Permissão**
   - Abrir documento → permissões → conceder "leitura" ao usuário B
   - Login como usuário B → verificar que documento é visível
   - Tentar editar → deve ser bloqueado

2. **Revogação**
   - Revogar permissão do usuário B
   - Login como B → documento não deve ser acessível

3. **Expiração**
   - Conceder permissão com `expires_at` no passado
   - Verificar que permissão aparece como "Expirada"

4. **Níveis**
   - Conceder `escrita` → pode editar
   - Conceder `aprovacao` → pode aprovar
   - Conceder `admin` → pode gerenciar permissões

### Checklist
- [ ] 4 níveis de permissão funcionam corretamente
- [ ] Permissão por pasta funciona
- [ ] Expiração é respeitada
- [ ] Revogação remove acesso imediatamente
- [ ] RLS impede acesso cross-company
- [ ] `granted_by_user_id` é registrado corretamente
