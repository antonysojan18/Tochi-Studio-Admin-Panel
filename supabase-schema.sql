-- =====================================================================
-- TOCHI .DEV STUDIO // TOCHI LABS OS
-- Supabase PostgreSQL Database Schema & Migration
-- =====================================================================

-- 1. Create custom ENUM types (with safety checks)
do $$ begin
    if not exists (select 1 from pg_type where typname = 'fellow_status') then
        create type public.fellow_status as enum ('APPLIED', 'OFFER_SENT', 'IN_SPRINT', 'SUBMITTED', 'CERTIFIED');
    end if;
end $$;

do $$ begin
    if not exists (select 1 from pg_type where typname = 'track_type') then
        create type public.track_type as enum ('AI_WEB_DEV', 'GEN_UIUX', 'AUTOMATION', 'FULL_STACK', 'ML_AI', 'AI_TOOLS');
    end if;
end $$;

-- 2. Create the core `fellows` table
create table if not exists public.fellows (
    id uuid primary key default gen_random_uuid(),
    student_id text unique not null, -- Format: TCL-26Q4-WEB-0001
    full_name text not null,
    email text not null,
    phone text not null,
    college text,
    degree text,
    year_of_study text,
    track public.track_type not null,
    portfolio_url text,
    status public.fellow_status default 'APPLIED',
    
    -- Cohort Dates
    cohort_start_date date not null default current_date,
    cohort_end_date date not null default (current_date + interval '4 weeks'),
    
    -- Candidate Project Submissions
    submission_repo_urls jsonb default '[]'::jsonb, -- Array of GitHub, Drive, or Loom URLs
    submission_date timestamp with time zone,
    
    -- Verification & Document Artifacts
    offer_letter_url text,
    certificate_url text,
    qr_verify_hash text unique not null default encode(gen_random_bytes(16), 'hex'),
    
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 3. Rapid Query Indexes
create index if not exists idx_fellows_student_id on public.fellows (student_id);
create index if not exists idx_fellows_email on public.fellows (email);
create index if not exists idx_fellows_status on public.fellows (status);
create index if not exists idx_fellows_qr_hash on public.fellows (qr_verify_hash);

-- 4. Enable Row Level Security (RLS)
alter table public.fellows enable row level security;

-- 5. Access Policies
-- Policy A: Public read access for the public verification portal (/verify)
drop policy if exists "Allow public verification lookup" on public.fellows;
create policy "Allow public verification lookup" on public.fellows
    for select
    using (true);

-- Policy B: Service role / Admin full access for TOCHI Labs OS
drop policy if exists "Allow service role full operations" on public.fellows;
create policy "Allow service role full operations" on public.fellows
    for all
    using (true)
    with check (true);

-- 6. Initial Seed Candidates (Optional verification test records)
insert into public.fellows (
    student_id, full_name, email, phone, college, degree, year_of_study, track, status, cohort_start_date, cohort_end_date, qr_verify_hash
) values
    ('TCL-26Q4-WEB-0001', 'Aarav Sharma', 'aarav.sharma@example.com', '+919876543210', 'IIT Madras', 'B.Tech CS', '3rd Year', 'AI_WEB_DEV', 'IN_SPRINT', '2026-10-15', '2026-11-12', '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d'),
    ('TCL-26Q4-UIUX-0001', 'Ananya Iyer', 'ananya.iyer@example.com', '+919812345678', 'NID Ahmedabad', 'B.Des Interaction', '4th Year', 'GEN_UIUX', 'CERTIFIED', '2026-09-15', '2026-10-13', '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d')
on conflict (student_id) do nothing;

