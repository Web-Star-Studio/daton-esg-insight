import { supabase } from "@/integrations/supabase/client";
import { formErrorHandler } from "@/utils/formErrorHandler";

export interface KnowledgeArticle {
  id: string;
  company_id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  author_user_id: string;
  status?: string;
  version?: number;
  is_published?: boolean;
  view_count?: number;
  created_at: string;
  updated_at: string;
  requires_approval?: boolean;
  approval_status?: string;
  last_edited_by_user_id?: string;
  last_edited_at?: string;
}

export interface ArticleAnalytics {
  total_articles: number;
  total_views: number;
  categories_count: number;
  most_viewed_articles: Array<{
    id: string;
    title: string;
    views: number;
  }>;
  category_distribution: Array<{
    category: string;
    count: number;
  }>;
}

class KnowledgeBaseService {
  // Article methods
  async getKnowledgeArticles(): Promise<KnowledgeArticle[]> {
    try {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching knowledge articles:', error);
      return [];
    }
  }

  async createKnowledgeArticle(articleData: {
    title: string;
    content: string;
    category: string;
    tags: string[];
  }): Promise<KnowledgeArticle> {
    return formErrorHandler.createRecord(async () => {
      // Get authenticated user and company_id
      const { profile } = await formErrorHandler.checkAuth();
      
      const articlePayload = {
        title: articleData.title,
        content: articleData.content,
        category: articleData.category || null,
        tags: articleData.tags || [],
        company_id: profile.company_id,
        author_user_id: profile.id,
        status: 'Rascunho',
        version: 1,
        is_published: false,
        view_count: 0,
        requires_approval: false,
        approval_status: 'pending'
      };

      const { data, error } = await supabase
        .from('knowledge_articles')
        .insert(articlePayload)
        .select()
        .single();

      if (error) throw error;
      return data;
    }, { 
      formType: 'Artigo da Base de Conhecimento',
      successMessage: 'Artigo criado com sucesso!'
    });
  }

  async updateKnowledgeArticle(id: string, updates: Partial<KnowledgeArticle>): Promise<KnowledgeArticle> {
    return formErrorHandler.updateRecord(async () => {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .update({
          ...updates,
          last_edited_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }, { 
      formType: 'Artigo da Base de Conhecimento',
      successMessage: 'Artigo atualizado com sucesso!'
    });
  }

  async incrementArticleViewCount(articleId: string) {
    try {
      // First get current view count
      const { data: currentData, error: fetchError } = await supabase
        .from('knowledge_articles')
        .select('view_count')
        .eq('id', articleId)
        .single();

      if (fetchError) throw fetchError;

      const newViewCount = (currentData?.view_count || 0) + 1;

      const { data, error } = await supabase
        .from('knowledge_articles')
        .update({ 
          view_count: newViewCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', articleId)
        .select('view_count')
        .single();

      if (error) throw error;
      return { view_count: data?.view_count || 0 };
    } catch (error) {
      console.error('Error incrementing article view count:', error);
      return { view_count: 0 };
    }
  }

  // Analytics methods
  async getArticleAnalytics(): Promise<ArticleAnalytics> {
    try {
      const { data: articles, error } = await supabase
        .from('knowledge_articles')
        .select('id, title, view_count, category');

      if (error) throw error;

      const totalArticles = articles?.length || 0;
      const totalViews = articles?.reduce((sum, article) => sum + (article.view_count || 0), 0) || 0;
      const categoriesSet = new Set(articles?.map(a => a.category).filter(Boolean));
      const categories = Array.from(categoriesSet);
      
      const mostViewed = articles
        ?.sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
        .slice(0, 3)
        .map(a => ({ id: a.id, title: a.title, views: a.view_count || 0 })) || [];

      const categoryDistribution = categories.map(category => ({
        category,
        count: articles?.filter(a => a.category === category).length || 0
      }));

      return {
        total_articles: totalArticles,
        total_views: totalViews,
        categories_count: categories.length,
        most_viewed_articles: mostViewed,
        category_distribution: categoryDistribution
      };
    } catch (error) {
      console.error('Error fetching article analytics:', error);
      throw error;
    }
  }

  // Comments methods
  async getArticleComments(articleId: string) {
    try {
      // Mock comments
      return [
        {
          id: '1',
          article_id: articleId,
          comment_text: 'Este artigo precisa ser atualizado com as novas normas.',
          comment_type: 'suggestion',
          author_user_id: 'user1',
          created_at: '2024-01-22T10:30:00Z',
          is_resolved: false
        }
      ];
    } catch (error) {
      console.error('Error fetching article comments:', error);
      return [];
    }
  }

  async createArticleComment(commentData: {
    article_id: string;
    comment_text: string;
    comment_type: string;
  }) {
    try {
      // Mock create comment
      return {
        id: Math.random().toString(),
        ...commentData,
        author_user_id: 'current_user',
        created_at: new Date().toISOString(),
        is_resolved: false
      };
    } catch (error) {
      console.error('Error creating article comment:', error);
      throw error;
    }
  }

  async resolveComment(commentId: string) {
    try {
      // Mock resolve comment
      return {
        id: commentId,
        is_resolved: true,
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error resolving comment:', error);
      throw error;
    }
  }

  // Bookmarks methods
  async getBookmarkedArticles(): Promise<KnowledgeArticle[]> {
    try {
      // Get current user's bookmarked articles
      const { profile } = await formErrorHandler.checkAuth();
      
      const { data, error } = await supabase
        .from('article_bookmarks')
        .select('article_id')
        .eq('user_id', profile.id)
        .eq('company_id', profile.company_id);

      if (error) throw error;

      if (!data || data.length === 0) {
        return [];
      }

      // Get the actual articles
      const articleIds = data.map(bookmark => bookmark.article_id);
      
      const { data: articles, error: articlesError } = await supabase
        .from('knowledge_articles')
        .select('*')
        .in('id', articleIds);

      if (articlesError) throw articlesError;

      return articles || [];
    } catch (error) {
      console.error('Error fetching bookmarked articles:', error);
      return [];
    }
  }

  async isArticleBookmarked(articleId: string): Promise<boolean> {
    try {
      const { profile } = await formErrorHandler.checkAuth();
      
      const { data, error } = await supabase
        .from('article_bookmarks')
        .select('id')
        .eq('article_id', articleId)
        .eq('user_id', profile.id)
        .eq('company_id', profile.company_id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }
      
      return !!data;
    } catch (error) {
      console.error('Error checking bookmark status:', error);
      return false;
    }
  }

  async addArticleBookmark(articleId: string) {
    return formErrorHandler.createRecord(async () => {
      const { profile } = await formErrorHandler.checkAuth();
      
      const { error } = await supabase
        .from('article_bookmarks')
        .insert({
          article_id: articleId,
          user_id: profile.id,
          company_id: profile.company_id
        });

      if (error) throw error;
    }, { 
      formType: 'Favorito',
      successMessage: 'Artigo adicionado aos favoritos!'
    });
  }

  async removeArticleBookmark(articleId: string) {
    try {
      const { profile } = await formErrorHandler.checkAuth();
      
      const { error } = await supabase
        .from('article_bookmarks')
        .delete()
        .eq('article_id', articleId)
        .eq('user_id', profile.id)
        .eq('company_id', profile.company_id);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing article bookmark:', error);
      throw error;
    }
  }

  // Approval methods
  async getArticleApprovals() {
    try {
      return [
        {
          id: '1',
          article_id: '1',
          status: 'pending',
          version_number: 2,
          requester_profile: { full_name: 'João Silva' },
          created_at: '2024-01-22T10:30:00Z',
          approval_notes: 'Revisão necessária nos procedimentos de segurança',
          article: {
            title: 'Manual de Qualidade ISO 9001',
            content: 'Conteúdo do manual...',
            category: 'Qualidade',
            tags: ['ISO', 'Qualidade'],
            status: 'pending_approval'
          }
        }
      ];
    } catch (error) {
      console.error('Error fetching article approvals:', error);
      return [];
    }
  }

  async updateApprovalStatus(approvalId: string, status: 'approved' | 'rejected', comments?: string) {
    try {
      // Mock update approval status
      return {
        id: approvalId,
        status,
        comments,
        approved_at: status === 'approved' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error updating approval status:', error);
      throw error;
    }
  }

  // Version history methods
  async getArticleVersions(articleId: string) {
    try {
      return [
        {
          id: '1',
          article_id: articleId,
          version_number: 1,
          title: 'Manual de Qualidade ISO 9001 v1.0',
          content: 'Primeira versão do manual...',
          category: 'Qualidade',
          tags: ['ISO', 'Qualidade'],
          changes_summary: 'Versão inicial do documento',
          edited_by_user_id: 'user1',
          created_at: '2024-01-15T10:30:00Z'
        }
      ];
    } catch (error) {
      console.error('Error fetching article versions:', error);
      return [];
    }
  }

  // Recent activities
  async getRecentActivities() {
    try {
      return [
        {
          id: '1',
          action_type: 'article_created',
          description: 'Novo artigo "Manual de Qualidade" foi criado',
          created_at: '2024-01-22T10:30:00Z',
          details_json: {}
        },
        {
          id: '2',
          action_type: 'article_updated',
          description: 'Artigo "Procedimentos de Auditoria" foi atualizado',
          created_at: '2024-01-21T15:45:00Z',
          details_json: {}
        }
      ];
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  }

  // Pending approvals
  async getPendingApprovals() {
    try {
      return [
        {
          id: '1',
          type: 'article',
          title: 'Manual de Qualidade ISO 9001',
          status: 'pending',
          created_at: '2024-01-22T10:30:00Z'
        },
        {
          id: '2',
          type: 'document',
          title: 'Procedimento de Calibração',
          status: 'pending',
          created_at: '2024-01-21T14:15:00Z'
        }
      ];
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      return [];
    }
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();