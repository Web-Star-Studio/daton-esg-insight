-- Add missing updated_at column to ai_performance_metrics
ALTER TABLE public.ai_performance_metrics 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_ai_performance_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_performance_metrics_updated_at_trigger
  BEFORE UPDATE ON public.ai_performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_performance_metrics_updated_at();