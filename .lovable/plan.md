
# Plano: PRD Backoffice - Gestao de Fornecedores (Visao do Gestor)

## Resumo

Gerar um PDF profissional focado exclusivamente no backoffice de gestao de fornecedores, sob a perspectiva do usuario "Gestor de Fornecedores". Exclui o portal externo e foca nos use cases, regras de negocio e fluxos operacionais do gestor.

## Estrutura do PRD

1. **Visao Geral do Modulo** - Escopo do backoffice, objetivo, persona do Gestor
2. **Cadastro de Fornecedores** - PJ/PF, unicidade CNPJ/CPF, auto-preenchimento via CEP, campos obrigatorios, geração automatica de senha temporaria e codigo de acesso
3. **Taxonomia e Classificacao** - Hierarquia Unidade > Categoria > Tipo, arvore de tipos com parent_type_id, vinculacao multipla por fornecedor
4. **Produtos e Servicos** - Catalogo por fornecedor (produto/servico), unidade de medida, usado como eixo de avaliacao AVA2
5. **Conexoes entre Fornecedores** - Tipos (logistica reversa, material perigoso, outro), vinculo bidirecional
6. **Gestao Documental** - Documentos obrigatorios com pesos (1-5), associacao Documento-Tipo, submissoes e avaliacoes (Aprovado/Rejeitado), isencao, adequacao, validade
7. **Avaliacao Documental (AVA1)** - Calculo por peso, threshold configuravel, snapshot de criterios, compliance_percentage, resultado Apto/Nao apto, proxima avaliacao obrigatoria
8. **Avaliacao de Desempenho (AVA2)** - 5 criterios (qualidade, entrega, preco, comunicacao, compliance), por produto/servico, scoring 0-10, visualizacao radar
9. **Gestao de Falhas e Inativacao** - 5 tipos x 4 severidades, contador acumulado, inativacao automatica em 3 falhas, bloqueio de reativacao temporizado, solicitacao de reativacao com justificativa
10. **Contratos** - Ciclo de vida (Ativo/Vencido), renovacao automatica, alertas 30 dias, valor, SLA, responsavel
11. **Entregas e Recebimentos** - Registro de entregas, vinculo com avaliacao, status (Pendente/Avaliado/Problema)
12. **Alertas e Vencimentos** - 3 tipos (documento, treinamento, avaliacao), status (Pendente/Visualizado/Resolvido), days_until_expiry
13. **Indicadores e Dashboards** - AVA1 (conformidade), AVA2 (desempenho), evolucao mensal, ranking de fornecedores
14. **Configuracoes do Modulo** - Criterios de avaliacao customizaveis, ponto minimo de aprovacao, documentos obrigatorios, categorias e tipos
15. **Fornecedores de Residuos** - Submodulo ambiental, transportadores e destinadores, licencas ambientais com validade

## Implementacao

- Script Python com reportlab
- Foco em use cases e fluxos do Gestor (sem detalhes de implementacao)
- Tabelas de regras de negocio formatadas
- Saida: `/mnt/documents/PRD_Backoffice_Gestao_Fornecedores_v2.pdf`
- QA visual obrigatorio
