import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { knowledgeBaseService } from "@/services/knowledgeBase";
import { toast } from "sonner";

interface ArticleBookmarkButtonProps {
  articleId: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
}

export function ArticleBookmarkButton({ 
  articleId, 
  size = "sm", 
  variant = "outline" 
}: ArticleBookmarkButtonProps) {
  const queryClient = useQueryClient();

  const { data: isBookmarked = false } = useQuery({
    queryKey: ["article-bookmark", articleId],
    queryFn: () => knowledgeBaseService.isArticleBookmarked(articleId),
  });

  const toggleBookmarkMutation = useMutation({
    mutationFn: (bookmarked: boolean) => 
      bookmarked 
        ? knowledgeBaseService.removeArticleBookmark(articleId)
        : knowledgeBaseService.addArticleBookmark(articleId),
    onSuccess: (_, bookmarked) => {
      queryClient.invalidateQueries({ queryKey: ["article-bookmark", articleId] });
      queryClient.invalidateQueries({ queryKey: ["article-bookmarks"] });
      toast.success(
        bookmarked 
          ? "Artigo removido dos favoritos" 
          : "Artigo adicionado aos favoritos"
      );
    },
    onError: (error: any) => {
      toast.error("Erro ao alterar favorito: " + error.message);
    },
  });

  const handleToggleBookmark = () => {
    toggleBookmarkMutation.mutate(isBookmarked);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleBookmark}
      disabled={toggleBookmarkMutation.isPending}
      className="flex items-center gap-1"
    >
      {isBookmarked ? (
        <BookmarkCheck className="h-4 w-4" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
      {size !== "sm" && (isBookmarked ? "Favoritado" : "Favoritar")}
    </Button>
  );
}