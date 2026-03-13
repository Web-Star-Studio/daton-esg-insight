

# Importação de Departamentos em Massa

## Visão Geral
Adicionar funcionalidade de importação de departamentos via CSV/XLSX na tab "Departamentos" de `/estrutura-organizacional`, incluindo download de template de exemplo.

## Arquivos a criar/alterar

### 1. Novo: `src/services/departmentImport.ts`
Serviço de importação com:
- Parsing de CSV (PapaParse) e XLSX
- Mapeamento de colunas: `name` (obrigatório), `description`, `parent_department` (nome do dept pai), `budget`, `cost_center`
- Reconciliação de `parent_department` por nome contra departamentos existentes
- Criação em lote via `supabase.from('departments').insert()`
- Geração de template CSV/XLSX para download com dados de exemplo
- Tipo `DepartmentImportResult` com contadores (created, skipped, errors, details)

### 2. Novo: `src/components/departments/DepartmentImportDialog.tsx`
Dialog modal com 3 estágios:
- **Upload**: Dropzone para CSV/XLSX + botões de download de template (CSV e XLSX)
- **Preview**: Tabela com dados parseados, validações inline (nome vazio, dept pai não encontrado)
- **Resultado**: Resumo de criados/erros/ignorados

### 3. Alterar: `src/components/DepartmentManager.tsx`
- Adicionar botão "Importar" ao lado do "Novo Departamento" no header
- Renderizar o `DepartmentImportDialog`
- Chamar `loadData()` após importação bem-sucedida

## Template de exemplo
Colunas do template:
| name | description | parent_department | budget | cost_center |
|------|-------------|-------------------|--------|-------------|
| Financeiro | Gestão financeira | | 50000 | CC-FIN |
| Contabilidade | Área contábil | Financeiro | 20000 | CC-CONT |

## Lógica de importação
1. Parse do arquivo → array de objetos
2. Buscar departamentos existentes (`getDepartments`)
3. Para cada linha:
   - Validar `name` obrigatório
   - Se `parent_department` informado, buscar ID pelo nome nos existentes (+ recém-criados)
   - Skip se departamento com mesmo nome já existe
4. Inserir em lote, respeitando ordem (pais antes de filhos)
5. Retornar resultado com detalhes

