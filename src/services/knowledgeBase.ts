import { supabase } from "@/integrations/supabase/client";

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  view_count: number;
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
      return [
        {
          id: '1',
          title: 'Manual de Qualidade ISO 9001',
          content: 'Conteúdo do manual de qualidade...',
          category: 'Qualidade',
          tags: ['ISO', 'Qualidade', 'Manual'],
          status: 'published',
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T10:30:00Z',
          view_count: 342
        },
        {
          id: '2',
          title: 'Procedimentos de Auditoria',
          content: 'Procedimentos para realizar auditorias...',
          category: 'Auditoria',
          tags: ['Auditoria', 'Procedimentos'],
          status: 'published',
          created_at: '2024-01-20T14:15:00Z',
          updated_at: '2024-01-20T14:15:00Z',
          view_count: 276
        }
      ];
    }
  }

  async createKnowledgeArticle(articleData: {
    title: string;
    content: string;
    category: string;
    tags: string[];
  }): Promise<KnowledgeArticle> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('knowledge_articles')
        .insert([{
          ...articleData,
          status: 'draft',
          created_by_user_id: user.id,
          view_count: 0
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating knowledge article:', error);
      throw error;
    }
  }

  async updateKnowledgeArticle(id: string, updates: Partial<KnowledgeArticle>): Promise<KnowledgeArticle> {
    try {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating knowledge article:', error);
      throw error;
    }
  }

  async incrementArticleViewCount(articleId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_article_views', {
        article_id: articleId
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error incrementing article view count:', error);
    }
  }

  // Analytics methods
  async getArticleAnalytics(): Promise<ArticleAnalytics> {
    try {
      // Mock data for now
      return {
        total_articles: 24,
        total_views: 1847,
        categories_count: 8,
        most_viewed_articles: [
          { id: '1', title: 'Manual de Qualidade ISO 9001', views: 342 },
          { id: '2', title: 'Procedimentos de Auditoria', views: 276 },
          { id: '3', title: 'Gestão de Não Conformidades', views: 198 }
        ],
        category_distribution: [
          { category: 'Qualidade', count: 8 },
          { category: 'Auditoria', count: 6 },
          { category: 'Processos', count: 4 },
          { category: 'Treinamento', count: 6 }
        ]
      };
    } catch (error) {
      console.error('Error fetching article analytics:', error);
      throw error;
    }
  }

  // Comments methods
  async getArticleComments(articleId: string) {
    try {
      const { data, error } = await supabase
        .from('article_comments')
        .select('*')
        .eq('article_id', articleId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('article_comments')
        .insert([{
          ...commentData,
          created_by_user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating article comment:', error);
      throw error;
    }
  }

  async resolveComment(commentId: string) {
    try {
      const { data, error } = await supabase
        .from('article_comments')
        .update({ status: 'resolved' })
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error resolving comment:', error);
      throw error;
    }
  }

  // Bookmarks methods
  async getBookmarkedArticles() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('article_bookmarks')
        .select(`
          *,
          knowledge_articles(*)
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data?.map(bookmark => bookmark.knowledge_articles) || [];
    } catch (error) {
      console.error('Error fetching bookmarked articles:', error);
      return [];
    }
  }

  async isArticleBookmarked(articleId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('article_bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('article_id', articleId)
        .single();
      
      return !error && !!data;
    } catch (error) {
      return false;
    }
  }

  async addArticleBookmark(articleId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from('article_bookmarks')
        .insert([{
          user_id: user.id,
          article_id: articleId
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error adding article bookmark:', error);
      throw error;
    }
  }

  async removeArticleBookmark(articleId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from('article_bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('article_id', articleId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing article bookmark:', error);
      throw error;
    }
  }

  // Approval methods
  async getArticleApprovals() {
    try {
      const { data, error } = await supabase
        .from('article_approvals')
        .select(`
          *,
          knowledge_articles(*)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching article approvals:', error);
      return [];
    }
  }

  async updateApprovalStatus(approvalId: string, status: 'approved' | 'rejected', comments?: string) {
    try {
      const { data, error } = await supabase
        .from('article_approvals')
        .update({ 
          status,
          comments,
          approved_at: status === 'approved' ? new Date().toISOString() : null
        })
        .eq('id', approvalId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating approval status:', error);
      throw error;
    }
  }

  // Version history methods
  async getArticleVersions(articleId: string) {
    try {
      const { data, error } = await supabase
        .from('article_versions')
        .select('*')
        .eq('article_id', articleId)
        .order('version_number', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching article versions:', error);
      return [];
    }
  }

  // Recent activities
  async getRecentActivities() {
    try {
      // Mock data for now
      return [
        {
          id: '1',
          type: 'article_created',
          message: 'Novo artigo "Manual de Qualidade" foi criado',
          created_at: '2024-01-22T10:30:00Z'
        },
        {
          id: '2',
          type: 'article_updated',
          message: 'Artigo "Procedimentos de Auditoria" foi atualizado',
          created_at: '2024-01-21T15:45:00Z'
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