

## Plano: Ajustes na Gestão de Legislações

### Contexto

Duas mudanças importantes são necessárias:

1. O campo "Aplicabilidade" na tabela de legislações pode confundir usuários, pois a aplicabilidade é definida **por unidade** (cada filial/site pode ter uma aplicabilidade diferente para a mesma legislação). Mostrar um valor único na tabela dá a impressão errada de que se aplica a todas as unidades.

2. O template de importação tem um campo "Observações" que na prática é usado para registrar **evidências** de conformidade. Ao reimportar planilhas, o sistema deve:
   - Identificar legislações já existentes (conciliação por tipo + número + título)
   - Adicionar o conteúdo do campo "Evidências" na seção de evidências da legislação correspondente

---

### Mudança 1: Remover Coluna "Aplicabilidade" da Tabela

**Arquivo:** `src/components/legislation/LegislationList.tsx`

| Localização | Ação |
|-------------|------|
| Linha 96 (header) | Remover `<TableHead className="w-[100px]">Aplicabilidade</TableHead>` |
| Linhas 149-153 (célula) | Remover célula com `LegislationStatusBadge type="applicability"` |

**Resultado:** A tabela mostrará apenas o status de conformidade, sem a aplicabilidade que é definida individualmente por unidade.

#### Nova Estrutura de Colunas:
| Tipo/Número | Data | Ementa | Macrotema | Jurisdição | Status | Ações |
|-------------|------|--------|-----------|------------|--------|-------|

---

### Mudança 2: Atualizar Sistema de Importação

#### 2.1. Renomear Campo no Template

**Arquivo:** `src/services/legislationImport.ts`

- Renomear coluna "Observações" → "Evidências" no template Excel (linha ~765)
- Atualizar sheet de instruções (linha ~821)
- Atualizar `ParsedLegislation` interface para incluir `evidence_text` 

#### 2.2. Conciliação Automática de Legislações

Atualizar lógica em `importLegislations()` para:

1. **Identificar legislação existente** usando critérios:
   - `norm_type` + `norm_number` (combinação única)
   - Fallback: `title` similar (caso não tenha número)

2. **Se legislação existe E há texto de evidência:**
   - Criar registro em `legislation_evidences` vinculado à legislação
   - Título: "Evidência importada via planilha"
   - Tipo: "documento" 
   - Descrição: conteúdo do campo "Evidências" da planilha

3. **Atualizar resultado da importação:**
   - Novo contador: `evidencesAdded`
   - Status "updated" para legislações que receberam evidências

#### 2.3. Fluxo de Conciliação

```text
┌─────────────────────────────────────────────────────────────────┐
│  Arquivo Excel                                                  │
│  ┌─────────┬──────────┬─────────────┬────────────────────────┐ │
│  │ Tipo    │ Número   │ Título      │ Evidências             │ │
│  ├─────────┼──────────┼─────────────┼────────────────────────┤ │
│  │ Lei     │ 12.305   │ PNRS        │ Licença ambiental OK   │ │
│  └─────────┴──────────┴─────────────┴────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Buscar legislação existente                                    │
│  WHERE norm_type = 'Lei' AND norm_number = '12.305'             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
         ┌────────────────────┴────────────────────┐
         ↓                                         ↓
    [ENCONTROU]                              [NÃO ENCONTROU]
         ↓                                         ↓
 ┌───────────────────────┐               ┌───────────────────────┐
 │ Adicionar evidência   │               │ Criar nova legislação │
 │ legislation_evidences │               │ + evidência (se houver│
 └───────────────────────┘               └───────────────────────┘
```

---

### Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/legislation/LegislationList.tsx` | Remover coluna e célula de Aplicabilidade |
| `src/services/legislationImport.ts` | Renomear "Observações" → "Evidências", implementar conciliação e criação de evidências |

---

### Interface Atualizada - Tabela de Legislações

Antes:
| Tipo/Número | Data | Ementa | Macrotema | Jurisdição | **Aplicabilidade** | Status | Ações |

Depois:
| Tipo/Número | Data | Ementa | Macrotema | Jurisdição | Status | Ações |

---

### Template de Importação Atualizado

| Coluna | Obrigatório | Descrição |
|--------|-------------|-----------|
| Tipo de Norma | Sim | Lei, Resolução, NBR, etc. |
| Número | Não | Número da norma |
| Título/Ementa | Sim | Descrição da legislação |
| ... | ... | (demais campos) |
| **Evidências** | Não | Texto será adicionado como evidência (tipo "documento") |

---

### Resultado da Reimportação

Quando o usuário reimportar uma planilha:

1. Legislações existentes **não serão duplicadas**
2. Textos do campo "Evidências" serão automaticamente adicionados à seção de evidências
3. Feedback claro: "X legislações atualizadas, Y evidências adicionadas"

