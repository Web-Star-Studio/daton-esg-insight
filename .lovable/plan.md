

## Plano: Exportar funcionários em CSV

### O que será feito
Adicionar um botão "Exportar CSV" na lista de funcionários (`EmployeesList.tsx`) que exporta todos os campos visíveis no formulário de cadastro (conforme as imagens) para um arquivo CSV.

### Campos exportados
CPF, Nome Completo, E-mail, Telefone, Departamento, Cargo, Data de Contratação, Data de Demissão, Data de Nascimento, Escolaridade, Gênero, Tipo de Contrato, Status, Filial, Localização Adicional, Informações Adicionais.

### Alterações

**1. `src/components/EmployeesList.tsx`**
- Importar `Download` do lucide-react e `exportToCSV` de `@/services/reportService`
- Adicionar função `handleExportCSV` que:
  - Busca **todos** os funcionários da empresa (sem paginação) via query direta ao Supabase, respeitando os filtros ativos (status, departamento, busca)
  - Mapeia os campos do banco para headers em português legível (ex: `full_name` → `Nome Completo`, `hire_date` → `Data de Contratação`)
  - Chama `exportToCSV(mappedData, "funcionarios")`
- Adicionar botão "Exportar CSV" ao lado do botão "Novo Funcionário" no header do card

**2. Sem novas dependências** — reutiliza a função `exportToCSV` já existente em `reportService.ts`.

### Detalhes técnicos
- A exportação busca todos os registros (não só a página atual), usando batch de 1000 como já feito em `useCompanyEmployees`
- Os filtros ativos (status, departamento, busca) são aplicados à exportação para consistência
- Headers CSV em português para facilitar uso em planilhas

