# Análise ISO 9001:2015 — Item 7.5: Cópias Controladas

**Data da análise:** 2026-03-04
**Módulo:** Cópias Controladas
**Arquivo(s) principal(is):** `src/services/gedDocuments.ts` (controlledCopiesService, ControlledCopy interface)
**Nota de confiança:** 3.5/5

---

## 1. Descrição do Módulo

O módulo de Cópias Controladas rastreia a distribuição física e eletrônica de documentos controlados do SGQ. Registra número da cópia, destinatário (usuário ou departamento), localização, status e data de distribuição. Atende diretamente aos requisitos do PSG-DOC sobre cópias controladas vs não controladas e ao item 7.5.3.2(a) sobre distribuição e acesso.

Equivale ao controle de "Cópia Controlada" do PSG-DOC, onde cópias físicas são entregues e identificadas.

## 2. Análise por Sub-requisito ISO 7.5

### 2.1 Item 7.5.1 — Generalidades

**Situação no sistema:**
- [x] Registro de cópias distribuídas de documentos do SGQ
- [x] Diferenciação entre documento master e cópias

### 2.2 Item 7.5.2 — Criando e Atualizando

**Situação no sistema:**
- [x] Número da cópia (`copy_number`)
- [x] Destinatário por usuário (`assigned_to_user_id`) ou departamento (`assigned_department`)
- [x] Localização física (`location`)
- [x] Status da cópia (ativo, devolvido, etc.)
- [x] Data de distribuição (`distributed_date`)
- [x] Notas adicionais (`notes`)
- [ ] Sem distinção explícita "Controlada" vs "Não Controlada" na cópia (o documento pai tem `controlled_copy` boolean)

**Evidências:**
- `src/services/gedDocuments.ts:72-83` — Interface `ControlledCopy`:
  ```typescript
  interface ControlledCopy {
    copy_number: number;
    assigned_to_user_id?: string;
    assigned_department?: string;
    location?: string;
    status: string;
    distributed_date: string;
    last_updated: string;
    notes?: string;
  }
  ```

### 2.3 Item 7.5.3 — Controle

#### 2.3.1 Distribuição (7.5.3.2a)
- [x] Registro de quem recebeu a cópia
- [x] Registro de quando foi distribuída
- [x] Registro de onde está localizada
- [x] Status rastreável (ex: ativo, devolvido)

#### 2.3.2 Controle de Alterações
- [x] `last_updated` rastreia última atualização da cópia
- [ ] Sem notificação automática quando documento master é atualizado (para recolher cópias obsoletas)
- [ ] Sem fluxo de "devolução de cópias distribuídas" como PSG-DOC exige na exclusão

## 3. Mapeamento PSG-DOC

| # | Requisito PSG-DOC | Status | Evidência |
|---|-------------------|--------|-----------|
| P9 | Distribuição via software | ✅ Implementado | Registro completo de distribuição |
| P13 | Cópias controladas vs não-controladas | ⚠️ Parcial | controlled_copy boolean no documento, mas sem marca na cópia |
| P10 | Protocolo implementação | ❌ Ausente | Sem confirmação de recebimento/implementação |

**Sobre cópias físicas PSG-DOC:** O PSG-DOC especifica que "Para cópias físicas, responsável entrega à pessoa ou área que necessita acesso físico, sendo esta identificada como 'Cópia Controlada'". O sistema rastreia distribuição mas sem a marcação "Cópia Controlada" na própria cópia.

**Sobre devolução:** O PSG-DOC na seção "Exclusão de Documentos" requer "Solicita a devolução das cópias distribuídas". Não há workflow de devolução no sistema.

## 4. Evidências Detalhadas

### 4.1 Tabela `document_controlled_copies`
| Campo | Tipo | Função |
|-------|------|--------|
| `document_id` | uuid FK | Documento master |
| `copy_number` | integer | Número sequencial da cópia |
| `assigned_to_user_id` | uuid | Destinatário (usuário) |
| `assigned_department` | string | Destinatário (departamento) |
| `location` | string | Localização física |
| `status` | string | Status da cópia |
| `distributed_date` | timestamp | Data de distribuição |
| `last_updated` | timestamp | Última atualização |
| `notes` | text | Observações |

### 4.2 Serviço
- `controlledCopiesService.getControlledCopies(documentId)` — Lista cópias de um documento
- `controlledCopiesService.createControlledCopy(data)` — Registra nova cópia
- `controlledCopiesService.updateControlledCopy(id, updates)` — Atualiza status/localização
- `controlledCopiesService.deleteControlledCopy(id)` — Remove registro

## 5. Lacunas e Recomendações

| # | Lacuna | Severidade | Recomendação |
|---|--------|------------|--------------|
| 1 | Sem workflow de devolução | Média | Implementar fluxo "Solicitar Devolução" quando documento é obsoletado |
| 2 | Sem notificação de atualização | Alta | Notificar holders quando master é revisado (recolher cópia antiga) |
| 3 | Sem protocolo de confirmação | Média | Adicionar campo `acknowledged_date` para confirmar recebimento |
| 4 | Sem marca "Cópia Controlada" | Baixa | Gerar watermark/marca em cópias impressas via sistema |
| 5 | Status como string livre | Baixa | Usar enum (ativo, devolvido, obsoleto, perdido) |

## 6. Nota de Confiança: 3.5/5

| Critério | Peso | Nota | Observação |
|----------|------|------|------------|
| Cobertura funcional 7.5 | 30% | 4/5 | Distribuição rastreada com destinatário, local, data |
| Aderência PSG-DOC | 25% | 3/5 | Falta devolução, protocolo, marca de controlada |
| Maturidade do código | 15% | 3.5/5 | CRUD completo, tipagem TS |
| Rastreabilidade | 15% | 3.5/5 | copy_number, distributed_date, last_updated |
| UX/Usabilidade | 15% | 3.5/5 | Interface funcional integrada ao GED |
| **Média ponderada** | **100%** | **3.5/5** | |

## 7. Guia de Verificação E2E

### Cenários de Teste

1. **Criar Cópia Controlada**
   - Documento existente → registrar cópia controlada
   - Preencher: número, destinatário, departamento, localização
   - Salvar → verificar na lista de cópias

2. **Atualizar Status**
   - Cópia existente → alterar status para "devolvido"
   - Verificar que `last_updated` é atualizado

3. **Listar por Documento**
   - Documento com 3+ cópias → listar todas
   - Verificar que cada cópia tem número único
   - Verificar que destinatário e localização são exibidos

### Checklist
- [ ] CRUD de cópias controladas funciona
- [ ] copy_number é único por documento
- [ ] Destinatário por usuário e por departamento funciona
- [ ] Status pode ser atualizado
- [ ] last_updated reflete a data real
- [ ] Cópias de um documento são listadas corretamente
