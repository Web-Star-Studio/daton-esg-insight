

# Fix: coluna `job_id` não existe em `extracted_data_preview`

## Causa raiz

Em `src/services/documentCenter.ts` (linha 490), a query usa `job_id` mas a coluna real na tabela é `extraction_job_id`. O mesmo erro ocorre na linha 498 onde filtra por `item.job_id`.

## Correção

Arquivo: `src/services/documentCenter.ts`

Linha 490: trocar `.select("id, job_id, ...")` por `.select("id, extraction_job_id, ...")`  
Linha 491: trocar `.in("job_id", jobIds)` por `.in("extraction_job_id", jobIds)`  
Linha 498: trocar `item.job_id` por `item.extraction_job_id`

Também tornar resiliente (catch em vez de throw) para não quebrar a página inteira se essa query auxiliar falhar.

