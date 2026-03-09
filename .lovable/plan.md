

## Refatorar SGQIsoDocumentsTab para espelhar a visão de Documentos Regulatórios

### Situação atual
- A tab SGQ/ISO mostra uma tabela simples baseada na tabela `documents` (nome do arquivo, categoria, filiais, tamanho, ações de download/leitura)
- O service layer para `sgq_iso_documents` com controle de validade, renovação e versões **já existe** (`src/services/sgqIsoDocuments.ts`)
- As tabelas no banco (`sgq_iso_documents`, `sgq_renewal_schedules`, `sgq_iso_document_settings`) **já existem**

### O que será feito
Reescrever `SGQIsoDocumentsTab.tsx` substituindo toda a implementação atual por uma versão que espelha exatamente o layout e features da `RegulatoryDocumentsTab`:

1. **Header**: Botão "Novo Documento SGQ" abrindo dialog de formulário completo com todos os campos (identificação, número, órgão emissor, processo, fonte externa, filial, responsável, emissão, validade, renovação, status renovação, protocolo, anexo, observações)

2. **Card de Filtros**: Busca textual, filial, tipo de documento (usando `SGQ_DOCUMENT_IDENTIFIER_OPTIONS`), status do documento (Vigente/A Vencer/Vencido), status de renovação

3. **Tabela principal** com as mesmas 16 colunas: Identificação, Nº Documento, Órgão Emissor, Processo, Filial, Responsável, Emissão, Validade, Dias Restantes, Status Documento, Status Renovação, Fonte Externa, Protocolo, Versões, Última Atualização, Ações (Editar + Anexar versão)

4. **Dialog de versões**: Histórico de anexos com download

5. **Queries**: Usar `react-query` chamando `getSgqDocuments`, `getSgqResponsibleUsers`, `getSgqSettings`, `getSgqDocumentVersions` do service existente

### Arquivo modificado
- `src/components/document-control/SGQIsoDocumentsTab.tsx` — reescrita completa (~900 linhas, espelhando a estrutura da RegulatoryDocumentsTab)

