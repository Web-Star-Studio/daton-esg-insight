import { supabase } from "@/integrations/supabase/client";

export interface QualityDashboard {
  metrics: {
    totalNCs: number;
    openNCs: number;
    totalRisks: number;
    highRisks: number;
    actionPlans: number;
    overdueActions: number;
  };
  recentNCs: Array<{
    id: string;
    nc_number: string;
    title: string;
    severity: string;
    status: string;
    created_at: string;
  }>;
  plansProgress: Array<{
    id: string;
    title: string;
    status: string;
    avgProgress: number;
  }>;
}

export interface NonConformityStats {
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  monthly: Record<string, number>;
}

export interface ActionPlanProgress {
  id: string;
  title: string;
  status: string;
  totalItems: number;
  completedItems: number;
  avgProgress: number;
  overdueItems: number;
  created_at: string;
}

export interface RiskMatrix {
  matrix: Array<Array<{
    probability: string;
    impact: string;
    risks: any[];
  }>>;
  riskCounts: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface ProcessEfficiency {
  id: string;
  name: string;
  type: string;
  status: string;
  totalActivities: number;
  valueAddedActivities: number;
  totalDuration: number;
  efficiencyRatio: number;
}

export interface QualityIndicators {
  ncTrend: {
    current: number;
    previous: number;
    change: number;
  };
  resolutionRate: {
    resolved: number;
    total: number;
    percentage: number;
  };
  overdueActions: number;
  qualityScore: number;
}

class QualityManagementService {
  async getQualityDashboard(): Promise<QualityDashboard> {
    const { data, error } = await supabase.functions.invoke('quality-management', {
      body: {},
      method: 'GET',
    });

    if (error) throw error;
    return data;
  }

  async getNonConformityStats(): Promise<NonConformityStats> {
    const { data, error } = await supabase.functions.invoke('quality-management/non-conformities/stats', {
      method: 'GET',
    });

    if (error) throw error;
    return data;
  }

  async getActionPlansProgress(): Promise<ActionPlanProgress[]> {
    const { data, error } = await supabase.functions.invoke('quality-management/action-plans/progress', {
      method: 'GET',
    });

    if (error) throw error;
    return data;
  }

  async getRiskMatrix(matrixId: string): Promise<RiskMatrix> {
    const { data, error } = await supabase.functions.invoke(`quality-management/risk-assessment/matrix?matrix_id=${matrixId}`, {
      method: 'GET',
    });

    if (error) throw error;
    return data;
  }

  async getProcessEfficiency(): Promise<ProcessEfficiency[]> {
    const { data, error } = await supabase.functions.invoke('quality-management/process-efficiency', {
      method: 'GET',
    });

    if (error) throw error;
    return data;
  }

  async getQualityIndicators(): Promise<QualityIndicators> {
    const { data, error } = await supabase.functions.invoke('quality-management/quality-indicators', {
      method: 'GET',
    });

    if (error) throw error;
    return data;
  }

  // Strategic Maps methods
  async getStrategicMaps() {
    const { data, error } = await supabase
      .from('strategic_maps')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async createStrategicMap(mapData: {
    name: string;
    description: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) throw new Error("Company ID não encontrado");

    const { data, error } = await supabase
      .from('strategic_maps')
      .insert([{ ...mapData, company_id: profile.company_id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // BSC Perspectives methods
  async getBSCPerspectives(strategicMapId: string) {
    const { data, error } = await supabase
      .from('bsc_perspectives')
      .select(`
        *,
        bsc_objectives(*)
      `)
      .eq('strategic_map_id', strategicMapId)
      .order('order_index', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  async createBSCPerspective(perspectiveData: {
    strategic_map_id: string;
    name: string;
    description: string;
    order_index?: number;
  }) {
    const { data, error } = await supabase
      .from('bsc_perspectives')
      .insert([perspectiveData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Process Maps methods
  async getProcessMaps() {
    const { data, error } = await supabase
      .from('process_maps')
      .select(`
        *,
        process_activities(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async createProcessMap(processData: {
    name: string;
    description: string;
    process_type: string;
    owner_user_id?: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) throw new Error("Company ID não encontrado");

    const { data, error } = await supabase
      .from('process_maps')
      .insert([{ ...processData, company_id: profile.company_id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Risk Management methods
  async getRiskMatrices() {
    const { data, error } = await supabase
      .from('risk_matrices')
      .select(`
        *,
        risk_assessments(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async createRiskMatrix(matrixData: {
    name: string;
    description: string;
    matrix_type: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) throw new Error("Company ID não encontrado");

    const { data, error } = await supabase
      .from('risk_matrices')
      .insert([{ ...matrixData, company_id: profile.company_id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Non-Conformities methods
  async getNonConformities() {
    const { data, error } = await supabase
      .from('non_conformities')
      .select(`
        *,
        corrective_actions(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async createNonConformity(ncData: {
    title: string;
    description: string;
    category: string;
    severity: string;
    source: string;
    detected_date: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) throw new Error("Company ID não encontrado");

    // Generate NC number
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-4);
    const nc_number = `NC-${year}${month}${day}-${timestamp}`;

    const { data, error } = await supabase
      .from('non_conformities')
      .insert([{
        ...ncData,
        nc_number,
        company_id: profile.company_id,
        detected_by_user_id: user.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Action Plans methods
  async getActionPlans() {
    const { data, error } = await supabase
      .from('action_plans')
      .select(`
        *,
        action_plan_items(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async createActionPlan(planData: {
    title: string;
    description: string;
    objective: string;
    plan_type: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) throw new Error("Company ID não encontrado");

    const { data, error } = await supabase
      .from('action_plans')
      .insert([{
        ...planData,
        company_id: profile.company_id,
        created_by_user_id: user.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createActionPlanItem(itemData: {
    action_plan_id: string;
    what_action: string;
    why_reason: string;
    where_location: string;
    when_deadline: string;
    who_responsible_user_id: string;
    how_method: string;
    how_much_cost: number;
  }) {
    const { data, error } = await supabase
      .from('action_plan_items')
      .insert([itemData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Knowledge Articles methods
  async getKnowledgeArticles(filters?: {
    category?: string;
    search?: string;
    published_only?: boolean;
  }) {
    let query = supabase
      .from('knowledge_articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
    }

    if (filters?.published_only) {
      query = query.eq('is_published', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async createKnowledgeArticle(articleData: {
    title: string;
    content: string;
    category: string;
    tags?: string[];
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) throw new Error("Company ID não encontrado");

    const { data, error } = await supabase
      .from('knowledge_articles')
      .insert([{
        ...articleData,
        company_id: profile.company_id,
        author_user_id: user.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getKnowledgeArticle(id: string) {
    const { data, error } = await supabase
      .from('knowledge_articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async incrementArticleViewCount(id: string) {
    // First get the current view count
    const { data: currentData, error: fetchError } = await supabase
      .from('knowledge_articles')
      .select('view_count')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const newViewCount = (currentData.view_count || 0) + 1;

    // Then update with the incremented value
    const { data, error } = await supabase
      .from('knowledge_articles')
      .update({ view_count: newViewCount })
      .eq('id', id)
      .select('view_count')
      .single();

    if (error) throw error;
    return data;
  }

  async updateKnowledgeArticle(id: string, articleData: {
    title: string;
    content: string;
    category: string;
    tags?: string[];
    changes_summary?: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) throw new Error("Company ID não encontrado");

    // Get current article for version tracking
    const { data: currentArticle, error: fetchError } = await supabase
      .from('knowledge_articles')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Create version record
    await supabase
      .from('article_versions')
      .insert({
        article_id: id,
        version_number: currentArticle.version,
        title: currentArticle.title,
        content: currentArticle.content,
        category: currentArticle.category,
        tags: currentArticle.tags || [],
        changes_summary: articleData.changes_summary || 'Atualização do artigo',
        edited_by_user_id: user.id,
        company_id: profile.company_id
      });

    // Update article with new version
    const { data, error } = await supabase
      .from('knowledge_articles')
      .update({
        ...articleData,
        version: currentArticle.version + 1,
        last_edited_by_user_id: user.id,
        last_edited_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getArticleVersions(articleId: string) {
    const { data, error } = await supabase
      .from('article_versions')
      .select('*')
      .eq('article_id', articleId)
      .order('version_number', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getArticleComments(articleId: string) {
    const { data, error } = await supabase
      .from('article_comments')
      .select('*')
      .eq('article_id', articleId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  async createArticleComment(commentData: {
    article_id: string;
    comment_text: string;
    comment_type?: string;
    parent_comment_id?: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) throw new Error("Company ID não encontrado");

    const { data, error } = await supabase
      .from('article_comments')
      .insert({
        ...commentData,
        author_user_id: user.id,
        company_id: profile.company_id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async resolveComment(commentId: string) {
    const { data, error } = await supabase
      .from('article_comments')
      .update({ is_resolved: true })
      .eq('id', commentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Suppliers methods
  async getSuppliers() {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async createSupplier(supplierData: {
    name: string;
    cnpj?: string;
    contact_email?: string;
    contact_phone?: string;
    address?: string;
    category?: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) throw new Error("Company ID não encontrado");

    const { data, error } = await supabase
      .from('suppliers')
      .insert([{ ...supplierData, company_id: profile.company_id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Article Approval Management
  async requestArticleApproval(articleId: string, approverUserId: string, notes?: string) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Usuário não autenticado");

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.user.id)
      .single();

    if (!profile?.company_id) throw new Error("Company ID não encontrado");

    // Get current article version
    const { data: article } = await supabase
      .from("knowledge_articles")
      .select("version")
      .eq("id", articleId)
      .single();

    const { data, error } = await supabase
      .from("article_approvals")
      .insert({
        article_id: articleId,
        approver_user_id: approverUserId,
        version_number: article?.version || 1,
        approval_status: "pending",
        approval_notes: notes,
        company_id: profile.company_id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getArticleApprovals(articleId: string) {
    const { data, error } = await supabase
      .from("article_approvals")
      .select(`
        *,
        approver_profile:profiles!article_approvals_approver_user_id_fkey(full_name)
      `)
      .eq("article_id", articleId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateApprovalStatus(approvalId: string, status: "approved" | "rejected", notes?: string) {
    const { data, error } = await supabase
      .from("article_approvals")
      .update({
        approval_status: status,
        approval_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq("id", approvalId)
      .select()
      .single();

    if (error) throw error;

    // If approved, update article status
    if (status === "approved") {
      await supabase
        .from("knowledge_articles")
        .update({ 
          status: "Aprovado",
          is_published: true 
        })
        .eq("id", data.article_id);
    }

    return data;
  }

  async getPendingApprovals() {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("article_approvals")
      .select(`
        *,
        article:knowledge_articles(title, author_user_id),
        requester_profile:profiles!article_approvals_approver_user_id_fkey(full_name)
      `)
      .eq("approver_user_id", user.user.id)
      .eq("approval_status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getArticleAnalytics() {
    const { data: articles } = await supabase
      .from("knowledge_articles")
      .select("id, title, category, view_count, is_published")
      .eq("is_published", true);

    if (!articles) return null;

    // Calculate basic stats
    const totalViews = articles.reduce((sum, article) => sum + (article.view_count || 0), 0);
    const categories = [...new Set(articles.map(article => article.category))];
    
    // Most viewed articles
    const mostViewed = articles
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, 5);

    // Category distribution
    const categoryDistribution = categories.map(category => ({
      category,
      count: articles.filter(article => article.category === category).length
    })).sort((a, b) => b.count - a.count);

    return {
      total_articles: articles.length,
      total_views: totalViews,
      categories_count: categories.length,
      most_viewed_articles: mostViewed,
      category_distribution: categoryDistribution
    };
  }

  async getRecentActivities() {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  }

  // Article Bookmarks
  // Bookmark functions - temporarily disabled until types are updated
  // TODO: Re-enable after Supabase types are regenerated

  async addArticleBookmark(articleId: string) {
    console.log('Bookmark functionality temporarily disabled - types need to be updated');
    return null;
  }

  async removeArticleBookmark(articleId: string) {
    console.log('Bookmark functionality temporarily disabled - types need to be updated');
    return null;
  }

  async isArticleBookmarked(articleId: string) {
    console.log('Bookmark functionality temporarily disabled - types need to be updated');
    return false;
  }

  async getBookmarkedArticles() {
    console.log('Bookmark functionality temporarily disabled - types need to be updated');
    return [];
  }
}

export const qualityManagementService = new QualityManagementService();