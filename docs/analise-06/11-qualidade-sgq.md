# Análise ISO 9001:2015 — Item 7.5: Qualidade (SGQ)

**Data da análise:** 2026-03-04
**Módulo:** Qualidade / Sistema de Gestão da Qualidade
**Arquivo(s) principal(is):** `src/pages/QualityDashboard.tsx`, `src/pages/NaoConformidades.tsx`, `src/pages/AcoesCorretivas.tsx`, `src/data/isoTemplates.ts`, `src/services/isoRequirements.ts`
**Nota de confiança:** 3.0/5

---

## 1. Descrição do Módulo

O módulo de Qualidade (SGQ) implementa funcionalidades centrais do sistema de gestão da qualidade: dashboard de indicadores, gestão de não conformidades, ações corretivas, planos de ação 5W2H, templates ISO e mapeamento de requisitos. Sob a ótica do 7.5, este módulo gera e consome informação documentada essencial — registros de NC, evidências de ações corretivas, e relatórios de qualidade que devem ser mantidos e retidos.

## 2. Análise por Sub-requisito ISO 7.5

### 2.1 Item 7.5.1 — Generalidades

**Situação no sistema:**
- [x] Templates ISO 9001:2015 com referência a cláusulas (`isoTemplates.ts`)
- [x] Mapeamento de requisitos ISO (`isoRequirements.ts`)
- [x] Registros de NC como informação documentada retida
- [x] Dashboard de qualidade com indicadores
- [ ] Sem vinculação explícita entre registros de NC e a Lista Mestra

**Evidências:**
- `src/data/isoTemplates.ts` — Templates ISO com `standard`, `version`, `clause_reference`, `description`, questões e requisitos de evidência por cláusula
- `src/services/isoRequirements.ts` — Serviço para consulta de requisitos ISO

### 2.2 Item 7.5.2 — Criando e Atualizando

**Situação no sistema:**
- [x] NC com campos: descrição, causa raiz, ação corretiva, responsável, prazo
- [x] Planos de ação 5W2H estruturados (What, Why, Where, When, Who, How, How much)
- [x] Templates ISO fornecem orientação para criação de documentos por cláusula
- [x] Indicadores de qualidade com métricas e metas
- [ ] Templates são orientativos, não geram documentos estruturados no GED automaticamente

### 2.3 Item 7.5.3 — Controle

#### 2.3.1 Disponibilidade e Proteção
- [x] Registros de NC acessíveis via dashboard e listagem
- [x] Filtros por status, severidade, data
- [x] Dados protegidos por company_id

#### 2.3.2 Retenção
- [x] Registros de NC e ações corretivas persistidos em banco de dados
- [ ] Sem política de retenção explícita para registros de qualidade
- [ ] Sem mecanismo de archiving/disposição

## 3. Mapeamento PSG-DOC

| # | Requisito PSG-DOC | Status | Evidência |
|---|-------------------|--------|-----------|
| P2 | Níveis de documentação (RG) | ⚠️ Parcial | Registros de qualidade existem mas sem codificação RG-XX |
| P3 | Sistema de codificação | ❌ Ausente | NCs e ações não seguem codificação PSG-DOC |
| P5 | Rastreabilidade | ✅ Implementado | Histórico de NC com datas, responsáveis, status |
| P11 | Lista Mestra | ❌ N/A | Registros de qualidade não são incluídos na Lista Mestra |
| P15 | Retenção | ❌ Ausente | Sem política de retenção para registros SGQ |

## 4. Evidências Detalhadas

### 4.1 Templates ISO
- `src/data/isoTemplates.ts` — Contém templates para cláusulas ISO 9001:2015 incluindo:
  - Referência a cláusula 7.5 (Informação Documentada)
  - Questões orientativas para cada cláusula
  - Requisitos de evidência para auditorias

### 4.2 Páginas SGQ
| Página | Função |
|--------|--------|
| `QualityDashboard.tsx` | Dashboard consolidado de indicadores |
| `NaoConformidades.tsx` | CRUD de não conformidades |
| `NCDetailsPage.tsx` | Detalhes de NC individual |
| `NCTarefas.tsx` | Tarefas vinculadas a NCs |
| `AcoesCorretivas.tsx` | Gestão de ações corretivas |
| `PlanoAcao5W2H.tsx` | Planos de ação estruturados |
| `GestaoIndicadores.tsx` | Indicadores de qualidade |
| `MapeamentoProcessos.tsx` | Mapeamento de processos |
| `GestaoRiscos.tsx` | Gestão de riscos |
| `BaseConhecimento.tsx` | Base de conhecimento |

### 4.3 Serviços
- `isoRequirements.ts` — Consulta de requisitos ISO por norma/cláusula

## 5. Lacunas e Recomendações

| # | Lacuna | Severidade | Recomendação |
|---|--------|------------|--------------|
| 1 | Registros SGQ sem codificação PSG-DOC | Média | Implementar auto-geração de código (RG-QUA.XX) |
| 2 | Sem vinculação NC ↔ Lista Mestra | Baixa | Registros de NC são transitórios, mas RGs permanentes devem constar |
| 3 | Sem retenção definida | Média | Configurar retenção para registros SGQ (ex: 5 anos) |
| 4 | Templates não geram documentos no GED | Média | Conectar templates à criação de documentos estruturados |

## 6. Nota de Confiança: 3.0/5

| Critério | Peso | Nota | Observação |
|----------|------|------|------------|
| Cobertura funcional 7.5 | 30% | 3/5 | Registros de qualidade presentes, sem gestão documental explícita |
| Aderência PSG-DOC | 25% | 2.5/5 | Sem codificação, sem retenção, sem Lista Mestra para RGs |
| Maturidade do código | 15% | 3.5/5 | Módulo robusto com dashboard, filtros, 5W2H |
| Rastreabilidade | 15% | 3.5/5 | Histórico de NC com status, datas, responsáveis |
| UX/Usabilidade | 15% | 3.5/5 | Dashboard visual, listagens com filtros |
| **Média ponderada** | **100%** | **3.0/5** | |

## 7. Guia de Verificação E2E

### Cenários de Teste

1. **Registrar NC**
   - Criar nova NC com descrição, causa raiz, ação corretiva
   - Verificar que registro persiste com timestamp e responsável

2. **Templates ISO**
   - Acessar templates para cláusula 7.5
   - Verificar que questões e requisitos de evidência são exibidos

3. **Indicadores**
   - Dashboard exibe métricas de qualidade
   - Filtros por período funcionam

### Checklist
- [ ] CRUD de NC funciona completamente
- [ ] Ações corretivas são vinculadas a NCs
- [ ] Plano 5W2H pode ser criado
- [ ] Templates ISO estão acessíveis
- [ ] Dashboard exibe indicadores corretamente
- [ ] Registros persistem após reload
