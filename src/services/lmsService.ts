import { supabase } from "@/integrations/supabase/client";

// Types
export interface TrainingCourse {
  id: string;
  company_id: string;
  title: string;
  description?: string;
  category?: string;
  difficulty_level: string;
  estimated_duration_hours: number;
  thumbnail_url?: string;
  is_mandatory: boolean;
  prerequisites: any;
  learning_objectives: any;
  status: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  modules?: CourseModule[];
  enrollments_count?: number;
  completion_rate?: number;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  module_type: string;
  content_type?: string;
  content_url?: string;
  content_text?: string;
  duration_minutes: number;
  is_required: boolean;
  passing_score?: number;
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  id: string;
  course_id?: string;
  module_id?: string;
  title: string;
  description?: string;
  assessment_type: string;
  time_limit_minutes?: number;
  max_attempts: number;
  passing_score: number;
  randomize_questions: boolean;
  show_correct_answers: boolean;
  allow_review: boolean;
  created_at: string;
  updated_at: string;
  questions?: AssessmentQuestion[];
}

export interface AssessmentQuestion {
  id: string;
  assessment_id: string;
  question_text: string;
  question_type: string;
  points: number;
  order_index: number;
  explanation?: string;
  media_url?: string;
  options: any;
  correct_answer: any;
  created_at: string;
}

export interface CourseEnrollment {
  id: string;
  course_id: string;
  employee_id: string;
  company_id: string;
  enrollment_date: string;
  start_date?: string;
  completion_date?: string;
  progress_percentage: number;
  status: string;
  assigned_by_user_id?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  course?: TrainingCourse;
  employee?: {
    full_name: string;
    department?: string;
  };
}

export interface ModuleProgress {
  id: string;
  enrollment_id: string;
  module_id: string;
  status: string;
  start_date?: string;
  completion_date?: string;
  time_spent_minutes: number;
  score?: number;
  created_at: string;
  updated_at: string;
}

export interface AssessmentAttempt {
  id: string;
  assessment_id: string;
  enrollment_id: string;
  attempt_number: number;
  start_time: string;
  end_time?: string;
  score?: number;
  max_score?: number;
  percentage?: number;
  status: string;
  time_taken_minutes?: number;
  answers: any;
  created_at: string;
}

export interface LearningPath {
  id: string;
  company_id: string;
  title: string;
  description?: string;
  courses: any;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

class LMSService {
  // Training Courses
  async getCourses(): Promise<TrainingCourse[]> {
    console.log('Fetching training courses...');
    
    const { data, error } = await supabase
      .from('training_courses')
      .select(`
        *,
        course_modules (
          id,
          title,
          order_index,
          module_type,
          duration_minutes
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching courses:', error);
      throw new Error(`Erro ao buscar cursos: ${error.message}`);
    }

    console.log('Courses fetched successfully:', data?.length || 0);
    return data || [];
  }

  async createCourse(courseData: Partial<TrainingCourse>): Promise<TrainingCourse> {
    console.log('Creating course:', courseData);
    
    try {
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse.user) {
        throw new Error('Usuário não autenticado');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userResponse.user.id)
        .single();

      if (!profile?.company_id) {
        throw new Error('Perfil do usuário não encontrado');
      }

      const { data, error } = await supabase
        .from('training_courses')
        .insert([{
          title: courseData.title || 'Novo Curso',
          description: courseData.description,
          category: courseData.category,
          difficulty_level: courseData.difficulty_level || 'Iniciante',
          estimated_duration_hours: courseData.estimated_duration_hours || 1,
          thumbnail_url: courseData.thumbnail_url,
          is_mandatory: courseData.is_mandatory || false,
          prerequisites: courseData.prerequisites || [],
          learning_objectives: courseData.learning_objectives || [],
          status: courseData.status || 'Rascunho',
          company_id: profile.company_id,
          created_by_user_id: userResponse.user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating course:', error);
        throw new Error(`Erro ao criar curso: ${error.message}`);
      }

      console.log('Course created successfully:', data);
      return data;
    } catch (error) {
      console.error('Detailed course creation error:', error);
      throw error;
    }
  }

  async updateCourse(courseId: string, courseData: Partial<TrainingCourse>): Promise<TrainingCourse> {
    const { data, error } = await supabase
      .from('training_courses')
      .update(courseData)
      .eq('id', courseId)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar curso: ${error.message}`);
    }

    return data;
  }

  async deleteCourse(courseId: string): Promise<void> {
    const { error } = await supabase
      .from('training_courses')
      .delete()
      .eq('id', courseId);

    if (error) {
      throw new Error(`Erro ao excluir curso: ${error.message}`);
    }
  }

  // Course Modules
  async getCourseModules(courseId: string): Promise<CourseModule[]> {
    const { data, error } = await supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar módulos: ${error.message}`);
    }

    return data || [];
  }

  async createModule(moduleData: Partial<CourseModule>): Promise<CourseModule> {
    const { data, error } = await supabase
      .from('course_modules')
      .insert([{
        course_id: moduleData.course_id!,
        title: moduleData.title || 'Novo Módulo',
        description: moduleData.description,
        order_index: moduleData.order_index || 0,
        module_type: moduleData.module_type || 'lecture',
        content_type: moduleData.content_type,
        content_url: moduleData.content_url,
        content_text: moduleData.content_text,
        duration_minutes: moduleData.duration_minutes || 0,
        is_required: moduleData.is_required || false,
        passing_score: moduleData.passing_score
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar módulo: ${error.message}`);
    }

    return data;
  }

  async updateModule(moduleId: string, moduleData: Partial<CourseModule>): Promise<CourseModule> {
    const { data, error } = await supabase
      .from('course_modules')
      .update(moduleData)
      .eq('id', moduleId)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar módulo: ${error.message}`);
    }

    return data;
  }

  async deleteModule(moduleId: string): Promise<void> {
    const { error } = await supabase
      .from('course_modules')
      .delete()
      .eq('id', moduleId);

    if (error) {
      throw new Error(`Erro ao excluir módulo: ${error.message}`);
    }
  }

  // Assessments
  async getAssessments(courseId?: string): Promise<Assessment[]> {
    let query = supabase
      .from('assessments')
      .select(`
        *,
        assessment_questions (*)
      `)
      .order('created_at', { ascending: false });

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao buscar avaliações: ${error.message}`);
    }

    return data || [];
  }

  async createAssessment(assessmentData: Partial<Assessment>): Promise<Assessment> {
    const { data, error } = await supabase
      .from('assessments')
      .insert([{
        title: assessmentData.title || 'Nova Avaliação',
        description: assessmentData.description,
        assessment_type: assessmentData.assessment_type || 'quiz',
        course_id: assessmentData.course_id,
        module_id: assessmentData.module_id,
        time_limit_minutes: assessmentData.time_limit_minutes,
        max_attempts: assessmentData.max_attempts || 1,
        passing_score: assessmentData.passing_score || 70,
        randomize_questions: assessmentData.randomize_questions || false,
        show_correct_answers: assessmentData.show_correct_answers || true,
        allow_review: assessmentData.allow_review || true
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar avaliação: ${error.message}`);
    }

    return data;
  }

  async createAssessmentQuestion(questionData: Partial<AssessmentQuestion>): Promise<AssessmentQuestion> {
    const { data, error } = await supabase
      .from('assessment_questions')
      .insert([{
        assessment_id: questionData.assessment_id!,
        question_text: questionData.question_text || '',
        question_type: questionData.question_type || 'multiple_choice',
        points: questionData.points || 1,
        order_index: questionData.order_index || 0,
        explanation: questionData.explanation,
        media_url: questionData.media_url,
        options: questionData.options || [],
        correct_answer: questionData.correct_answer
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar questão: ${error.message}`);
    }

    return data;
  }

  // Enrollments
  async getCourseEnrollments(courseId?: string): Promise<CourseEnrollment[]> {
    let query = supabase
      .from('course_enrollments')
      .select(`
        *,
        training_courses (
          title,
          category,
          difficulty_level
        ),
        employees (
          full_name,
          department
        )
      `)
      .order('created_at', { ascending: false });

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao buscar matrículas: ${error.message}`);
    }

    return data || [];
  }

  async enrollEmployee(courseId: string, employeeId: string, assignedByUserId?: string): Promise<CourseEnrollment> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      const { data, error } = await supabase
        .from('course_enrollments')
        .insert([{
          course_id: courseId,
          employee_id: employeeId,
          company_id: profile?.company_id,
          assigned_by_user_id: assignedByUserId,
          enrollment_date: new Date().toISOString(),
          status: 'enrolled'
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao matricular funcionário: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error enrolling employee:', error);
      throw error;
    }
  }

  async updateEnrollmentProgress(enrollmentId: string, progressData: Partial<CourseEnrollment>): Promise<CourseEnrollment> {
    const { data, error } = await supabase
      .from('course_enrollments')
      .update(progressData)
      .eq('id', enrollmentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar progresso: ${error.message}`);
    }

    return data;
  }

  // Module Progress
  async getModuleProgress(enrollmentId: string): Promise<ModuleProgress[]> {
    const { data, error } = await supabase
      .from('module_progress')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar progresso dos módulos: ${error.message}`);
    }

    return data || [];
  }

  async updateModuleProgress(progressData: Partial<ModuleProgress>): Promise<ModuleProgress> {
    const { data, error } = await supabase
      .from('module_progress')
      .upsert([{
        enrollment_id: progressData.enrollment_id!,
        module_id: progressData.module_id!,
        status: progressData.status || 'not_started',
        start_date: progressData.start_date,
        completion_date: progressData.completion_date,
        time_spent_minutes: progressData.time_spent_minutes || 0,
        score: progressData.score
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar progresso do módulo: ${error.message}`);
    }

    return data;
  }

  // Assessment Attempts
  async startAssessmentAttempt(assessmentId: string, enrollmentId: string): Promise<AssessmentAttempt> {
    // Check for existing attempts
    const { data: existingAttempts } = await supabase
      .from('assessment_attempts')
      .select('attempt_number')
      .eq('assessment_id', assessmentId)
      .eq('enrollment_id', enrollmentId)
      .order('attempt_number', { ascending: false })
      .limit(1);

    const nextAttemptNumber = (existingAttempts?.[0]?.attempt_number || 0) + 1;

    const { data, error } = await supabase
      .from('assessment_attempts')
      .insert([{
        assessment_id: assessmentId,
        enrollment_id: enrollmentId,
        attempt_number: nextAttemptNumber,
        status: 'in_progress',
        answers: {}
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao iniciar tentativa: ${error.message}`);
    }

    return data;
  }

  async submitAssessmentAttempt(attemptId: string, answers: Record<string, any>): Promise<AssessmentAttempt> {
    const { data, error } = await supabase
      .from('assessment_attempts')
      .update({
        answers,
        status: 'completed',
        end_time: new Date().toISOString()
      })
      .eq('id', attemptId)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao submeter tentativa: ${error.message}`);
    }

    return data;
  }

  // Learning Paths
  async getLearningPaths(): Promise<LearningPath[]> {
    const { data, error } = await supabase
      .from('learning_paths')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar trilhas de aprendizagem: ${error.message}`);
    }

    return data || [];
  }

  async createLearningPath(pathData: Partial<LearningPath>): Promise<LearningPath> {
    try {
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse.user) {
        throw new Error('Usuário não autenticado');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userResponse.user.id)
        .single();

      const { data, error } = await supabase
        .from('learning_paths')
        .insert([{
          title: pathData.title || 'Nova Trilha de Aprendizagem',
          description: pathData.description,
          courses: pathData.courses || [],
          company_id: profile?.company_id,
          created_by_user_id: userResponse.user.id
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao criar trilha: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating learning path:', error);
      throw error;
    }
  }

  // Analytics and Reports
  async getCourseAnalytics(courseId: string) {
    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select('status')
      .eq('course_id', courseId);

    const totalEnrollments = enrollments?.length || 0;
    const completedEnrollments = enrollments?.filter(e => e.status === 'completed').length || 0;
    const inProgressEnrollments = enrollments?.filter(e => e.status === 'in_progress').length || 0;

    return {
      totalEnrollments,
      completedEnrollments,
      inProgressEnrollments,
      completionRate: totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0
    };
  }

  async getLMSMetrics() {
    const { data: courses } = await supabase
      .from('training_courses')
      .select('id, status');

    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select('status');

    const { data: assessments } = await supabase
      .from('assessment_attempts')
      .select('status, percentage');

    const totalCourses = courses?.length || 0;
    const activeCourses = courses?.filter(c => c.status === 'Ativo').length || 0;
    const totalEnrollments = enrollments?.length || 0;
    const completedEnrollments = enrollments?.filter(e => e.status === 'completed').length || 0;
    const completedAssessments = assessments?.filter(a => a.status === 'completed').length || 0;
    const avgAssessmentScore = assessments?.length > 0 ? 
      assessments.reduce((sum, a) => sum + (a.percentage || 0), 0) / assessments.length : 0;

    return {
      totalCourses,
      activeCourses,
      totalEnrollments,
      completedEnrollments,
      completionRate: totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0,
      completedAssessments,
      avgAssessmentScore: Math.round(avgAssessmentScore)
    };
  }
}

export const lmsService = new LMSService();