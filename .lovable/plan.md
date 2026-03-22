
# Plano: Gerar PRD do Modulo de Fornecedores em PDF

## Resumo

Gerar um documento PDF profissional com o PRD completo do modulo de Gestao de Fornecedores, cobrindo todos os use cases, regras de negocio e especificacoes funcionais identificados no codebase.

## Conteudo do PRD

O documento cobre **14 secoes** baseadas na analise completa do modulo:

1. **Visao Geral** - Posicionamento do modulo (backoffice + portal externo)
2. **Usuarios e Personas** - Gestor, Admin de Portal, Fornecedor Externo
3. **Arquitetura Funcional** - 6 dominios: Cadastro, Documentacao, Desempenho, Falhas, Contratos, Portal
4. **Cadastro e Taxonomia** - PJ/PF, unicidade CNPJ/CPF, ViaCEP, hierarquia Unidade > Categoria > Tipo, produtos/servicos, conexoes, import/export Excel
5. **Documentacao e Compliance** - Documentos obrigatorios com pesos, associacao por tipo, submissao e avaliacao documental (AVA1) com threshold configuravel
6. **Avaliacao de Desempenho (AVA2)** - Scoring multi-criterio (qualidade, entrega, preco, comunicacao, compliance) por produto/servico
7. **Gestao de Falhas** - Tipos/severidade, inativacao automatica por acumulo, bloqueio de reativacao temporizado
8. **Contratos** - Ciclo de vida, renovacao automatica, alertas de vencimento
9. **Portal do Fornecedor** - Auth propria, leituras obrigatorias, pesquisas, treinamentos (arquivo/link/questionario), dashboard externo, filtragem por categoria
10. **Indicadores e Dashboards** - AVA1 (conformidade documental), AVA2 (desempenho), EXT1 (participacao no portal)
11. **Alertas e Vencimentos** - Documentos, treinamentos, avaliacoes
12. **Fornecedores de Residuos** - Submodulo ambiental com licencas
13. **Seguranca e Multi-tenancy** - RLS, auth do portal, roles
14. **Glossario** - Termos tecnicos do dominio

## Implementacao

- Script Python com `reportlab` para gerar PDF formatado profissionalmente
- Tabelas estilizadas, hierarquia visual de titulos, bullet points
- Saida em `/mnt/documents/PRD_Modulo_Fornecedores_Daton.pdf`
- QA visual apos geracao (conversao para imagem e inspecao)
