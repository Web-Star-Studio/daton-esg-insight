import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Edit2, 
  ClipboardList,
  Filter,
  Tag,
} from "lucide-react";
import { useBranches } from "@/services/branches";
import { useAllComplianceProfiles } from "@/hooks/useComplianceProfiles";
import { ComplianceQuestionnaireWizard } from "./ComplianceQuestionnaireWizard";
import { generateProfileTags } from "@/services/complianceProfiles";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ComplianceProfilesManagerProps {
  onFilterChange?: (tags: string[]) => void;
  selectedTags?: string[];
}

export const ComplianceProfilesManager: React.FC<ComplianceProfilesManagerProps> = ({
  onFilterChange,
  selectedTags = [],
}) => {
  const { data: branches, isLoading: branchesLoading } = useBranches();
  const { data: profiles, isLoading: profilesLoading } = useAllComplianceProfiles();
  const [selectedBranch, setSelectedBranch] = useState<{ id: string; name: string } | null>(null);

  const isLoading = branchesLoading || profilesLoading;

  const getProfileForBranch = (branchId: string) => {
    return profiles?.find(p => p.branch_id === branchId);
  };

  const completedProfiles = profiles?.filter(p => p.completed_at)?.length || 0;
  const totalBranches = branches?.length || 0;
  const completionPercentage = totalBranches > 0 ? (completedProfiles / totalBranches) * 100 : 0;

  // Aggregate all tags from all profiles
  const allTags = React.useMemo(() => {
    if (!profiles) return [];
    const tagSet = new Set<string>();
    profiles.forEach(profile => {
      const tags = generateProfileTags(profile);
      tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [profiles]);

  const handleTagClick = (tag: string) => {
    if (!onFilterChange) return;
    
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    onFilterChange(newTags);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Perfis de Compliance
              </CardTitle>
              <CardDescription>
                Configure o perfil de cada unidade para filtrar legislações relevantes
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {completedProfiles}/{totalBranches}
              </div>
              <div className="text-sm text-muted-foreground">perfis completos</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>Progresso de configuração</span>
              <span>{Math.round(completionPercentage)}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Units Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches?.map(branch => {
              const profile = getProfileForBranch(branch.id);
              const isCompleted = !!profile?.completed_at;
              const tags = profile ? generateProfileTags(profile) : [];
              
              return (
                <Card 
                  key={branch.id}
                  className={cn(
                    "transition-all hover:shadow-md",
                    isCompleted ? "border-green-500/30" : "border-orange-500/30"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{branch.name}</span>
                      </div>
                      {isCompleted ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Configurado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Pendente
                        </Badge>
                      )}
                    </div>
                    
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {tags.slice(0, 4).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {tags.length > 4 && (
                          <Badge variant="secondary" className="text-xs">
                            +{tags.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <Button
                      size="sm"
                      variant={isCompleted ? "outline" : "default"}
                      className="w-full"
                      onClick={() => setSelectedBranch({ id: branch.id, name: branch.name })}
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      {isCompleted ? "Editar Perfil" : "Configurar Perfil"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tag Filter Section */}
          {allTags.length > 0 && onFilterChange && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Filtrar por Tags</span>
                {selectedTags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFilterChange([])}
                    className="text-xs h-6"
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/80 transition-colors"
                    onClick={() => handleTagClick(tag)}
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wizard Modal */}
      {selectedBranch && (
        <ComplianceQuestionnaireWizard
          open={!!selectedBranch}
          onOpenChange={(open) => !open && setSelectedBranch(null)}
          branchId={selectedBranch.id}
          branchName={selectedBranch.name}
        />
      )}
    </>
  );
};
