-- Add shift column to employees
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS shift_type TEXT DEFAULT 'Morning';
