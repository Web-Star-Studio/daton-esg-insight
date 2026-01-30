/**
 * Career development entity types
 */

export interface CareerGoal {
  title: string;
  description?: string;
  target_date?: string;
  status?: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
}

export interface SkillDevelopment {
  skill_name: string;
  current_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  target_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface DevelopmentActivity {
  activity_type: 'training' | 'mentoring' | 'project' | 'certification' | 'other';
  description: string;
  scheduled_date?: string;
  completed?: boolean;
}

export interface DevelopmentNeed {
  area: string;
  priority?: 'low' | 'medium' | 'high';
  action_plan?: string;
}

export interface JobRequirement {
  requirement: string;
  is_mandatory?: boolean;
}

export interface JobBenefit {
  benefit: string;
  description?: string;
}

export interface CareerPlan {
  id: string;
  employee_id: string;
  goals: CareerGoal[];
  skills_to_develop: SkillDevelopment[];
  development_activities: DevelopmentActivity[];
  status?: string;
  created_at?: string;
  updated_at?: string;
}
