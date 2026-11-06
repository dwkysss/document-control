-- ==============================================================================
-- DOCUMENT CONTROL SYSTEM - POSTGRESQL SCHEMA (STANDALONE VPS)
-- ISO 9001:2015 Clause 7.5 Documented Information
-- Multi-Company Support: DJI, UMI, IMK
-- ==============================================================================

-- 1. Companies Master Table
CREATE TABLE IF NOT EXISTS public.companies (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  color TEXT DEFAULT 'blue',
  badge_color TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  head TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Document Types Table (ISO Hierarchy)
CREATE TABLE IF NOT EXISTS public.document_types (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  level INTEGER DEFAULT 2 NOT NULL,
  prefix TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. Employees Table (6 ISO Roles)
CREATE TABLE IF NOT EXISTS public.employees (
  id TEXT PRIMARY KEY,
  nik TEXT UNIQUE NOT NULL,
  company_code TEXT DEFAULT 'DJI',
  company_name TEXT DEFAULT 'PT Dentelle Jaya Infinitex',
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'staff' NOT NULL,
  status TEXT DEFAULT 'Aktif' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. Verifier Teams Table
CREATE TABLE IF NOT EXISTS public.verifier_teams (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  leader TEXT NOT NULL,
  members JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. Master Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
  id TEXT PRIMARY KEY,
  doc_number TEXT NOT NULL,
  company_code TEXT DEFAULT 'DJI',
  company_name TEXT DEFAULT 'PT Dentelle Jaya Infinitex',
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  type_name TEXT,
  department TEXT NOT NULL,
  creator TEXT NOT NULL,
  creator_nik TEXT,
  creator_position TEXT,
  seq_number TEXT NOT NULL,
  revision TEXT DEFAULT '00' NOT NULL,
  status TEXT DEFAULT 'DRAFT' NOT NULL,
  created_date DATE NOT NULL,
  created_time TIME WITHOUT TIME ZONE,
  effective_date DATE,
  verifier_team TEXT NOT NULL,
  notes TEXT,
  content TEXT,
  file_name TEXT,
  file_size TEXT,
  file_url TEXT,
  file_type TEXT,
  superseded_by TEXT,
  obsolete_date DATE,
  change_reason TEXT,
  change_description TEXT,
  rejection_reason TEXT,
  rejected_by TEXT,
  rejected_date TEXT,
  approved_by TEXT,
  approved_date DATE,
  revision_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 7. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  user_name TEXT NOT NULL,
  nik TEXT,
  company_code TEXT DEFAULT 'DJI',
  action TEXT NOT NULL,
  doc_number TEXT,
  doc_title TEXT,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 8. System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  company_name TEXT DEFAULT 'PT Dentelle Jaya Infinitex',
  company_code TEXT DEFAULT 'DJI',
  system_name TEXT DEFAULT 'DOCUMENT CONTROL SYSTEM',
  iso_standard TEXT DEFAULT 'ISO 9001:2015',
  numbering_format TEXT DEFAULT '{COMPANY}-{TYPE}-{DEPT}-{SEQ:2}-{REV:2}',
  default_verifier_team TEXT DEFAULT 'Document Control Team',
  watermark_controlled_text TEXT DEFAULT 'CONTROLLED COPY - PT DJI',
  watermark_obsolete_text TEXT DEFAULT 'OBSOLETE - DO NOT USE',
  watermark_draft_text TEXT DEFAULT 'DRAFT - NOT FOR OPERATIONAL USE',
  enable_qr_stamp BOOLEAN DEFAULT true,
  enable_audit_auto_log BOOLEAN DEFAULT true,
  periodic_review_months INTEGER DEFAULT 12,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_department ON public.documents(department);
CREATE INDEX IF NOT EXISTS idx_documents_company ON public.documents(company_code);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(created_at DESC);
