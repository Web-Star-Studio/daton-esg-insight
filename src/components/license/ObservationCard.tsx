import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FileText, Archive, MessageSquare, AlertCircle, Edit } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LicenseObservation } from '@/types/licenseObservations';

interface ObservationCardProps {
  observation: LicenseObservation;
  onEdit: (id: string) => void;
  onArchive: (id: string) => void;
  onComment: (id: string) => void;
  showRelated?: boolean;
}

const typeColors: Record<string, string> = {
  'nota': 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  'inspeção': 'bg-green-500/10 text-green-700 dark:text-green-400',
  'comunicação': 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  'incidente': 'bg-red-500/10 text-red-700 dark:text-red-400',
  'melhoria': 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400'
};

const priorityColors: Record<string, string> = {
  'baixa': 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
  'média': 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  'alta': 'bg-orange-500/10 text-orange-700 dark:text-orange-400'
};

export function ObservationCard({ 
  observation, 
  onEdit, 
  onArchive, 
  onComment,
  showRelated = false 
}: ObservationCardProps) {
  return (
    <Card className={observation.is_archived ? 'opacity-60' : ''}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Icon */}
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${typeColors[observation.observation_type] || 'bg-muted'}`}>
            <FileText className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-1 truncate">
                  {observation.title}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className={typeColors[observation.observation_type]}>
                    {observation.observation_type}
                  </Badge>
                  {observation.category && (
                    <Badge variant="outline" className="text-xs">
                      {observation.category}
                    </Badge>
                  )}
                  <Badge variant="outline" className={priorityColors[observation.priority]}>
                    {observation.priority}
                  </Badge>
                  {observation.is_archived && (
                    <Badge variant="outline" className="text-xs">
                      <Archive className="h-3 w-3 mr-1" />
                      Arquivada
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onComment(observation.id)}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(observation.id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                {!observation.is_archived && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onArchive(observation.id)}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Description Preview */}
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {observation.observation_text}
            </p>

            {/* Followup Alert */}
            {observation.requires_followup && !observation.is_archived && (
              <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 mb-2">
                <AlertCircle className="h-3 w-3" />
                Requer acompanhamento
                {observation.followup_date && ` até ${new Date(observation.followup_date).toLocaleDateString('pt-BR')}`}
              </div>
            )}

            {/* Tags */}
            {observation.tags && observation.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {observation.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-block px-2 py-0.5 text-xs bg-muted rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {formatDistanceToNow(new Date(observation.created_at), {
                  addSuffix: true,
                  locale: ptBR
                })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
