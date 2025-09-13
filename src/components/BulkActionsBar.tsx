import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Trash2,
  FolderOpen,
  Tag,
  X,
  Download,
  Archive
} from 'lucide-react';
import { toast } from 'sonner';
import type { Document, DocumentFolder } from '@/services/documents';
import { bulkDeleteDocuments, bulkMoveDocuments, bulkUpdateTags } from '@/services/documents';

interface BulkActionsBarProps {
  selectedDocuments: Document[];
  onClearSelection: () => void;
  onRefresh: () => void;
  folders: DocumentFolder[];
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedDocuments,
  onClearSelection,
  onRefresh,
  folders
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');

  const selectedCount = selectedDocuments.length;

  const handleBulkDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir ${selectedCount} documento(s)?`)) {
      return;
    }

    try {
      setIsProcessing(true);
      const documentIds = selectedDocuments.map(doc => doc.id);
      await bulkDeleteDocuments(documentIds);
      
      toast.success(`${selectedCount} documento(s) excluído(s) com sucesso`);
      onClearSelection();
      onRefresh();
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast.error('Erro ao excluir documentos');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkMove = async () => {
    if (!selectedFolderId && selectedFolderId !== '') {
      toast.error('Selecione uma pasta de destino');
      return;
    }

    try {
      setIsProcessing(true);
      const documentIds = selectedDocuments.map(doc => doc.id);
      const targetFolderId = selectedFolderId === 'root' ? null : selectedFolderId;
      
      await bulkMoveDocuments(documentIds, targetFolderId);
      
      const folderName = targetFolderId 
        ? folders.find(f => f.id === targetFolderId)?.name || 'pasta'
        : 'raiz';
        
      toast.success(`${selectedCount} documento(s) movido(s) para ${folderName}`);
      onClearSelection();
      onRefresh();
    } catch (error) {
      console.error('Error bulk moving:', error);
      toast.error('Erro ao mover documentos');
    } finally {
      setIsProcessing(false);
    }
  };

  const getFlatFolders = (folders: DocumentFolder[]): DocumentFolder[] => {
    const flatFolders: DocumentFolder[] = [];
    
    const addFolder = (folder: DocumentFolder, prefix = '') => {
      flatFolders.push({
        ...folder,
        name: prefix + folder.name
      });
      
      if (folder.children) {
        folder.children.forEach(child => {
          addFolder(child, prefix + folder.name + ' / ');
        });
      }
    };

    folders.forEach(folder => addFolder(folder));
    return flatFolders;
  };

  const flatFolders = getFlatFolders(folders);

  const getTotalSize = () => {
    return selectedDocuments.reduce((total, doc) => {
      return total + (doc.file_size || 0);
    }, 0);
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-background border rounded-lg shadow-lg p-4 min-w-[600px]">
        <div className="flex items-center justify-between gap-4">
          {/* Selection Info */}
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">
              {selectedCount} selecionado(s)
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatFileSize(getTotalSize())}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Move to Folder */}
            <div className="flex items-center gap-2">
              <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                <SelectTrigger className="w-40 h-8">
                  <SelectValue placeholder="Mover para..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">📁 Raiz</SelectItem>
                  {flatFolders.map(folder => (
                    <SelectItem key={folder.id} value={folder.id}>
                      📁 {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkMove}
                disabled={isProcessing || !selectedFolderId}
                className="h-8"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Mover
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Delete */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isProcessing}
              className="h-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};