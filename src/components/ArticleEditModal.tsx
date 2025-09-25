import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Save, X, Tag, Eye, History, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { knowledgeBaseService } from "@/services/knowledgeBase";
import { ArticleVersionHistory } from "./ArticleVersionHistory";
import { ArticleComments } from "./ArticleComments";

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

interface ArticleEditModalProps {
  article: KnowledgeArticle | null;
  isOpen: boolean;
  onClose: () => void;
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

export function ArticleEditModal({ article, isOpen, onClose }: ArticleEditModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'edit' | 'history' | 'comments'>('edit');
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    tags: [] as string[],
    tagInput: "",
    changes_summary: ""
  });

  const queryClient = useQueryClient();

  const updateArticleMutation = useMutation({
    mutationFn: (data: any) => knowledgeBaseService.updateKnowledgeArticle(article!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-articles"] });
      toast({
        title: "Sucesso",
        description: "Artigo atualizado com sucesso!",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar artigo: " + error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title,
        content: article.content,
        category: article.category,
        tags: article.tags || [],
        tagInput: "",
        changes_summary: ""
      });
    }
  }, [article]);

  const handleAddTag = () => {
    if (formData.tagInput.trim() && !formData.tags.includes(formData.tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.tagInput.trim()],
        tagInput: ""
      });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleSave = () => {
    if (!formData.title || !formData.content || !formData.category) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (!formData.changes_summary) {
      toast({
        title: "Erro", 
        description: "Descreva as alterações realizadas",
        variant: "destructive",
      });
      return;
    }

    updateArticleMutation.mutate({
      title: formData.title,
      content: formData.content,
      category: formData.category,
      tags: formData.tags,
      changes_summary: formData.changes_summary
    });
  };

  const handleClose = () => {
    setActiveTab('edit');
    onClose();
  };

  if (!article) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            Editar Artigo: {article.title}
            <Badge variant="outline">v{article.version}</Badge>
          </DialogTitle>
          
          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            <Button
              variant={activeTab === 'edit' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('edit')}
            >
              <Save className="h-4 w-4 mr-1" />
              Editar
            </Button>
            <Button
              variant={activeTab === 'history' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('history')}
            >
              <History className="h-4 w-4 mr-1" />
              Histórico
            </Button>
            <Button
              variant={activeTab === 'comments' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('comments')}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Comentários
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {activeTab === 'edit' && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-title">Título *</Label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Título do artigo"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">Categoria *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({...formData, category: value})}
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
                <Label htmlFor="edit-content">Conteúdo *</Label>
                <Textarea
                  id="edit-content"
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="Conteúdo do artigo (suporte a Markdown)"
                  rows={15}
                  className="font-mono"
                />
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={formData.tagInput}
                    onChange={(e) => setFormData({...formData, tagInput: e.target.value})}
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
                  {formData.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                      {tag}
                      <button className="ml-1 hover:text-destructive">×</button>
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <Label htmlFor="changes-summary">Resumo das Alterações *</Label>
                <Textarea
                  id="changes-summary"
                  value={formData.changes_summary}
                  onChange={(e) => setFormData({...formData, changes_summary: e.target.value})}
                  placeholder="Descreva brevemente as alterações realizadas nesta versão..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <ArticleVersionHistory articleId={article.id} />
          )}

          {activeTab === 'comments' && (
            <ArticleComments articleId={article.id} />
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center px-6 py-4 border-t bg-muted/30">
          <div className="text-sm text-muted-foreground">
            {activeTab === 'edit' && "Use Markdown para formatação avançada"}
          </div>
          
          <div className="flex gap-2">
            {activeTab === 'edit' && (
              <Button 
                onClick={handleSave} 
                disabled={updateArticleMutation.isPending}
              >
                <Save className="h-4 w-4 mr-1" />
                {updateArticleMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            )}
            <Button variant="ghost" onClick={handleClose}>
              <X className="h-4 w-4 mr-1" />
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}