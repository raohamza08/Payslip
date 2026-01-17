-- SQL Migration: Add Permissions Column to Users
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;

-- (Optional) Update existing super admins to have all permissions
UPDATE users 
SET permissions = '["employees", "payroll", "attendance", "reports", "expenses", "performance", "assets", "warnings", "email", "admin-leaves"]'::jsonb
WHERE role = 'super_admin';
