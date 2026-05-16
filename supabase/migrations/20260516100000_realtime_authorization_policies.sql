-- F-019 — habilitar Realtime Authorization
--
-- realtime.messages tem RLS habilitado (default do Supabase) mas sem
-- policies. Sem policy, channels com `private: true` recusam qualquer
-- subscribe/broadcast — quebraria os 16 .channel() do cliente.
--
-- Esta migration cria policies permissivas (authenticated only) que
-- restauram o comportamento de "qualquer authenticated pode subscrever",
-- mas agora exigindo um JWT válido no WebSocket handshake — o que
-- bloqueia conexões anônimas vazando entre tenants.
--
-- Os payloads de postgres_changes continuam protegidos pela RLS na
-- tabela de origem (notifications, audit_notifications, etc. já estão
-- escopadas por user_id ou company_id). A diferença é que agora o
-- handshake de subscription também é gated.
--
-- Endurecimento futuro (backlog): trocar `using (true)` por filtros
-- por topic — ex.: só autorizar topic `notifications-<auth.uid()>`.

BEGIN;

DROP POLICY IF EXISTS "authenticated_realtime_subscribe" ON realtime.messages;
CREATE POLICY "authenticated_realtime_subscribe"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "authenticated_realtime_broadcast" ON realtime.messages;
CREATE POLICY "authenticated_realtime_broadcast"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

COMMIT;
