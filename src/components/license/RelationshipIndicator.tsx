import { Badge } from "@/components/ui/badge";
import { Link2, AlertTriangle, FileText } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RelationshipIndicatorProps {
  alertsCount?: number;
  observationsCount?: number;
  conditionsCount?: number;
  onClickAlerts?: () => void;
  onClickObservations?: () => void;
  onClickConditions?: () => void;
  className?: string;
}

export function RelationshipIndicator({
  alertsCount = 0,
  observationsCount = 0,
  conditionsCount = 0,
  onClickAlerts,
  onClickObservations,
  onClickConditions,
  className = "",
}: RelationshipIndicatorProps) {
  const hasRelationships = alertsCount > 0 || observationsCount > 0 || conditionsCount > 0;

  if (!hasRelationships) return null;

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-2 flex-wrap ${className}`}>
        <Link2 className="h-3 w-3 text-muted-foreground" />
        
        {alertsCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-accent text-xs gap-1"
                onClick={onClickAlerts}
              >
                <AlertTriangle className="h-3 w-3 text-destructive" />
                {alertsCount} {alertsCount === 1 ? "Alerta" : "Alertas"}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clique para ver alertas relacionados</p>
            </TooltipContent>
          </Tooltip>
        )}

        {observationsCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-accent text-xs gap-1"
                onClick={onClickObservations}
              >
                <FileText className="h-3 w-3 text-primary" />
                {observationsCount} {observationsCount === 1 ? "Observação" : "Observações"}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clique para ver observações relacionadas</p>
            </TooltipContent>
          </Tooltip>
        )}

        {conditionsCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-accent text-xs gap-1"
                onClick={onClickConditions}
              >
                <FileText className="h-3 w-3 text-blue-500" />
                {conditionsCount} {conditionsCount === 1 ? "Condicionante" : "Condicionantes"}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clique para ver condicionantes relacionadas</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
