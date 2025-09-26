-- Create a debug function to check authentication status
CREATE OR REPLACE FUNCTION debug_auth_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id uuid;
    user_profile record;
    result jsonb;
BEGIN
    -- Get current auth user
    current_user_id := auth.uid();
    
    -- Get profile information if user exists
    IF current_user_id IS NOT NULL THEN
        SELECT * INTO user_profile 
        FROM profiles 
        WHERE id = current_user_id;
    END IF;
    
    -- Build result
    result := jsonb_build_object(
        'auth_uid', current_user_id,
        'has_profile', user_profile IS NOT NULL,
        'profile_data', CASE 
            WHEN user_profile IS NOT NULL THEN to_jsonb(user_profile)
            ELSE null
        END
    );
    
    RETURN result;
END;
$$;