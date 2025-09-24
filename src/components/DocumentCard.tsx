import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Download,
  Trash2,
  Calendar,
  User,
  Folder,
  Tag,
  Eye,
  Wand2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Document } from '@/services/documents';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { formatFileSize, getFileIcon } from '@/services/documents';

interface DocumentCardProps {
  document: Document;
  viewMode: 'grid' | 'list';
  onDownload: () => void;
  onDelete: () => void;
  onPreview: () => void;
  onUpdate: () => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onAnalyze?: () => void;
  extraActions?: React.ReactNode;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  viewMode,
  onDownload,
  onDelete,
  onPreview,
  onUpdate,
  isSelected = false,
  onToggleSelect,
  onAnalyze,
  extraActions
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getRelatedInfo = () => {
    if (document.related_model === 'document') return null;
    
    const modelNames: Record<string, string> = {
      license: 'Licença',
      asset: 'Ativo',
      waste_log: 'Resíduo',
      goal: 'Meta',
      carbon_project: 'Projeto de Carbono'
    };

    return modelNames[document.related_model] || document.related_model;
  };

  if (viewMode === 'list') {
    return (
      <Card className={`p-4 ${isSelected ? 'ring-2 ring-primary' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {onToggleSelect && (
              <Checkbox 
                checked={isSelected}
                onCheckedChange={onToggleSelect}
              />
            )}
            
            <div className="text-2xl">{getFileIcon(document.file_type)}</div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{document.file_name}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(document.upload_date)}
                </span>
                
                {document.file_size && (
                  <span>{formatFileSize(document.file_size)}</span>
                )}

                {document.document_folders && (
                  <span className="flex items-center gap-1">
                    <Folder className="h-3 w-3" />
                    {document.document_folders.name}
                  </span>
                )}

                {getRelatedInfo() && (
                  <Badge variant="outline" className="text-xs">
                    {getRelatedInfo()}
                  </Badge>
                )}
                
                <DocumentStatusBadge 
                  aiProcessingStatus={document.ai_processing_status}
                  aiConfidenceScore={document.ai_confidence_score}
                  className="ml-auto"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {document.tags && document.tags.length > 0 && (
              <div className="flex items-center gap-1">
                {document.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {document.tags.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{document.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onPreview}>
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </DropdownMenuItem>
                {onAnalyze && (
                  <DropdownMenuItem onClick={onAnalyze}>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Analisar com IA
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {extraActions}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <div className="space-y-3">
        {/* File Icon and Actions */}
        <div className="flex items-start justify-between">
          <div className="text-4xl">{getFileIcon(document.file_type)}</div>
          
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onPreview}>
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </DropdownMenuItem>
                {onAnalyze && (
                  <DropdownMenuItem onClick={onAnalyze}>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Analisar com IA
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {extraActions}
          </div>
        </div>

        {/* File Name */}
        <div>
          <h3 className="font-medium text-sm leading-tight line-clamp-2">
            {document.file_name}
          </h3>
        </div>

        {/* Tags */}
        {document.tags && document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {document.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {document.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{document.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(document.upload_date)}
          </div>
          
          {document.file_size && (
            <div>{formatFileSize(document.file_size)}</div>
          )}

          {document.document_folders && (
            <div className="flex items-center gap-1">
              <Folder className="h-3 w-3" />
              {document.document_folders.name}
            </div>
          )}

          {getRelatedInfo() && (
            <Badge variant="outline" className="text-xs mt-1">
              {getRelatedInfo()}
            </Badge>
          )}
        </div>

        {/* Extra Actions at bottom for grid view */}
        {extraActions && (
          <div className="pt-2 border-t">
            {extraActions}
          </div>
        )}
      </div>
    </Card>
  );
};