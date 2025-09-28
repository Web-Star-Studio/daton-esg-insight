import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, ExternalLink, Heart, Scale, Loader2 } from 'lucide-react';
import { ESGSolution } from '@/services/marketplace';
import { useFavorites } from '@/hooks/useFavorites';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SolutionCardProps {
  solution: ESGSolution;
  onInterest: () => void;
  onAddToComparison?: (solution: ESGSolution) => void;
  featured?: boolean;
  isInComparison?: boolean;
  showComparisonButton?: boolean;
}

export function SolutionCard({ 
  solution, 
  onInterest, 
  onAddToComparison,
  featured = false,
  isInComparison = false,
  showComparisonButton = false
}: SolutionCardProps) {
  const { toggleFavorite, isFavorite, isUpdating } = useFavorites();

  const getPriceRangeColor = (range: string) => {
    switch (range) {
      case 'budget_friendly': return 'bg-primary-light text-primary-light-foreground border-primary-light';
      case 'mid_range': return 'bg-warning/10 text-warning-foreground border-warning/30';
      case 'premium': return 'bg-accent/20 text-accent-foreground border-accent/40';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getROIColor = (roi: string) => {
    switch (roi) {
      case '6-12_months': return 'bg-success/10 text-success-foreground border-success/30';
      case '1-2_years': return 'bg-primary/10 text-primary-foreground border-primary/30';
      case '2_years_plus': return 'bg-warning/10 text-warning-foreground border-warning/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <TooltipProvider>
      <Card className="group hover:shadow-lg transition-all duration-200 relative">
        <CardContent className="p-6">
          {/* Header with favorite and comparison buttons */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {featured && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    ⭐ Destaque
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {solution.category}
                </Badge>
              </div>
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {solution.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                {solution.esg_solution_providers.company_name}
              </p>
            </div>
            
            <div className="flex gap-1">
              {showComparisonButton && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToComparison?.(solution);
                      }}
                      disabled={isInComparison}
                      className={`p-2 ${
                        isInComparison 
                          ? 'text-primary bg-primary/10' 
                          : 'text-muted-foreground hover:text-primary'
                      }`}
                    >
                      <Scale className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isInComparison ? 'Na comparação' : 'Adicionar à comparação'}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite({
                        id: solution.id,
                        title: solution.title,
                        path: `/marketplace/${solution.id}`,
                        icon: 'Heart'
                      });
                    }}
                    disabled={isUpdating}
                    className="p-2"
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Heart className={`h-4 w-4 ${
                        isFavorite(solution.id) 
                          ? 'fill-red-500 text-red-500' 
                          : 'text-muted-foreground'
                      }`} />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isFavorite(solution.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        
        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {solution.description}
        </p>
        
        {/* Matching Problems */}
        {solution.matching_problems && solution.matching_problems.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-primary mb-2">Problemas Identificados:</p>
            <div className="flex flex-wrap gap-1">
              {solution.matching_problems.slice(0, 2).map((problem, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-primary/5 text-primary">
                  {problem}
                </Badge>
              ))}
              {solution.matching_problems.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{solution.matching_problems.length - 2}
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* Metrics */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className={`text-xs ${getPriceRangeColor(solution.price_range)}`}>
            {solution.price_range === 'budget_friendly' ? 'Econômico' :
             solution.price_range === 'mid_range' ? 'Intermediário' : 'Premium'}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {solution.implementation_time?.replace('_', '-').replace('months', 'meses').replace('plus', '+') || 'N/A'}
          </Badge>
          <Badge variant="outline" className={`text-xs ${getROIColor(solution.roi_estimate)}`}>
            ROI: {solution.roi_estimate?.replace('_', '-').replace('months', 'meses').replace('years', 'anos').replace('plus', '+') || 'N/A'}
          </Badge>
        </div>
        
        {/* Rating and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">
              {solution.esg_solution_providers.rating || 0}
            </span>
            <span className="text-xs text-muted-foreground">
              ({solution.esg_solution_providers.total_reviews || 0})
            </span>
          </div>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={onInterest}
            >
              Tenho Interesse
            </Button>
            {solution.esg_solution_providers.website_url && (
              <Button size="sm" variant="ghost" asChild>
                <a 
                  href={solution.esg_solution_providers.website_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}