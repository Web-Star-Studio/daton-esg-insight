DO $$
DECLARE
  source_company_id uuid;
  target_company_id uuid;
  target_user_id uuid;
  evaluator_employee_id uuid;
  participant_employee_id uuid;
  copied_count integer := 0;
  marker text := '[TESTE_SEGURO_GABARDO_EFICACIA]';
BEGIN
  SELECT p.company_id
    INTO source_company_id
  FROM public.profiles p
  WHERE lower(p.email) = 'jpbs@cesar.school'
  LIMIT 1;

  SELECT p.id, p.company_id
    INTO target_user_id, target_company_id
  FROM public.profiles p
  WHERE lower(p.email) = 'joaopedrobatista010@gmail.com'
  LIMIT 1;

  IF source_company_id IS NULL THEN
    RAISE EXCEPTION 'Empresa origem não encontrada para jpbs@cesar.school';
  END IF;

  IF target_user_id IS NULL OR target_company_id IS NULL THEN
    RAISE EXCEPTION 'Usuário/empresa destino não encontrado para joaopedrobatista010@gmail.com';
  END IF;

  DELETE FROM public.training_efficacy_evaluations tee
  USING public.training_programs tp
  WHERE tee.training_program_id = tp.id
    AND tp.company_id = target_company_id
    AND tp.description LIKE '%' || marker || '%';

  DELETE FROM public.employee_trainings et
  USING public.training_programs tp
  WHERE et.training_program_id = tp.id
    AND tp.company_id = target_company_id
    AND tp.description LIKE '%' || marker || '%';

  DELETE FROM public.training_programs tp
  WHERE tp.company_id = target_company_id
    AND tp.description LIKE '%' || marker || '%';

  SELECT e.id
    INTO evaluator_employee_id
  FROM public.employees e
  WHERE e.company_id = target_company_id
    AND lower(e.email) = 'joaopedrobatista010@gmail.com'
  LIMIT 1;

  IF evaluator_employee_id IS NULL THEN
    INSERT INTO public.employees (
      company_id,
      employee_code,
      full_name,
      email,
      department,
      position,
      hire_date,
      employment_type,
      status,
      notes
    ) VALUES (
      target_company_id,
      'TEST-EFICACIA-JPB',
      'João Batista - Avaliador Teste',
      'joaopedrobatista010@gmail.com',
      'Qualidade',
      'Avaliador de Eficácia',
      CURRENT_DATE,
      'CLT',
      'Ativo',
      marker
    )
    RETURNING id INTO evaluator_employee_id;
  END IF;

  SELECT e.id
    INTO participant_employee_id
  FROM public.employees e
  WHERE e.company_id = target_company_id
    AND e.employee_code = 'TEST-EFICACIA-PARTICIPANTE'
  LIMIT 1;

  IF participant_employee_id IS NULL THEN
    INSERT INTO public.employees (
      company_id,
      employee_code,
      full_name,
      email,
      department,
      position,
      hire_date,
      employment_type,
      status,
      notes
    ) VALUES (
      target_company_id,
      'TEST-EFICACIA-PARTICIPANTE',
      'Participante Teste - Avaliação de Eficácia',
      NULL,
      'Operação',
      'Participante de Teste',
      CURRENT_DATE,
      'CLT',
      'Ativo',
      marker
    )
    RETURNING id INTO participant_employee_id;
  END IF;

  CREATE TEMP TABLE tmp_copied_training_programs (
    source_id uuid PRIMARY KEY,
    target_id uuid NOT NULL
  ) ON COMMIT DROP;

  WITH source_programs AS (
    SELECT tp.*
    FROM public.training_programs tp
    WHERE tp.company_id = source_company_id
      AND tp.efficacy_evaluation_deadline IS NOT NULL
  ), inserted_programs AS (
    INSERT INTO public.training_programs (
      company_id,
      name,
      description,
      category,
      duration_hours,
      is_mandatory,
      valid_for_months,
      created_by_user_id,
      status,
      scheduled_date,
      branch_id,
      responsible_id,
      start_date,
      end_date,
      responsible_name,
      efficacy_evaluation_deadline,
      notify_responsible_email,
      responsible_email,
      efficacy_evaluator_employee_id,
      modality
    )
    SELECT
      target_company_id,
      sp.name,
      concat(marker, ' Cópia segura da Gabardo para teste de avaliação de eficácia. Origem training_program_id=', sp.id::text, E'\n', coalesce(sp.description, '')),
      sp.category,
      sp.duration_hours,
      sp.is_mandatory,
      sp.valid_for_months,
      target_user_id,
      sp.status,
      sp.scheduled_date,
      NULL,
      NULL,
      sp.start_date,
      sp.end_date,
      'João Batista - Avaliador Teste',
      sp.efficacy_evaluation_deadline,
      false,
      'joaopedrobatista010@gmail.com',
      evaluator_employee_id,
      sp.modality
    FROM source_programs sp
    ORDER BY sp.efficacy_evaluation_deadline, sp.name, sp.id
    RETURNING id, description
  )
  INSERT INTO tmp_copied_training_programs (source_id, target_id)
  SELECT substring(ip.description from 'Origem training_program_id=([0-9a-f-]{36})')::uuid, ip.id
  FROM inserted_programs ip;

  INSERT INTO public.employee_trainings (
    company_id,
    employee_id,
    training_program_id,
    completion_date,
    expiration_date,
    score,
    status,
    trainer,
    notes,
    attended,
    attendance_marked_at
  )
  SELECT
    target_company_id,
    participant_employee_id,
    m.target_id,
    sp.end_date,
    NULL,
    NULL,
    'Concluído',
    coalesce(sp.responsible_name, 'Instrutor Teste'),
    marker || ' Participante de teste criado para abrir o fluxo de avaliação. Origem training_program_id=' || m.source_id::text,
    true,
    now()
  FROM tmp_copied_training_programs m
  JOIN public.training_programs sp ON sp.id = m.source_id;

  SELECT count(*) INTO copied_count FROM tmp_copied_training_programs;

  RAISE NOTICE 'Replicados % treinamentos da Gabardo para Fike. Avaliador employee_id=%', copied_count, evaluator_employee_id;
END $$;