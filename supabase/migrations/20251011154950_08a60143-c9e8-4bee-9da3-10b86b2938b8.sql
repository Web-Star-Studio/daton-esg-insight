-- Add priority and metadata to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'info' CHECK (priority IN ('critical', 'important', 'info')),
ADD COLUMN IF NOT EXISTS action_type TEXT,
ADD COLUMN IF NOT EXISTS action_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Add dashboard preferences to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS dashboard_preferences JSONB DEFAULT '{
  "widgets": ["onboarding", "tasks", "goals", "intelligence"],
  "layout": "default"
}'::jsonb;

-- Create index for faster notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_priority_unread 
ON public.notifications(company_id, priority, read_at) 
WHERE read_at IS NULL;

-- Create index for dashboard preferences
CREATE INDEX IF NOT EXISTS idx_profiles_dashboard_prefs 
ON public.profiles USING gin(dashboard_preferences);

-- Add comment
COMMENT ON COLUMN notifications.priority IS 'Notification priority: critical (red), important (yellow), info (blue)';
COMMENT ON COLUMN notifications.action_type IS 'Type of quick action available: view, edit, approve, etc.';
COMMENT ON COLUMN profiles.dashboard_preferences IS 'User customizable dashboard layout and widget preferences';