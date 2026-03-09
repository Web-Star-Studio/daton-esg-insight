

# Adaptações no módulo /controle-documentos

## Resumo das mudanças

5 alterações concretas no módulo de Controle de Documentos:

### 1. Remover "— Item 7.5 (Informação Documentada)" do subtítulo
Editar `src/pages/ControleDocumentos.tsx` linha 16, substituir por texto focado em SGQ.

### 2. Recontextualizar como módulo SGQ (Gestão de Qualidade)
- Título: "Controle de Documentos SGQ"
- Subtítulo: "Gestão de documentos e registros do Sistema de Gestão da Qualidade"

### 3. Adicionar ações de envio (Revisão, Aprovação, Leitura) na tabela de documentos
No `SystemDocumentsTab.tsx`, adicionar um dropdown de ações por documento com:
- **Enviar para Revisão** — abre dialog para selecionar colaborador(es) revisores
- **Enviar para Aprovação** — abre dialog para selecionar aprovador(es)
- **Enviar para Leitura** — abre dialog de campanha de leitura (reutiliza o padrão de `createReadCampaign` do `documentCenter.ts`)
- **Confirmar Leitura** — ação direta para o próprio usuário confirmar
- **Ver Detalhes** — navega para `/documentos/{id}` (página de detalhes existente)

Cada ação abre um `Dialog` com `CollaboratorMultiSelect` para selecionar destinatários e campo de observações. As ações de Revisão e Aprovação usam `documentApprovalsService` para criar registros em `document_approvals`. A ação de Leitura usa `createReadCampaign`.

### 4. Linkar cada documento à página de detalhes existente
Na tabela do `SystemDocumentsTab`, o nome do documento vira um link clicável para `/documentos/{id}`. A rota `/controle-documentos/:id` já redireciona para `/documentos/:id` via `LegacyDocumentRedirect`, mas vamos usar `/documentos/:id` diretamente.

A página de detalhes (`SGQDocumentDetail.tsx`) já contém:
- Painel de IA (extração, confiança, preview)
- Versionamento formal (tipo Git, com timeline de revisões, alterações, quem alterou e quando)
- Relações entre documentos (referencia, complementa, substitui, depende de)
- Campanhas de leitura com confirmação por destinatário
- Solicitações internas

### 5. Referências entre documentos já existem
O sistema já suporta relações entre documentos via `createDocumentRelation` / `deleteDocumentRelation` no `documentCenter.ts`, com tipos: referencia, complementa, substitui, depende_de. Isso já está no `SGQDocumentDetail.tsx`. Nenhuma alteração necessária aqui.

## Arquivos modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/ControleDocumentos.tsx` | Título e subtítulo |
| `src/components/document-control/SystemDocumentsTab.tsx` | Dropdown de ações + dialogs de envio + link para detalhes |

## Componentes reutilizados (sem alteração)
- `CollaboratorMultiSelect` — seleção de destinatários
- `documentApprovalsService` — criação de aprovações
- `createReadCampaign` — campanhas de leitura
- `SGQDocumentDetail` — página de detalhes completa

