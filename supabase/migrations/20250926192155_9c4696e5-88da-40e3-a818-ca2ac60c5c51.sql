-- Create comprehensive LMS structure for training management

-- Training Courses (main container for training programs)
CREATE TABLE training_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    difficulty_level VARCHAR(50) DEFAULT 'Iniciante',
    estimated_duration_hours INTEGER DEFAULT 0,
    thumbnail_url TEXT,
    is_mandatory BOOLEAN DEFAULT false,
    prerequisites JSONB DEFAULT '[]',
    learning_objectives JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'Rascunho',
    created_by_user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Course Modules/Lessons
CREATE TABLE course_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    module_type VARCHAR(50) DEFAULT 'lesson', -- lesson, assessment, assignment
    content_type VARCHAR(50), -- video, document, presentation, interactive
    content_url TEXT,
    content_text TEXT,
    duration_minutes INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT true,
    passing_score INTEGER, -- for assessments
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Assessment/Quiz System
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES training_courses(id) ON DELETE CASCADE,
    module_id UUID REFERENCES course_modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assessment_type VARCHAR(50) DEFAULT 'quiz', -- quiz, exam, assignment, survey
    time_limit_minutes INTEGER,
    max_attempts INTEGER DEFAULT 1,
    passing_score INTEGER DEFAULT 70,
    randomize_questions BOOLEAN DEFAULT false,
    show_correct_answers BOOLEAN DEFAULT true,
    allow_review BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Questions for assessments
CREATE TABLE assessment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) DEFAULT 'multiple_choice', -- multiple_choice, true_false, essay, fill_blank
    points INTEGER DEFAULT 1,
    order_index INTEGER NOT NULL,
    explanation TEXT,
    media_url TEXT,
    options JSONB DEFAULT '[]', -- for multiple choice questions
    correct_answer JSONB, -- stores correct answers
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Student enrollments in courses
CREATE TABLE course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id),
    enrollment_date TIMESTAMPTZ DEFAULT now(),
    start_date TIMESTAMPTZ,
    completion_date TIMESTAMPTZ,
    progress_percentage INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'enrolled', -- enrolled, in_progress, completed, failed, dropped
    assigned_by_user_id UUID,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(course_id, employee_id)
);

-- Module progress tracking
CREATE TABLE module_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'not_started', -- not_started, in_progress, completed
    start_date TIMESTAMPTZ,
    completion_date TIMESTAMPTZ,
    time_spent_minutes INTEGER DEFAULT 0,
    score INTEGER, -- for assessment modules
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(enrollment_id, module_id)
);

-- Assessment attempts and results
CREATE TABLE assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    start_time TIMESTAMPTZ DEFAULT now(),
    end_time TIMESTAMPTZ,
    score INTEGER,
    max_score INTEGER,
    percentage DECIMAL(5,2),
    status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, completed, abandoned
    time_taken_minutes INTEGER,
    answers JSONB DEFAULT '{}', -- stores user answers
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Learning paths (sequences of courses)
CREATE TABLE learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    courses JSONB DEFAULT '[]', -- ordered array of course IDs
    created_by_user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for all tables
ALTER TABLE training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their company training courses" ON training_courses
    FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Users can manage modules from their company courses" ON course_modules
    FOR ALL USING (EXISTS (
        SELECT 1 FROM training_courses 
        WHERE training_courses.id = course_modules.course_id 
        AND training_courses.company_id = get_user_company_id()
    ));

CREATE POLICY "Users can manage assessments from their company courses" ON assessments
    FOR ALL USING (EXISTS (
        SELECT 1 FROM training_courses 
        WHERE training_courses.id = assessments.course_id 
        AND training_courses.company_id = get_user_company_id()
    ));

CREATE POLICY "Users can manage questions from their company assessments" ON assessment_questions
    FOR ALL USING (EXISTS (
        SELECT 1 FROM assessments a
        JOIN training_courses tc ON a.course_id = tc.id
        WHERE a.id = assessment_questions.assessment_id 
        AND tc.company_id = get_user_company_id()
    ));

CREATE POLICY "Users can manage their company course enrollments" ON course_enrollments
    FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Users can manage progress from their company enrollments" ON module_progress
    FOR ALL USING (EXISTS (
        SELECT 1 FROM course_enrollments 
        WHERE course_enrollments.id = module_progress.enrollment_id 
        AND course_enrollments.company_id = get_user_company_id()
    ));

CREATE POLICY "Users can manage attempts from their company enrollments" ON assessment_attempts
    FOR ALL USING (EXISTS (
        SELECT 1 FROM course_enrollments ce
        JOIN assessments a ON a.id = assessment_attempts.assessment_id
        JOIN training_courses tc ON tc.id = a.course_id
        WHERE ce.id = assessment_attempts.enrollment_id 
        AND tc.company_id = get_user_company_id()
    ));

CREATE POLICY "Users can manage their company learning paths" ON learning_paths
    FOR ALL USING (company_id = get_user_company_id());

-- Triggers for updated_at
CREATE TRIGGER update_training_courses_updated_at
    BEFORE UPDATE ON training_courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_modules_updated_at
    BEFORE UPDATE ON course_modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_enrollments_updated_at
    BEFORE UPDATE ON course_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_module_progress_updated_at
    BEFORE UPDATE ON module_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_paths_updated_at
    BEFORE UPDATE ON learning_paths
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();