-- 1. Add biometric_id column to employees table if missing
alter table employees 
    add column if not exists biometric_id text;

-- 2. Create Biometric Logs Table
create table if not exists biometric_logs (
    id bigint primary key generated always as identity,
    biometric_id text not null,
    timestamp timestamp with time zone not null,
    direction text not null check (direction in ('IN', 'OUT')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Add Unique Constraint to prevent duplicates
alter table biometric_logs
    drop constraint if exists biometric_logs_unique_punch; -- drop old if exists
alter table biometric_logs
    add constraint biometric_logs_unique_punch unique (biometric_id, timestamp);

-- 4. Index for fast lookup by biometric_id and date
create index if not exists idx_biometric_logs_lookup 
    on biometric_logs(biometric_id, timestamp);

-- 5. Create App Config Table for PDF and other settings
create table if not exists app_config (
    key text primary key,
    value jsonb not null,
    updated_at timestamp with time zone default now()
);
