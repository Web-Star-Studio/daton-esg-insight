

# Plano: PRD Backoffice - Modulo de Treinamentos (Visao do Gestor)

## Resumo

Gerar um PDF profissional focado no backoffice de gestao de treinamentos, sob a perspectiva do usuario "Gestor de Treinamentos". Baseado na analise completa de 12 arquivos de servico, utilitarios e dados do modulo.

## Estrutura do PRD (22 Secoes)

1. **Visao Geral** - Escopo do modulo: planejamento, execucao, monitoramento e avaliacao de treinamentos. Tres visoes: Programas, Treinamentos, Calendario. Inclui LMS completo.
2. **Persona: Gestor de Treinamentos** - Responsabilidades e fluxos operacionais do gestor.
3. **Arquitetura Funcional** - 8 dominios: Programas, Participantes, Presenca, Eficacia, Agendamento, Documentos, LMS, Indicadores.
4. **Programas de Treinamento** - Campos (name, category, duration_hours, is_mandatory, valid_for_months, start/end_date, branch_id, efficacy_evaluator_employee_id), regras de duplicacao, modalidades, bulk delete.
5. **Participantes e Inscricoes** - 5 status (Inscrito, Em Andamento, Concluido, Cancelado, Reprovado), verificacao de duplicidade, estatisticas automaticas (taxa de conclusao, nota media).
6. **Controle de Presenca** - Tres estados (Presente/Ausente/Nao Marcado), marcacao individual e em lote, auditoria (quem marcou e quando).
7. **Ciclo de Status Automatico** - Planejado → Em Andamento → Pendente Avaliacao → Concluido. Regras baseadas em datas e eficacia. Compatibilidade com status legados (Ativo, Inativo, Suspenso, Arquivado). Recalculo em 3 momentos.
8. **Avaliacao de Eficacia** - Resultado Efetivo/Nao Efetivo, score, comments. Recalculo automatico de status do programa. Privacidade por avaliador designado.
9. **Dashboard de Eficacia do Avaliador** - Fluxo de identificacao (email → employee → filtro). Status: Pendente, Avaliado, Atrasado.
10. **Agendamento de Sessoes** - Titulo, datas, horarios, local, instrutor, capacidade maxima. Gestao de participantes (add/remove/bulk/confirm/attendance).
11. **Documentos de Treinamento** - Upload para Supabase Storage, rollback automatico, download e exclusao.
12. **Categorias Customizaveis** - Unicidade por empresa (constraint 23505).
13. **Status Customizaveis** - Nome + cor CSS, isolados por empresa.
14. **LMS** - Cursos com modulos sequenciais, avaliacoes (quiz/prova), questoes com tipos variados, inscricoes com progresso percentual.
15. **Metricas e Indicadores** - Taxa de conclusao, nota media, horas treinadas, compliance rate, vencimentos (30/60 dias), distribuicao por categoria/departamento, tendencia mensal, top performers, ranking departamental.
16. **Analise GRI 404-1** - Horas por genero, departamento, cargo, categoria. Qualidade de dados (High/Medium/Low). Compliance automatico. Gaps (funcionarios sem treinamento, top/bottom 10).
17. **Metricas SST** - Filtro por categorias e palavras-chave (NR-, CIPA, Brigada, EPI). Compliance SST, horas e expiracoes.
18. **Benchmarks Setoriais** - 6 setores (Tecnologia, Financeiro, Saude, Manufatura, Varejo, Geral) com 4 niveis, fontes internacionais.
19. **Exportacao de Dados** - 6 tipos de relatorio (total, filial, departamento, cargo, treinamento, detalhado). CSV com BOM UTF-8 e Excel .xlsx.
20. **Regras de Exclusao** - Cascata obrigatoria em 5 etapas para evitar foreign key errors. Bulk delete.
21. **Multi-tenancy e Seguranca** - RLS, company_id via RPC, isolamento de storage e categorias.
22. **Glossario** - Termos do dominio.

## Implementacao

- Script Python com reportlab (ja preparado em /tmp/generate_training_prd.py)
- Tabelas estilizadas com cores da marca, hierarquia visual
- Saida: `/mnt/documents/PRD_Modulo_Treinamentos_Backoffice.pdf`
- QA visual obrigatorio apos geracao

