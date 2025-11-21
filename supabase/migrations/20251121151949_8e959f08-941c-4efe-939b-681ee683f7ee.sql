-- Update activity_data dates from 2024 to 2025
UPDATE activity_data 
SET 
  period_start_date = period_start_date + interval '1 year',
  period_end_date = period_end_date + interval '1 year'
WHERE EXTRACT(YEAR FROM period_start_date) = 2024;