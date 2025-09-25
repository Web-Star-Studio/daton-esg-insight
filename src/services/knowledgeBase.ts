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
      // Mock data for now since the database schema might not match
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
    try {
      // Mock create for now
      const newArticle: KnowledgeArticle = {
        id: Math.random().toString(),
        ...articleData,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        view_count: 0
      };
      return newArticle;
    } catch (error) {
      console.error('Error creating knowledge article:', error);
      throw error;
    }
  }

  async updateKnowledgeArticle(id: string, updates: Partial<KnowledgeArticle>): Promise<KnowledgeArticle> {
    try {
      // Mock update for now
      const mockArticle: KnowledgeArticle = {
        id,
        title: updates.title || 'Article Title',
        content: updates.content || 'Article content...',
        category: updates.category || 'General',
        tags: updates.tags || [],
        status: updates.status || 'draft',
        created_at: updates.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        view_count: updates.view_count || 0
      };
      return mockArticle;
    } catch (error) {
      console.error('Error updating knowledge article:', error);
      throw error;
    }
  }

  async incrementArticleViewCount(articleId: string) {
    try {
      // Mock increment - return updated view count
      const newViewCount = Math.floor(Math.random() * 100) + 50;
      console.log(`Incrementing view count for article ${articleId} to ${newViewCount}`);
      return { view_count: newViewCount };
    } catch (error) {
      console.error('Error incrementing article view count:', error);
      return { view_count: 0 };
    }
  }

  // Analytics methods
  async getArticleAnalytics(): Promise<ArticleAnalytics> {
    try {
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
  async getBookmarkedArticles() {
    try {
      // Mock bookmarked articles
      return [
        {
          id: '1',
          title: 'Manual de Qualidade ISO 9001',
          content: 'Conteúdo do manual de qualidade...',
          category: 'Qualidade',
          tags: ['ISO', 'Qualidade', 'Manual'],
          view_count: 342,
          created_at: '2024-01-15T10:30:00Z',
          author_user_id: 'user1'
        }
      ];
    } catch (error) {
      console.error('Error fetching bookmarked articles:', error);
      return [];
    }
  }

  async isArticleBookmarked(articleId: string): Promise<boolean> {
    try {
      // Mock check bookmark status
      return Math.random() > 0.5; // Random for demo
    } catch (error) {
      return false;
    }
  }

  async addArticleBookmark(articleId: string) {
    try {
      // Mock add bookmark
      console.log(`Adding bookmark for article ${articleId}`);
    } catch (error) {
      console.error('Error adding article bookmark:', error);
      throw error;
    }
  }

  async removeArticleBookmark(articleId: string) {
    try {
      // Mock remove bookmark
      console.log(`Removing bookmark for article ${articleId}`);
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