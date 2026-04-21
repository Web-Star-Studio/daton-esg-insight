CREATE OR REPLACE FUNCTION public.gabardo_federal_csv_chunk(p_offset int, p_length int)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH csv AS (
    SELECT
      'tipo,numero,data_pub,tematica,subtema,titulo,resumo,fonte,aplicabilidade_geral,status_geral,tem_notes,tem_responsavel,n_avaliacoes,poa,pir,go_carreg,go_frota,preal,sbc,sjp,duque,ira,palhoca,cariacica,eusebio,chui,camacari,suape,matriz' AS header,
      string_agg(
        concat_ws(',',
          '"' || replace(coalesce(tipo,''),'"','""') || '"',
          '"' || replace(coalesce(numero,''),'"','""') || '"',
          coalesce(data_pub::text,''),
          '"' || replace(coalesce(tematica,''),'"','""') || '"',
          '"' || replace(coalesce(subtema,''),'"','""') || '"',
          '"' || replace(coalesce(titulo,''),'"','""') || '"',
          '"' || replace(coalesce(resumo,''),'"','""') || '"',
          '"' || replace(coalesce(fonte,''),'"','""') || '"',
          coalesce(aplicabilidade_geral,''),
          coalesce(status_geral,''),
          tem_notes, tem_responsavel, n_avaliacoes::text,
          coalesce(poa,''), coalesce(pir,''), coalesce(go_carreg,''), coalesce(go_frota,''),
          coalesce(preal,''), coalesce(sbc,''), coalesce(sjp,''), coalesce(duque,''),
          coalesce(ira,''), coalesce(palhoca,''), coalesce(cariacica,''), coalesce(eusebio,''),
          coalesce(chui,''), coalesce(camacari,''), coalesce(suape,''), coalesce(matriz,'')
        ),
        E'\n' ORDER BY rn
      ) AS body
    FROM public.gabardo_federal_export
  )
  SELECT substring(header || E'\n' || body FROM p_offset FOR p_length) FROM csv;
$$;