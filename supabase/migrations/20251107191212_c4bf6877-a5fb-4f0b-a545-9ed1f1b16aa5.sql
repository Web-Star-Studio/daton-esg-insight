-- Inserir profile faltante para o usuário atual com todos os campos obrigatórios
INSERT INTO public.profiles (id, full_name, company_id)
SELECT 
  'b7b219a5-44cd-4486-8a83-197142740019'::uuid,
  'Usuário Admin'::text,
  '27e673fe-e269-4029-aa20-f937778712d1'::uuid
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE id = 'b7b219a5-44cd-4486-8a83-197142740019'::uuid
);

-- Comentário: Esta migração garante que o usuário atual tenha um profile válido
-- O trigger on_auth_user_created já existe e cria profiles automaticamente para novos usuários