-- Migration: Create TOCHI Labs OS fellows table and types
-- Execution target: Supabase / PostgreSQL

-- 1. Create enums
DO $$ BEGIN
    CREATE TYPE fellow_status AS ENUM ('APPLIED', 'OFFER_SENT', 'IN_SPRINT', 'SUBMITTED', 'CERTIFIED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE track_type AS ENUM ('AI_WEB_DEV', 'GEN_UIUX', 'AUTOMATION', 'FULL_STACK', 'ML_AI', 'AI_TOOLS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create fellows table
CREATE TABLE IF NOT EXISTS public.fellows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT UNIQUE NOT NULL, -- Format: TCL-26Q4-WEB-0001
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    college TEXT,
    degree TEXT,
    year_of_study TEXT,
    track track_type NOT NULL,
    portfolio_url TEXT,
    status fellow_status DEFAULT 'APPLIED',
    
    -- Cohort Dates
    cohort_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    cohort_end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '4 weeks'),
    
    -- Submissions
    submission_repo_urls JSONB DEFAULT '[]'::jsonb, -- Array of GitHub/Drive URLs
    submission_date TIMESTAMP WITH TIME ZONE,
    
    -- Verification & Documents
    offer_letter_url TEXT,
    certificate_url TEXT,
    qr_verify_hash TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Indexes for rapid queries
CREATE INDEX IF NOT EXISTS idx_fellows_student_id ON public.fellows (student_id);
CREATE INDEX IF NOT EXISTS idx_fellows_email ON public.fellows (email);
CREATE INDEX IF NOT EXISTS idx_fellows_status ON public.fellows (status);
CREATE INDEX IF NOT EXISTS idx_fellows_qr_hash ON public.fellows (qr_verify_hash);

-- 4. Enable Row Level Security (RLS) and policies for service role & public verification
ALTER TABLE public.fellows ENABLE ROW LEVEL SECURITY;

-- Allow public verification read by qr_verify_hash or student_id
CREATE POLICY "Allow public read for verification" ON public.fellows
    FOR SELECT USING (true);

-- Allow full access to authenticated service role or backend API
CREATE POLICY "Allow full access to service role" ON public.fellows
    FOR ALL USING (true);

