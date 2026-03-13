

# Consolidação de Departamentos — Gabardo e Fike

## Lista correta (27 departamentos do Excel)

Abastecimento, Administrativo, Almoxarifado, Borracharia, Carregamento, Comercial, Compras, Diretoria, Financeiro, Frota, Higiene e Limpeza, Lavagem, Marketing, Frota - Motorista, Obra - Manutenção, Oficina - Manutenção, Operacional, Pátio, Pintura, Portaria e Vigia, Psicologia, Rastreador, Recepção, Recursos Humanos e DP, Segurança do Trabalho, **SGI - Sistema de Gestão Integrado**, TI - Tecnologia da Informação

## Estado atual
- **51 departamentos** por empresa (102 total), criados pela importação de funcionários
- **1 cargo** vinculado a departamento (será reatribuído ao novo dept. de TI)
- **0 registros** em organizational_chart
- **3.958 funcionários** com campo `department` texto a remapear

## Operações (todas via SQL direto no Supabase)

### Passo 1 — Remover cargo órfão
Atualizar o `department_id` do cargo "T.I" para `NULL` antes de deletar departamentos.

### Passo 2 — Deletar departamentos existentes
DELETE dos 102 departamentos de ambas as empresas.

### Passo 3 — Inserir 27 departamentos corretos
INSERT para cada empresa (54 registros total).

### Passo 4 — Remapear `employees.department`
Tabela de correspondência:

| Novo | Valores antigos |
|---|---|
| Abastecimento | ABASTECIMENTO, POSTO DE ABASTECIMENTO |
| Almoxarifado | ALMOXARIFADO, ALMOX 1, ALMOX 2 |
| Financeiro | FINANCEIRO, FINANCEIRO-ES |
| Frota - Motorista | MOTORISTA |
| Marketing | MARKETING, Marketing |
| Obra - Manutenção | OBRA, MANUTENCAO/CONCERTO DE PISTOES, MANUTENCAO/CONSERTO DE PISTOES |
| Oficina - Manutenção | OFICINA, OFICINA 1, OFICINA 2, OFICINA 3, OFICINA 4 |
| Pátio | PATIO |
| Pintura | PINTURA 1, PINTURA CARRETAS, PINTURA CAVALOS |
| Portaria e Vigia | PORTARIA, ENTRADA VEICULOS |
| Recursos Humanos e DP | DEPARTAMENTO PESSOAL, recurso humanos, Recursos Humanos, RH |
| Segurança do Trabalho | SEGURANCA TRABALHO |
| SGI - Sistema de Gestão Integrado | SGI - QUALIDADE E MEIO AMBIENTE, QUALIDADE, Qualidade, Meio Ambiente, ESTOQUE AUDITORIA POA |
| TI - Tecnologia da Informação | TI - TECNOLOGIA DE INFORMACAO, ANALISTA DE TI |
| Operacional | 0, Não encontrado, PESSOAS SAIDA, RECICLAGEM - PIRACICABA, RECICLAGEM - PORTO ALEGRE |

Departamentos que já batem (só padronizar casing): ADMINISTRATIVO→Administrativo, BORRACHARIA→Borracharia, CARREGAMENTO→Carregamento, COMERCIAL→Comercial, COMPRAS→Compras, DIRETORIA→Diretoria, HIGIENE E LIMPEZA→Higiene e Limpeza, LAVAGEM→Lavagem, OPERACIONAL→Operacional, PSICOLOGIA→Psicologia, RASTREADOR→Rastreador, Recepção→Recepção, FROTA→Frota.

### Passo 5 — Vincular cargo ao novo departamento de TI
Atualizar o `department_id` do cargo existente para o novo ID do departamento "TI - Tecnologia da Informação" da Gabardo.

## Sem alterações de código
Tudo feito via queries SQL. Nenhum arquivo do frontend precisa mudar.

