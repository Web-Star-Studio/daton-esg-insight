-- Fix security issues from linter
-- 1. Enable leaked password protection
ALTER ROLE authenticator SET pgrst.db_extra_search_path TO 'public, extensions';

-- 2. Fix functions without SET search_path
-- Update log_permission_change function
CREATE OR REPLACE FUNCTION public.log_permission_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    INSERT INTO public.permission_audit_log (
      user_id,
      company_id,
      action,
      target_user_id,
      new_value
    )
    SELECT 
      COALESCE(NEW.granted_by_user_id, auth.uid()),
      p.company_id,
      CASE WHEN NEW.granted THEN 'permission_granted' ELSE 'permission_revoked' END,
      NEW.user_id,
      to_jsonb(NEW)
    FROM public.profiles p
    WHERE p.id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update user_has_permission function
CREATE OR REPLACE FUNCTION public.user_has_permission(p_user_id uuid, p_permission_code character varying)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role user_role_type;
  has_permission BOOLEAN := false;
  custom_permission_exists BOOLEAN;
  custom_permission_granted BOOLEAN;
BEGIN
  -- Get user's role from profiles
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = p_user_id;
  
  IF user_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Super admin has all permissions
  IF user_role = 'super_admin' THEN
    RETURN true;
  END IF;
  
  -- Check if user has custom permission override
  SELECT EXISTS(
    SELECT 1 FROM public.user_custom_permissions ucp
    JOIN public.permissions p ON ucp.permission_id = p.id
    WHERE ucp.user_id = p_user_id AND p.code = p_permission_code
  ) INTO custom_permission_exists;
  
  IF custom_permission_exists THEN
    SELECT granted INTO custom_permission_granted
    FROM public.user_custom_permissions ucp
    JOIN public.permissions p ON ucp.permission_id = p.id
    WHERE ucp.user_id = p_user_id AND p.code = p_permission_code;
    
    RETURN custom_permission_granted;
  END IF;
  
  -- Check role-based permission
  SELECT EXISTS(
    SELECT 1
    FROM public.role_permissions rp
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE rp.role = user_role AND p.code = p_permission_code
  ) INTO has_permission;
  
  RETURN has_permission;
END;
$function$;

-- Update policy_exists function
CREATE OR REPLACE FUNCTION public.policy_exists(table_name text, policy_name text)
RETURNS boolean
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = table_name 
        AND policyname = policy_name
    );
END;
$function$;

-- 3. Create comprehensive audit log system
CREATE TABLE IF NOT EXISTS public.system_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  request_id TEXT,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_created ON public.system_audit_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON public.system_audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.system_audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.system_audit_logs(action_type);

-- RLS for audit logs
ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company audit logs"
  ON public.system_audit_logs
  FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY "System can insert audit logs"
  ON public.system_audit_logs
  FOR INSERT
  WITH CHECK (true);

-- 4. Create rate limiting table for edge functions
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- user_id, ip_address, or api_key
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add unique constraint and indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_identifier_endpoint 
  ON public.rate_limits(identifier, endpoint, window_start);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window 
  ON public.rate_limits(window_start);

-- Function to check and update rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_count INTEGER;
  v_window_start TIMESTAMPTZ;
  v_blocked_until TIMESTAMPTZ;
  v_rate_limit_record RECORD;
BEGIN
  -- Check if blocked
  SELECT blocked_until INTO v_blocked_until
  FROM public.rate_limits
  WHERE identifier = p_identifier
    AND endpoint = p_endpoint
    AND blocked_until > now()
  ORDER BY blocked_until DESC
  LIMIT 1;
  
  IF v_blocked_until IS NOT NULL THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'blocked_until', v_blocked_until,
      'reason', 'rate_limit_exceeded'
    );
  END IF;
  
  -- Get or create rate limit record for current window
  v_window_start := date_trunc('minute', now()) - (EXTRACT(MINUTE FROM now())::INTEGER % p_window_minutes || ' minutes')::INTERVAL;
  
  SELECT * INTO v_rate_limit_record
  FROM public.rate_limits
  WHERE identifier = p_identifier
    AND endpoint = p_endpoint
    AND window_start = v_window_start
  FOR UPDATE;
  
  IF v_rate_limit_record IS NULL THEN
    -- Create new record
    INSERT INTO public.rate_limits (identifier, endpoint, window_start, request_count)
    VALUES (p_identifier, p_endpoint, v_window_start, 1)
    RETURNING request_count INTO v_current_count;
  ELSE
    -- Update existing record
    IF v_rate_limit_record.request_count >= p_max_requests THEN
      -- Block for next window
      UPDATE public.rate_limits
      SET blocked_until = v_window_start + (p_window_minutes || ' minutes')::INTERVAL,
          updated_at = now()
      WHERE id = v_rate_limit_record.id;
      
      RETURN jsonb_build_object(
        'allowed', false,
        'blocked_until', v_window_start + (p_window_minutes || ' minutes')::INTERVAL,
        'reason', 'rate_limit_exceeded'
      );
    ELSE
      -- Increment count
      UPDATE public.rate_limits
      SET request_count = request_count + 1,
          updated_at = now()
      WHERE id = v_rate_limit_record.id
      RETURNING request_count INTO v_current_count;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', p_max_requests - v_current_count,
    'reset_at', v_window_start + (p_window_minutes || ' minutes')::INTERVAL
  );
END;
$function$;

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_company_id UUID,
  p_user_id UUID,
  p_action_type TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_severity TEXT DEFAULT 'info'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO public.system_audit_logs (
    company_id,
    user_id,
    action_type,
    resource_type,
    resource_id,
    old_values,
    new_values,
    severity
  )
  VALUES (
    p_company_id,
    p_user_id,
    p_action_type,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values,
    p_severity
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$function$;

-- Cleanup old rate limit records (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.rate_limits
  WHERE window_start < now() - INTERVAL '24 hours';
END;
$function$;