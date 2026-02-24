

# Pagina de Detalhes do Setor na LAIA

## Objetivo
Criar uma pagina de detalhes para cada setor dentro de uma unidade, exibindo as avaliacoes daquele setor com filtros especificos (temporalidade, situacao operacional, incidencia e classe de impacto).

## Arquitetura

### Nova rota
`/laia/unidade/:branchId/setor/:sectorId`

### Arquivos a criar

**1. `src/pages/LAIASectorDetailPage.tsx`**
- Pagina principal com breadcrumb: LAIA > Unidade X > Setor Y
- Header com nome/codigo do setor e estatisticas resumidas (total de avaliacoes, criticos, significativos)
- Filtros: temporalidade, situacao operacional, incidencia, classe de impacto
- Tabela de avaliacoes filtrada pelo setor
- Reutiliza os componentes existentes (`LAIAAssessmentDetail` para visualizar detalhes)

### Arquivos a modificar

**2. `src/App.tsx`**
- Adicionar rota: `/laia/unidade/:branchId/setor/:sectorId` apontando para `LAIASectorDetailPage`

**3. `src/components/laia/LAIASectorManager.tsx`**
- Tornar cada linha da tabela de setores clicavel, navegando para a pagina de detalhes do setor
- Adicionar botao "Ver Detalhes" ou link no nome do setor

**4. `src/services/laiaService.ts`**
- Adicionar suporte aos novos filtros (`temporality`, `operational_situation`, `incidence`, `impact_class`) na funcao `getLAIAAssessments`

**5. `src/hooks/useLAIA.ts`**
- Atualizar tipagem dos filtros para incluir os novos campos

## Detalhes da Pagina de Detalhes do Setor

### Layout

```text
+-------------------------------------------------------+
| LAIA > Unidade ABC > Setor PROD                       |
| [<- Voltar]                                           |
|                                                       |
| PROD - Producao                                       |
| Descricao do setor                                    |
|                                                       |
| [Total: 12] [Criticos: 3] [Significativos: 5]        |
|                                                       |
| Filtros:                                              |
| [Temporalidade v] [Sit. Operacional v]                |
| [Incidencia v]    [Classe v]                          |
|                                                       |
| Tabela de avaliacoes do setor                         |
| Codigo | Atividade | Aspecto | Impacto | Pont. | ... |
+-------------------------------------------------------+
```

### Filtros disponíveis
- **Temporalidade**: Passada, Atual, Futura
- **Situacao Operacional**: Normal, Anormal, Emergencia
- **Incidencia**: Direto, Indireto
- **Classe de Impacto**: Benefico, Adverso

### Navegacao
- Na aba "Setores" da pagina da unidade, clicar no nome do setor leva a pagina de detalhes
- Breadcrumb permite voltar para a unidade ou para a lista de unidades

## Secao Tecnica

### Filtros no service (`getLAIAAssessments`)
Adicionar as seguintes clausulas opcionais:
```typescript
if (filters?.temporality) {
  query = query.eq("temporality", filters.temporality);
}
if (filters?.operational_situation) {
  query = query.eq("operational_situation", filters.operational_situation);
}
if (filters?.incidence) {
  query = query.eq("incidence", filters.incidence);
}
if (filters?.impact_class) {
  query = query.eq("impact_class", filters.impact_class);
}
```

### Rota no App.tsx
```typescript
<Route path="/laia/unidade/:branchId/setor/:sectorId" 
  element={<ProtectedLazyPageWrapper><LAIASectorDetailPage /></ProtectedLazyPageWrapper>} />
```

### Cards de estatisticas
Calculados client-side a partir das avaliacoes retornadas para o setor, usando os mesmos padroes visuais do `LAIADashboard`.

