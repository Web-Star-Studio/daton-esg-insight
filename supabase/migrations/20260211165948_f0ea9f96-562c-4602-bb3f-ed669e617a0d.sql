-- Remove FK constraint so responsible_user_id can reference employees instead of profiles
ALTER TABLE public.nc_immediate_actions 
DROP CONSTRAINT nc_immediate_actions_responsible_user_id_fkey;