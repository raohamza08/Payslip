-- Role System Update for EurosHub HRMS
-- Execute this in your Supabase SQL Editor

-- 1. Update users table to support 3-tier role system
-- Roles: super_admin, admin, employee

-- 2. Add role-based permissions
-- super_admin: Full access to everything
-- admin: HR access - can manage employees, payroll, leaves, but NOT logs or whitelist
-- employee: Self-service only - own data, leave requests, payslips

-- Note: The application logic will handle role-based UI and API restrictions
-- This is just for documentation and future RLS policies

-- Example RLS policy for logs (super_admin only):
-- ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Super admins can view all logs" ON logs
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM users 
--       WHERE users.email = current_setting('request.jwt.claims')::json->>'email'
--       AND users.role = 'super_admin'
--     )
--   );

-- Example RLS policy for whitelist (super_admin only):
-- ALTER TABLE whitelist ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Super admins can manage whitelist" ON whitelist
--   FOR ALL USING (
--     EXISTS (
--       SELECT 1 FROM users 
--       WHERE users.email = current_setting('request.jwt.claims')::json->>'email'
--       AND users.role = 'super_admin'
--     )
--   );

-- Example RLS policy for leave_requests (employees see own, admins see all):
-- ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Employees see own leaves" ON leave_requests
--   FOR SELECT USING (
--     employee_id IN (
--       SELECT id FROM employees 
--       WHERE email = current_setting('request.jwt.claims')::json->>'email'
--     )
--     OR
--     EXISTS (
--       SELECT 1 FROM users 
--       WHERE users.email = current_setting('request.jwt.claims')::json->>'email'
--       AND users.role IN ('super_admin', 'admin')
--     )
--   );
