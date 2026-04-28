-- Resíduo do bug antigo de getColumnValue (corrigido em commit da241de8 no
-- dia 24/04). O fallback "last resort" aceitava match em ambas as direções,
-- então a busca por "Estado/UF/ESTADO" casava com a coluna unitária "ES" da
-- planilha federal/NBR/internacional ('estado'.includes('es') === true) e
-- copiava o valor da célula de avaliação (1/2/3/x/z) para legislations.state.
-- O bug não acontece mais em novos imports, mas o lixo está lá pra ~571 rows.
--
-- Limita a limpeza a jurisdições que NÃO têm dimensão geográfica (federal,
-- nbr, internacional, outros) e a valores que claramente são avaliação de
-- unidade — preserva qualquer state legítimo.
UPDATE legislations
SET state = NULL
WHERE jurisdiction IN ('federal', 'nbr', 'internacional', 'outros')
  AND state IS NOT NULL
  AND state ~* '^[123xz]$';
