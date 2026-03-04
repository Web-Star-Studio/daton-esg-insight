# Análise ISO 9001:2015 — Item 7.5: Controle de Versões

**Data da análise:** 2026-03-04
**Módulo:** Controle de Versões de Documentos
**Arquivo(s) principal(is):** `src/components/DocumentVersionHistory.tsx`, `src/components/ArticleVersionHistory.tsx`, `src/services/gedDocuments.ts` (documentVersionsService)
**Nota de confiança:** 3.5/5

---

## 1. Descrição do Módulo

O módulo de Controle de Versões gerencia o histórico completo de revisões de cada documento no sistema. Cada versão registra número sequencial, hash de conteúdo para verificação de integridade, resumo das alterações, e identificação do responsável pela criação. Corresponde diretamente ao requisito do PSG-DOC de rastreabilidade de revisões com "número, data da revisão e o resumo da alteração".

Composto por: componente de histórico (`DocumentVersionHistory.tsx`), versão para artigos da base de conhecimento (`ArticleVersionHistory.tsx`), serviço backend (`documentVersionsService`), e tabela Supabase `document_versions`.

## 2. Análise por Sub-requisito ISO 7.5

### 2.1 Item 7.5.1 — Generalidades

**Situação no sistema:**
- [x] Toda versão de documento é registrada com metadados completos
- [x] Flag `is_current` identifica versão vigente
- [x] Histórico completo preservado (versões anteriores não são deletadas)

### 2.2 Item 7.5.2 — Criando e Atualizando

**Situação no sistema:**
- [x] `version_number` — número sequencial da revisão
- [x] `created_at` — data/hora da revisão
- [x] `changes_summary` — resumo das alterações (equivale ao campo PSG-DOC)
- [x] `created_by_user_id` — responsável pela revisão
- [x] `content_hash` — hash para verificação de integridade
- [x] `file_path` e `file_size` — referência ao arquivo físico da versão
- [x] `metadata` — metadados adicionais em JSON
- [ ] Sem campo para "motivo da revisão" separado de "resumo das alterações"
- [ ] `created_by_user_id` hardcoded como 'current-user' no serviço

**Evidências:**
- `src/services/gedDocuments.ts:4-17` — Interface `DocumentVersion`:
  ```typescript
  export interface DocumentVersion {
    id: string;
    document_id: string;
    version_number: number;
    title: string;
    content_hash?: string;
    file_path?: string;
    file_size?: number;
    changes_summary?: string;
    created_by_user_id: string;
    created_at: string;
    is_current: boolean;
    metadata?: any;
  }
  ```
- `src/services/gedDocuments.ts:155-171` — `createVersion()` com `created_by_user_id: 'current-user'` (hardcoded)

### 2.3 Item 7.5.3 — Controle

#### 2.3.1 Disponibilidade e Proteção
- [x] Versões anteriores preservadas e acessíveis
- [x] `content_hash` garante integridade do conteúdo
- [x] Download de versões específicas possível via `file_path`

#### 2.3.2 Controle de Alterações
- [x] Número sequencial incremental (`version_number`)
- [x] Ordenação por versão descendente (`order('version_number', { ascending: false })`)
- [x] Versão corrente marcada com `is_current = true`
- [ ] Sem mecanismo automático para marcar versão anterior como `is_current = false` ao criar nova
- [ ] Sem trigger de obsolescência automática ao criar nova versão (PSG-DOC: "revisão antiga guardada automaticamente como documento obsoleto")

## 3. Mapeamento PSG-DOC

| # | Requisito PSG-DOC | Status | Evidência |
|---|-------------------|--------|-----------|
| P5 | Rastreabilidade (num, data, resumo) | ✅ Implementado | version_number + created_at + changes_summary |
| P6 | Arquivamento obsoletos | ⚠️ Parcial | Versões preservadas, mas sem status "obsoleto" na versão |
| P12 | Ciclo 12 meses | ❌ N/A | Revisão periódica gerenciada pela Lista Mestra, não pelo versionamento |

## 4. Evidências Detalhadas

### 4.1 Tabela `document_versions`
| Campo | Tipo | Função |
|-------|------|--------|
| `document_id` | uuid FK | Documento pai |
| `version_number` | integer | Número sequencial da revisão |
| `title` | string | Título da versão |
| `content_hash` | string | Hash SHA para verificação de integridade |
| `file_path` | string | Caminho no storage para esta versão |
| `file_size` | bigint | Tamanho em bytes |
| `changes_summary` | text | Resumo das alterações |
| `created_by_user_id` | uuid | Quem criou esta versão |
| `is_current` | boolean | Se é a versão vigente |
| `metadata` | json | Metadados adicionais |

### 4.2 Serviço
- `documentVersionsService.getVersions(documentId)` — Lista todas as versões
- `documentVersionsService.getCurrentVersion(documentId)` — Busca versão corrente
- `documentVersionsService.createVersion(documentId, data)` — Cria nova versão

### 4.3 Componentes UI
- `DocumentVersionHistory.tsx` — Exibe timeline de versões com badges, datas, resumos
- `ArticleVersionHistory.tsx` — Versões de artigos da base de conhecimento

## 5. Lacunas e Recomendações

| # | Lacuna | Severidade | Recomendação |
|---|--------|------------|--------------|
| 1 | `created_by_user_id` hardcoded 'current-user' | Alta | Usar `auth.getUser()` para capturar usuário real |
| 2 | Sem toggle automático de `is_current` | Alta | Adicionar trigger SQL ou lógica no serviço que desativa `is_current` das versões anteriores |
| 3 | Sem status "obsoleto" por versão | Média | Adicionar campo `status` à tabela (vigente/obsoleto/arquivado) |
| 4 | Sem comparação entre versões (diff) | Baixa | Implementar diff visual entre duas versões |
| 5 | `changes_summary` é opcional | Média | Tornar obrigatório ao criar nova versão |

## 6. Nota de Confiança: 3.5/5

| Critério | Peso | Nota | Observação |
|----------|------|------|------------|
| Cobertura funcional 7.5 | 30% | 4/5 | Versionamento completo com hash, resumo, autor |
| Aderência PSG-DOC | 25% | 3.5/5 | Rastreabilidade ok, falta obsolescência automática |
| Maturidade do código | 15% | 2.5/5 | user_id hardcoded, sem toggle is_current automático |
| Rastreabilidade | 15% | 4/5 | content_hash, changes_summary, histórico preservado |
| UX/Usabilidade | 15% | 3.5/5 | Timeline visual, badges, mas sem diff |
| **Média ponderada** | **100%** | **3.5/5** | |

## 7. Guia de Verificação E2E

### Cenários de Teste

1. **Criar Nova Versão**
   - Abrir documento existente → criar nova versão
   - Verificar que `version_number` incrementa
   - Verificar que `is_current` da versão anterior fica `false`
   - Verificar que `changes_summary` é registrado

2. **Histórico Completo**
   - Documento com 3+ versões → abrir histórico
   - Verificar que todas as versões aparecem em ordem decrescente
   - Verificar que cada versão mostra: número, data, autor, resumo

3. **Integridade**
   - Verificar que `content_hash` é diferente entre versões com conteúdo diferente
   - Download de versão específica → arquivo corresponde à versão

### Checklist
- [ ] version_number incrementa corretamente
- [ ] is_current marca apenas a versão mais recente
- [ ] changes_summary é exibido no histórico
- [ ] created_by_user_id reflete o usuário real (não 'current-user')
- [ ] content_hash é calculado e armazenado
- [ ] Versões anteriores permanecem acessíveis
- [ ] Download de versão específica funciona
