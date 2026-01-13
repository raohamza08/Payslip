-- EurosHub HRMS Add-on Modules Schema
-- Execute this in your Supabase SQL Editor to enable Cloud Storage for new modules

-- 1. Leave Management System
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID CONSTRAINT leave_requests_employee_id_fkey REFERENCES employees(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count DECIMAL NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'Pending',
    approved_by UUID REFERENCES users(id),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure columns exist for older tables
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS days_count DECIMAL;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS comment TEXT;

-- 2. KPI & Performance Management
CREATE TABLE IF NOT EXISTS performance_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID CONSTRAINT performance_reviews_employee_id_fkey REFERENCES employees(id) ON DELETE CASCADE,
    period TEXT NOT NULL,
    review_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure all columns exist (Idempotent updates)
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS quality_rating INT;
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS speed_rating INT;
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS initiative_rating INT;
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS teamwork_rating INT;
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS attendance_rating INT;
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS final_rating NUMERIC(3,1);
ALTER TABLE performance_reviews ALTER COLUMN final_rating TYPE NUMERIC(3,1); -- Ensure type is correct if already exists
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS comments TEXT;
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS reviewer_email TEXT;
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS review_date DATE DEFAULT CURRENT_DATE;

-- 3. Company Asset Management
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE assets ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS serial_number TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS assigned_to UUID CONSTRAINT assets_assigned_to_fkey REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Available';
ALTER TABLE assets ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'New';
ALTER TABLE assets ADD COLUMN IF NOT EXISTS purchase_date DATE;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS assigned_date DATE;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS return_date DATE;

-- 4. Warnings & Escalations (Discipline)
CREATE TABLE IF NOT EXISTS warnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID CONSTRAINT warnings_employee_id_fkey REFERENCES employees(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE warnings ADD COLUMN IF NOT EXISTS severity TEXT;
ALTER TABLE warnings ADD COLUMN IF NOT EXISTS level TEXT; -- For compatibility
ALTER TABLE warnings ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE warnings ADD COLUMN IF NOT EXISTS action_taken TEXT;
ALTER TABLE warnings ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;

ALTER TABLE warnings ADD COLUMN IF NOT EXISTS explanation TEXT;
ALTER TABLE warnings ADD COLUMN IF NOT EXISTS explanation_date TIMESTAMP WITH TIME ZONE;

-- 6. Notifications System
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_user_id TEXT, -- Can be employee_id or email
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT, -- 'warning', 'leave', 'performance', 'payroll'
    link TEXT, -- Internal route
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable RLS (Row Level Security) and Policies
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leave_requests' AND policyname = 'Public Access') THEN
        CREATE POLICY "Public Access" ON leave_requests FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'performance_reviews' AND policyname = 'Public Access') THEN
        CREATE POLICY "Public Access" ON performance_reviews FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assets' AND policyname = 'Public Access') THEN
        CREATE POLICY "Public Access" ON assets FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'warnings' AND policyname = 'Public Access') THEN
        CREATE POLICY "Public Access" ON warnings FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Public Access') THEN
        CREATE POLICY "Public Access" ON notifications FOR ALL USING (true);
    END IF;
    -- Also ensure employees are readable for the "Assign To" dropdowns
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employees' AND policyname = 'Public Access') THEN
        CREATE POLICY "Public Access" ON employees FOR ALL USING (true);
    END IF;
END $$;

-- Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    uploaded_by TEXT, -- Email of admin
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
-- Admin access: true, Employee access: filter by id
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Admin access to all documents') THEN
        CREATE POLICY "Admin access to all documents" ON documents FOR ALL USING (true);
    END IF;
END $$;

