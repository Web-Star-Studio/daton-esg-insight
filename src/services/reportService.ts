import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface PerformanceReport {
  employee_id: string;
  employee_name: string;
  position: string;
  department: string;
  evaluation_period: string;
  overall_score: number;
  competency_scores: Array<{
    competency: string;
    score: number;
  }>;
  goals_achievement: number;
}

export interface CompetencyGapReport {
  competency_name: string;
  category: string;
  employees_assessed: number;
  average_current_level: number;
  average_target_level: number;
  average_gap: number;
  critical_gaps: number;
}

export const generatePerformanceReport = async (startDate?: string, endDate?: string): Promise<PerformanceReport[]> => {
  let query = supabase
    .from("performance_evaluations")
    .select(`
      *
    `)
    .eq("status", "completed");

  if (startDate) {
    query = query.gte("created_at", startDate);
  }
  if (endDate) {
    query = query.lte("created_at", endDate);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data?.map(evaluation => ({
    employee_id: evaluation.employee_id,
    employee_name: "N/A",
    position: "N/A",
    department: "N/A", 
    evaluation_period: format(new Date(evaluation.created_at), "MMMM yyyy", { locale: ptBR }),
    overall_score: evaluation.overall_score || 0,
    competency_scores: [],
    goals_achievement: 0
  })) || [];
};

export const generateCompetencyGapReport = async (): Promise<CompetencyGapReport[]> => {
  const { data, error } = await supabase
    .from("employee_competency_assessments")
    .select(`
      *,
      competency:competency_matrix(competency_name, competency_category)
    `);

  if (error) throw error;

  // Agrupar por competência
  const competencyGroups = data?.reduce((acc: any, assessment: any) => {
    const competencyName = assessment.competency?.competency_name;
    if (!competencyName) return acc;

    if (!acc[competencyName]) {
      acc[competencyName] = {
        competency_name: competencyName,
        category: assessment.competency?.competency_category || "N/A",
        assessments: []
      };
    }
    acc[competencyName].assessments.push(assessment);
    return acc;
  }, {});

  if (!competencyGroups) return [];

  return Object.values(competencyGroups).map((group: any) => {
    const assessments = group.assessments;
    const avgCurrent = assessments.reduce((sum: number, a: any) => sum + a.current_level, 0) / assessments.length;
    const avgTarget = assessments.reduce((sum: number, a: any) => sum + a.target_level, 0) / assessments.length;
    const avgGap = avgTarget - avgCurrent;
    const criticalGaps = assessments.filter((a: any) => (a.target_level - a.current_level) >= 2).length;

    return {
      competency_name: group.competency_name,
      category: group.category,
      employees_assessed: assessments.length,
      average_current_level: Number(avgCurrent.toFixed(1)),
      average_target_level: Number(avgTarget.toFixed(1)),
      average_gap: Number(avgGap.toFixed(1)),
      critical_gaps: criticalGaps
    };
  });
};

export const generateGoalsReport = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from("goals")
    .select(`*`);

  if (error) throw error;

  return data?.map(goal => ({
    id: goal.id,
    employee_name: "N/A",
    department: "N/A",
    goal_name: goal.name,
    target_value: goal.target_value,
    current_value: goal.baseline_value,
    progress_percentage: 0,
    status: goal.status,
    deadline: format(new Date(goal.deadline_date), "dd/MM/yyyy", { locale: ptBR })
  })) || [];
};

export const exportToCSV = (data: any[], filename: string) => {
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === "string" && value.includes(",") 
          ? `"${value}"` 
          : value;
      }).join(",")
    )
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};