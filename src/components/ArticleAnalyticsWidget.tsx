import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, BookOpen, TrendingUp, Users } from "lucide-react";
import { knowledgeBaseService } from "@/services/knowledgeBase";

interface ArticleStats {
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

export function ArticleAnalyticsWidget() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["article-analytics"],
    queryFn: () => knowledgeBaseService.getArticleAnalytics(),
    retry: 1,
    staleTime: 30000
  });

  if (isLoading || !analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Analytics da Base de Conhecimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Analytics da Base de Conhecimento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <div className="text-2xl font-bold">{analytics.total_articles}</div>
            <div className="text-sm text-muted-foreground">Artigos</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Eye className="h-8 w-8 text-primary" />
            </div>
            <div className="text-2xl font-bold">{analytics.total_views}</div>
            <div className="text-sm text-muted-foreground">Visualizações</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div className="text-2xl font-bold">{analytics.categories_count}</div>
            <div className="text-sm text-muted-foreground">Categorias</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-3">Artigos Mais Visualizados</h4>
            <div className="space-y-2">
              {analytics.most_viewed_articles?.slice(0, 3).map((article, index) => (
                <div key={article.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <div>
                      <div className="text-sm font-medium line-clamp-1">{article.title}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Eye className="h-3 w-3" />
                    {article.views}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3">Distribuição por Categoria</h4>
            <div className="space-y-2">
              {analytics.category_distribution?.slice(0, 5).map((category) => (
                <div key={category.category} className="flex items-center justify-between">
                  <span className="text-sm">{category.category}</span>
                  <Badge variant="outline">{category.count}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}