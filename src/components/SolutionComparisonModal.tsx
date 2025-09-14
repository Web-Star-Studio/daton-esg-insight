import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Star, ExternalLink, Clock, DollarSign, TrendingUp, X } from 'lucide-react';
import { ESGSolution } from '@/services/marketplace';
import { SOLUTION_CATEGORIES, PRICE_RANGES, IMPLEMENTATION_TIMES, ROI_ESTIMATES } from '@/services/marketplace';

interface SolutionComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  solutions: ESGSolution[];
  onRemoveSolution: (solutionId: string) => void;
  onContactProvider: (solution: ESGSolution) => void;
}

export const SolutionComparisonModal: React.FC<SolutionComparisonModalProps> = ({
  isOpen,
  onClose,
  solutions,
  onRemoveSolution,
  onContactProvider,
}) => {
  const getPriceRangeColor = (range: string) => {
    switch (range) {
      case 'budget_friendly': return 'secondary';
      case 'mid_range': return 'warning';
      case 'premium': return 'default';
      default: return 'secondary';
    }
  };

  const getROIColor = (roi: string) => {
    switch (roi) {
      case '6-12_months': return 'default';
      case '1-2_years': return 'secondary';
      case '2_years_plus': return 'warning';
      default: return 'secondary';
    }
  };

  const formatTimeRange = (time: string) => {
    switch (time) {
      case '1-3_months': return '1-3 meses';
      case '3-6_months': return '3-6 meses';
      case '6-12_months': return '6-12 meses';
      case '1-2_years': return '1-2 anos';
      case '2_years_plus': return '2+ anos';
      default: return time;
    }
  };

  const formatPriceRange = (price: string) => {
    switch (price) {
      case 'budget_friendly': return 'Econômico';
      case 'mid_range': return 'Intermediário';
      case 'premium': return 'Premium';
      default: return price;
    }
  };

  const formatROIRange = (roi: string) => {
    switch (roi) {
      case '6-12_months': return '6-12 meses';
      case '1-2_years': return '1-2 anos';
      case '2_years_plus': return '2+ anos';
      default: return roi;
    }
  };

  if (solutions.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Comparação de Soluções ESG
            <span className="text-sm text-muted-foreground font-normal">
              {solutions.length} soluções selecionadas
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {solutions.map((solution) => (
            <Card key={solution.id} className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => onRemoveSolution(solution.id)}
              >
                <X className="h-3 w-3" />
              </Button>

              <CardContent className="p-6 space-y-4">
                {/* Header */}
                <div>
                  <Badge 
                    variant="outline" 
                    className={`mb-2 ${SOLUTION_CATEGORIES[solution.category as keyof typeof SOLUTION_CATEGORIES]?.color || 'text-foreground'}`}
                  >
                    {SOLUTION_CATEGORIES[solution.category as keyof typeof SOLUTION_CATEGORIES]?.label || solution.category}
                  </Badge>
                  <h3 className="font-semibold text-lg leading-tight">{solution.title}</h3>
                  <p className="text-sm text-muted-foreground">{solution.esg_solution_providers?.company_name}</p>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {solution.description}
                </p>

                {/* Key Metrics */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Investimento:</span>
                    <Badge variant={getPriceRangeColor(solution.price_range || '') as any} className="ml-auto">
                      {formatPriceRange(solution.price_range || '')}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Implementação:</span>
                    <Badge variant="outline" className="ml-auto">
                      {formatTimeRange(solution.implementation_time || '')}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">ROI Estimado:</span>
                    <Badge variant={getROIColor(solution.roi_estimate || '') as any} className="ml-auto">
                      {formatROIRange(solution.roi_estimate || '')}
                    </Badge>
                  </div>

                  {solution.esg_solution_providers && (
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Avaliação:</span>
                      <div className="flex items-center ml-auto">
                        <span className="text-sm font-medium mr-1">
                          {solution.esg_solution_providers.rating?.toFixed(1) || '0.0'}
                        </span>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-muted-foreground ml-1">
                          ({solution.esg_solution_providers.total_reviews || 0})
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Target Problems */}
                {solution.target_problems && solution.target_problems.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Problemas Abordados:</h4>
                    <div className="flex flex-wrap gap-1">
                      {solution.target_problems.slice(0, 3).map((problem, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {problem}
                        </Badge>
                      ))}
                      {solution.target_problems.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{solution.target_problems.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => onContactProvider(solution)}
                    className="flex-1"
                    size="sm"
                  >
                    Tenho Interesse
                  </Button>
                  {solution.esg_solution_providers?.website_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={solution.esg_solution_providers.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {solutions.length < 3 && (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">
              Adicione mais soluções para uma comparação mais completa (máximo 3)
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};