-- Run these commands in your Supabase SQL Editor to update the database schema

-- 1. Add master_password_hash column to users table
-- This stores the separate password for admin sensitive access
ALTER TABLE users ADD COLUMN IF NOT EXISTS master_password_hash TEXT;

-- 2. Add role column to whitelist table
-- This allows assigning roles (admin/super_admin/employee) before signup
ALTER TABLE whitelist ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'employee';

-- 3. Update existing admin users (Optional)
-- You may need to manually update existing admins to set a master password if they can't login to sensitive sections
-- UPDATE users SET master_password_hash = password_hash WHERE role IN ('admin', 'super_admin') AND master_password_hash IS NULL;
