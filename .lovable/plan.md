

# Revisões Compreensivas — Mostrar Avaliação e Unidade nos Detalhes

## Problema

Atualmente, os detalhes de uma revisão mostram apenas badges genéricos "Avaliação" ou "Setor" sem identificar **qual** avaliação foi alterada nem em **qual unidade**. O usuário precisa saber exatamente:
- Código do aspecto (ex: `12.07`)
- Atividade/Operação (ex: "BRIGADA DE EMERGÊNCIA")  
- Aspecto ambiental (ex: "POSSIBILIDADE DE INCÊNDIO")
- Nome da unidade (ex: "TRANSPORTES GABARDO LTDA")

Os dados já existem no banco (`branch_id`, `entity_id` com FK para `laia_assessments` e `branches`), mas o service não faz o JOIN necessário.

## Alterações

### 1. `src/services/laiaRevisionService.ts`

Enriquecer `getRevisionById` para, após buscar os changes, fazer JOINs adicionais:
- Buscar dados das **avaliações** referenciadas (`aspect_code`, `activity_operation`, `environmental_aspect`, `environmental_impact`, `sector` com nome)
- Buscar dados das **unidades** referenciadas (`branches.name`)
- Buscar dados dos **setores** referenciados (quando `entity_type === 'sector'`: `code`, `name`)

Adicionar ao tipo `LAIARevisionChange` campos opcionais de contexto:
```typescript
// Contexto enriquecido (adicionado após query)
assessment_info?: {
  aspect_code: string;
  activity_operation: string;
  environmental_aspect: string;
  environmental_impact: string;
  sector_name?: string;
};
branch_name?: string;
sector_info?: { code: string; name: string };
```

Implementação: após buscar os changes, coletar os `entity_id` únicos por tipo, fazer queries em batch para `laia_assessments` (com join em `laia_sectors`) e `branches`, e mapear os resultados de volta nos changes.

### 2. `src/components/laia/LAIARevisionDetail.tsx`

Reestruturar a visualização para ser compreensiva:

- **Agrupar primeiro por unidade (branch)**, depois por entidade dentro da unidade
- Para cada grupo de unidade, mostrar o nome da unidade como cabeçalho
- Para cada avaliação alterada, mostrar:
  - Código do aspecto + Atividade/Operação como título identificador
  - Aspecto ambiental e impacto como subtítulo
  - Setor associado
  - Badge de tipo de alteração (Criado/Editado/Removido)
  - Lista dos campos alterados com diff (old → new)
- Para setores alterados, mostrar código + nome do setor

Layout proposto:
```text
┌─ 📍 TRANSPORTES GABARDO LTDA ─────────────────────┐
│                                                      │
│  ┌─ Avaliação 12.07 — BRIGADA DE EMERGÊNCIA ──────┐│
│  │  Aspecto: POSSIBILIDADE DE INCÊNDIO             ││
│  │  Impacto: ...                                   ││
│  │  Setor: Manutenção                              ││
│  │  [Editado]                                      ││
│  │                                                  ││
│  │  Severidade:  Baixa → Média                     ││
│  │  Abrangência: Local → Regional                  ││
│  └──────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────┘
```

## Detalhes Técnicos

### Enriquecimento de dados no service

```typescript
// Após buscar changes, coletar IDs
const assessmentIds = changes.filter(c => c.entity_type === 'assessment').map(c => c.entity_id);
const sectorIds = changes.filter(c => c.entity_type === 'sector').map(c => c.entity_id);
const branchIds = changes.filter(c => c.branch_id).map(c => c.branch_id);

// Batch queries
const assessments = await supabase.from('laia_assessments')
  .select('id, aspect_code, activity_operation, environmental_aspect, environmental_impact, sector:laia_sectors(name)')
  .in('id', assessmentIds);

const branches = await supabase.from('branches')
  .select('id, name').in('id', branchIds);

const sectors = await supabase.from('laia_sectors')
  .select('id, code, name').in('id', sectorIds);

// Map back onto changes
```

### Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `src/services/laiaRevisionService.ts` | Expandir `LAIARevisionChange` com campos contextuais; enriquecer `getRevisionById` com JOINs |
| `src/components/laia/LAIARevisionDetail.tsx` | Reestruturar layout: agrupar por unidade, exibir identificação completa da avaliação/setor |

