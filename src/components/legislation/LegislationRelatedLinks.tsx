import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  XCircle, 
  Link2, 
  ExternalLink,
  AlertTriangle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface LegislationRelatedLinksProps {
  legislation: {
    id: string;
    revokes_legislation_id?: string;
    revoked_by_legislation_id?: string;
    related_legislation_ids?: string[];
  };
}

interface RelatedLegislation {
  id: string;
  title: string;
  norm_type: string;
  norm_number?: string;
  overall_applicability: string;
}

export const LegislationRelatedLinks: React.FC<LegislationRelatedLinksProps> = ({
  legislation,
}) => {
  const navigate = useNavigate();
  
  const hasAnyRelations = 
    legislation.revokes_legislation_id || 
    legislation.revoked_by_legislation_id || 
    (legislation.related_legislation_ids && legislation.related_legislation_ids.length > 0);

  // Fetch revokes legislation
  const { data: revokesLegislation, isLoading: isLoadingRevokes } = useQuery({
    queryKey: ['legislation-link', legislation.revokes_legislation_id],
    queryFn: async () => {
      if (!legislation.revokes_legislation_id) return null;
      const { data, error } = await supabase
        .from('legislations')
        .select('id, title, norm_type, norm_number, overall_applicability')
        .eq('id', legislation.revokes_legislation_id)
        .single();
      if (error) return null;
      return data as RelatedLegislation;
    },
    enabled: !!legislation.revokes_legislation_id,
  });

  // Fetch revoked by legislation
  const { data: revokedByLegislation, isLoading: isLoadingRevokedBy } = useQuery({
    queryKey: ['legislation-link', legislation.revoked_by_legislation_id],
    queryFn: async () => {
      if (!legislation.revoked_by_legislation_id) return null;
      const { data, error } = await supabase
        .from('legislations')
        .select('id, title, norm_type, norm_number, overall_applicability')
        .eq('id', legislation.revoked_by_legislation_id)
        .single();
      if (error) return null;
      return data as RelatedLegislation;
    },
    enabled: !!legislation.revoked_by_legislation_id,
  });

  // Fetch related legislations
  const { data: relatedLegislations, isLoading: isLoadingRelated } = useQuery({
    queryKey: ['legislation-links', legislation.related_legislation_ids],
    queryFn: async () => {
      if (!legislation.related_legislation_ids || legislation.related_legislation_ids.length === 0) {
        return [];
      }
      const { data, error } = await supabase
        .from('legislations')
        .select('id, title, norm_type, norm_number, overall_applicability')
        .in('id', legislation.related_legislation_ids);
      if (error) return [];
      return data as RelatedLegislation[];
    },
    enabled: !!legislation.related_legislation_ids && legislation.related_legislation_ids.length > 0,
  });

  if (!hasAnyRelations) {
    return null;
  }

  const isLoading = isLoadingRevokes || isLoadingRevokedBy || isLoadingRelated;

  const LegislationLinkItem = ({ 
    leg, 
    type 
  }: { 
    leg: RelatedLegislation; 
    type: 'revokes' | 'revoked_by' | 'related';
  }) => (
    <div 
      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={() => navigate(`/licenciamento/legislacoes/${leg.id}`)}
    >
      <div className="flex items-center gap-3">
        {type === 'revokes' && (
          <div className="p-2 rounded-lg bg-red-100 text-red-600">
            <XCircle className="h-4 w-4" />
          </div>
        )}
        {type === 'revoked_by' && (
          <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
            <AlertTriangle className="h-4 w-4" />
          </div>
        )}
        {type === 'related' && (
          <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
            <Link2 className="h-4 w-4" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {leg.norm_type} {leg.norm_number && `nº ${leg.norm_number}`}
            </Badge>
            {leg.overall_applicability === 'revoked' && (
              <Badge variant="secondary" className="text-xs">Revogada</Badge>
            )}
          </div>
          <p className="text-sm font-medium mt-1 line-clamp-1">{leg.title}</p>
        </div>
      </div>
      <Button variant="ghost" size="icon">
        <ExternalLink className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Legislações Relacionadas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <>
            {/* This legislation revokes another */}
            {revokesLegislation && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Esta legislação revoga:
                </p>
                <LegislationLinkItem leg={revokesLegislation} type="revokes" />
              </div>
            )}

            {/* This legislation was revoked by another */}
            {revokedByLegislation && (
              <div>
                <p className="text-sm font-medium text-amber-600 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Esta legislação foi revogada por:
                </p>
                <LegislationLinkItem leg={revokedByLegislation} type="revoked_by" />
              </div>
            )}

            {/* Related legislations */}
            {relatedLegislations && relatedLegislations.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Legislações relacionadas:
                </p>
                <div className="space-y-2">
                  {relatedLegislations.map((leg) => (
                    <LegislationLinkItem key={leg.id} leg={leg} type="related" />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
