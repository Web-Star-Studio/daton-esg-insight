import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Calendar, 
  User,
  FileText,
  Bookmark,
  Activity,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { knowledgeBaseService, type KnowledgeArticle } from "@/services/knowledgeBase";
import { ArticleViewModal } from "@/components/ArticleViewModal";
import { ArticleEditModal } from "@/components/ArticleEditModal";
import { ArticleBookmarkButton } from "@/components/ArticleBookmarkButton";
import { ArticleAnalyticsWidget } from "@/components/ArticleAnalyticsWidget";
import { BookmarkedArticlesModal } from "@/components/BookmarkedArticlesModal";

const KNOWLEDGE_CATEGORIES = [
  "Qualidade",
  "Meio Ambiente", 
  "Saúde e Segurança",
  "Processos",
  "Normas e Regulamentos",
  "Treinamentos",
  "FAQ",
  "Manuais",
  "Outros"
];

export default function BaseConhecimento() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [editingArticle, setEditingArticle] = useState<KnowledgeArticle | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreatingArticle, setIsCreatingArticle] = useState(false);
  const [isBookmarksModalOpen, setIsBookmarksModalOpen] = useState(false);

  // Fetch articles
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["knowledge-articles"],
    queryFn: () => knowledgeBaseService.getKnowledgeArticles(),
  });

  // Fetch recent activities
  const { data: recentActivities = [] } = useQuery({
    queryKey: ["recent-activities"],
    queryFn: () => knowledgeBaseService.getRecentActivities(),
  });

  // Create article mutation
  const createArticleMutation = useMutation({
    mutationFn: (articleData: { title: string; content: string; category: string; tags: string[] }) =>
      knowledgeBaseService.createKnowledgeArticle(articleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-articles"] });
      queryClient.invalidateQueries({ queryKey: ["article-analytics"] });
      setIsCreatingArticle(false);
    },
  });

  // Filter articles based on search and category
  const filteredArticles = articles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const colors = {
      "Qualidade": "bg-blue-100 text-blue-800",
      "Meio Ambiente": "bg-green-100 text-green-800", 
      "Saúde e Segurança": "bg-red-100 text-red-800",
      "Processos": "bg-purple-100 text-purple-800",
      "Normas e Regulamentos": "bg-orange-100 text-orange-800",
      "Treinamentos": "bg-yellow-100 text-yellow-800",
      "FAQ": "bg-pink-100 text-pink-800",
      "Manuais": "bg-indigo-100 text-indigo-800",
      "Outros": "bg-gray-100 text-gray-800"
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const handleViewArticle = (article: KnowledgeArticle) => {
    setSelectedArticle(article);
    setIsViewModalOpen(true);
  };

  const handleEditArticle = (article: KnowledgeArticle) => {
    setEditingArticle(article);
    setIsEditModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingArticle(null);
    setIsCreatingArticle(true);
    setIsEditModalOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Base de Conhecimento</h1>
          <p className="text-muted-foreground">
            Gerencie e compartilhe o conhecimento organizacional
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsBookmarksModalOpen(true)}
          >
            <Bookmark className="h-4 w-4 mr-2" />
            Favoritos
          </Button>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Artigo
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="articles" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="articles" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Artigos
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Atividades
          </TabsTrigger>
        </TabsList>

        {/* Articles Tab */}
        <TabsContent value="articles" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar artigos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {KNOWLEDGE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Articles Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-5/6"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredArticles.map((article) => (
                <Card key={article.id} className="group hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle 
                        className="text-base font-medium leading-tight group-hover:text-primary transition-colors line-clamp-2"
                        onClick={() => handleViewArticle(article)}
                      >
                        {article.title}
                      </CardTitle>
                      <ArticleBookmarkButton 
                        articleId={article.id}
                        variant="ghost"
                        size="sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getCategoryColor(article.category || "Outros")}>
                        {article.category || "Sem categoria"}
                      </Badge>
                      {article.status && (
                        <Badge variant="outline" className="text-xs">
                          {article.status}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {article.content.substring(0, 150)}...
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>Autor</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(article.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        <span>{article.view_count || 0} visualizações</span>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewArticle(article)}
                          className="h-8 px-2"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditArticle(article)}
                          className="h-8 px-2"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredArticles.length === 0 && !isLoading && (
            <Card className="py-12">
              <CardContent className="text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum artigo encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedCategory !== "all" 
                    ? "Tente ajustar os filtros ou criar um novo artigo."
                    : "Comece criando seu primeiro artigo na base de conhecimento."
                  }
                </p>
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Artigo
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <ArticleAnalyticsWidget />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Atividades Recentes
              </CardTitle>
              <CardDescription>
                Acompanhe as últimas movimentações na base de conhecimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivities.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma atividade recente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={activity.id || index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Activity className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(activity.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ArticleViewModal
        article={selectedArticle}
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedArticle(null);
        }}
        onEdit={handleEditArticle}
      />

      <ArticleEditModal
        article={isCreatingArticle ? null : editingArticle}
        isOpen={isEditModalOpen}
        isCreate={isCreatingArticle}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingArticle(null);
          setIsCreatingArticle(false);
        }}
      />

      <BookmarkedArticlesModal
        isOpen={isBookmarksModalOpen}
        onClose={() => setIsBookmarksModalOpen(false)}
        onViewArticle={handleViewArticle}
        onEditArticle={handleEditArticle}
      />
    </div>
  );
}