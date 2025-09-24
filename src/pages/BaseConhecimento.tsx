import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Book, FileText, Eye, Edit, Trash2, Tag, User, Calendar } from "lucide-react";
import { qualityManagementService } from "@/services/qualityManagement";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArticleViewModal } from "@/components/ArticleViewModal";
import { ArticleEditModal } from "@/components/ArticleEditModal";

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author_user_id: string;
  status: string;
  version: number;
  is_published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

const KNOWLEDGE_CATEGORIES = [
  "Processos",
  "Qualidade",
  "Segurança",
  "Meio Ambiente",
  "Procedimentos",
  "Políticas",
  "Treinamentos",
  "FAQ",
  "Manuais",
  "Outros"
];

export default function BaseConhecimento() {
  const [isCreateArticleOpen, setIsCreateArticleOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [newArticleData, setNewArticleData] = useState({
    title: "",
    content: "",
    category: "",
    tags: [] as string[],
    tagInput: ""
  });

  const queryClient = useQueryClient();

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["knowledge-articles", searchTerm, selectedCategory],
    queryFn: () => qualityManagementService.getKnowledgeArticles({
      search: searchTerm || undefined,
      category: selectedCategory !== "all" ? selectedCategory : undefined,
      published_only: true
    }),
  });

  const createArticleMutation = useMutation({
    mutationFn: qualityManagementService.createKnowledgeArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-articles"] });
      toast.success("Artigo criado com sucesso!");
      setIsCreateArticleOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error("Erro ao criar artigo: " + error.message);
    },
  });

  const resetForm = () => {
    setNewArticleData({
      title: "",
      content: "",
      category: "",
      tags: [],
      tagInput: ""
    });
  };

  const handleAddTag = () => {
    if (newArticleData.tagInput.trim() && !newArticleData.tags.includes(newArticleData.tagInput.trim())) {
      setNewArticleData({
        ...newArticleData,
        tags: [...newArticleData.tags, newArticleData.tagInput.trim()],
        tagInput: ""
      });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewArticleData({
      ...newArticleData,
      tags: newArticleData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleCreateArticle = () => {
    if (!newArticleData.title || !newArticleData.content || !newArticleData.category) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    createArticleMutation.mutate({
      title: newArticleData.title,
      content: newArticleData.content,
      category: newArticleData.category,
      tags: newArticleData.tags
    });
  };

  const handleViewArticle = (article: KnowledgeArticle) => {
    setSelectedArticle(article);
    setIsViewModalOpen(true);
  };

  const handleEditArticle = (article: KnowledgeArticle) => {
    setSelectedArticle(article);
    setIsEditModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedArticle(null);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedArticle(null);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Processos": "bg-blue-100 text-blue-800",
      "Qualidade": "bg-green-100 text-green-800",
      "Segurança": "bg-red-100 text-red-800",
      "Meio Ambiente": "bg-emerald-100 text-emerald-800",
      "Procedimentos": "bg-purple-100 text-purple-800",
      "Políticas": "bg-orange-100 text-orange-800",
      "Treinamentos": "bg-yellow-100 text-yellow-800",
      "FAQ": "bg-pink-100 text-pink-800",
      "Manuais": "bg-indigo-100 text-indigo-800",
      "Outros": "bg-gray-100 text-gray-800"
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const filteredArticles = articles.filter((article: KnowledgeArticle) => {
    const matchesSearch = !searchTerm || 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Base de Conhecimento</h1>
          <p className="text-muted-foreground mt-2">
            Centralize e gerencie o conhecimento organizacional
          </p>
        </div>
        
        <Dialog open={isCreateArticleOpen} onOpenChange={setIsCreateArticleOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Artigo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Artigo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={newArticleData.title}
                    onChange={(e) => setNewArticleData({...newArticleData, title: e.target.value})}
                    placeholder="Título do artigo"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={newArticleData.category}
                    onValueChange={(value) => setNewArticleData({...newArticleData, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {KNOWLEDGE_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="content">Conteúdo *</Label>
                <Textarea
                  id="content"
                  value={newArticleData.content}
                  onChange={(e) => setNewArticleData({...newArticleData, content: e.target.value})}
                  placeholder="Conteúdo do artigo (suporte a Markdown)"
                  rows={12}
                  className="font-mono"
                />
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newArticleData.tagInput}
                    onChange={(e) => setNewArticleData({...newArticleData, tagInput: e.target.value})}
                    placeholder="Digite uma tag"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    <Tag className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newArticleData.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                      {tag}
                      <button className="ml-1 hover:text-destructive">×</button>
                    </Badge>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleCreateArticle} 
                className="w-full"
                disabled={createArticleMutation.isPending}
              >
                {createArticleMutation.isPending ? "Criando..." : "Criar Artigo"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Pesquisar artigos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {KNOWLEDGE_CATEGORIES.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Articles Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredArticles.map((article: KnowledgeArticle) => (
          <Card key={article.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Book className="h-5 w-5 text-primary" />
                  {article.title}
                </CardTitle>
                <Badge className={getCategoryColor(article.category)}>
                  {article.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4 line-clamp-3">
                {article.content.substring(0, 150)}...
              </CardDescription>
              
              {/* Tags */}
              {article.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {article.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {article.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{article.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              <Separator className="mb-4" />

              {/* Metadata */}
              <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {article.view_count} visualizações
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(article.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleViewArticle(article)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleEditArticle(article)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || selectedCategory !== "all" 
                ? "Nenhum artigo encontrado" 
                : "Nenhum artigo disponível"
              }
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedCategory !== "all"
                ? "Tente alterar os filtros de busca"
                : "Crie o primeiro artigo da base de conhecimento"
              }
            </p>
            {!searchTerm && selectedCategory === "all" && (
              <Button onClick={() => setIsCreateArticleOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Artigo
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Article View Modal */}
      <ArticleViewModal
        article={selectedArticle}
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        onEdit={handleEditArticle}
      />

      {/* Article Edit Modal */}
      <ArticleEditModal
        article={selectedArticle}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
      />
    </>
  );
}