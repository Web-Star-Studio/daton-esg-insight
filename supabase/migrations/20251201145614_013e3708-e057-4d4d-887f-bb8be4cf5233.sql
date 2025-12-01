CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  is_headquarters BOOLEAN DEFAULT false,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  country VARCHAR(100) DEFAULT 'Brasil',
  phone VARCHAR(50),
  manager_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'Ativo',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.employee_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  position_title VARCHAR(255) NOT NULL,
  department VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  reason_for_leaving VARCHAR(255),
  salary NUMERIC(15,2),
  contact_reference VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.employee_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  education_type VARCHAR(50) NOT NULL,
  institution_name VARCHAR(255) NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  field_of_study VARCHAR(255),
  start_date DATE,
  end_date DATE,
  is_completed BOOLEAN DEFAULT false,
  grade VARCHAR(50),
  certificate_number VARCHAR(100),
  certificate_url TEXT,
  expiration_date DATE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.employees ADD COLUMN branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_education ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_branches_company_id ON public.branches(company_id);
CREATE INDEX idx_employee_experiences_employee_id ON public.employee_experiences(employee_id);
CREATE INDEX idx_employee_experiences_company_id ON public.employee_experiences(company_id);
CREATE INDEX idx_employee_education_employee_id ON public.employee_education(employee_id);
CREATE INDEX idx_employee_education_company_id ON public.employee_education(company_id);
CREATE INDEX idx_employees_branch_id ON public.employees(branch_id);