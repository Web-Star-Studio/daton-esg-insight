import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DocumentFolder } from '@/services/documents';

interface FolderTreeViewProps {
  folders: DocumentFolder[];
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
}

interface FolderNodeProps {
  folder: DocumentFolder;
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  level: number;
}

const FolderNode: React.FC<FolderNodeProps> = ({
  folder,
  selectedFolderId,
  onFolderSelect,
  level
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = folder.children && folder.children.length > 0;
  const isSelected = selectedFolderId === folder.id;

  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSelect = () => {
    onFolderSelect(folder.id);
  };

  return (
    <div>
      <div
        className={cn(
          'flex items-center w-full text-left hover:bg-accent rounded-md transition-colors',
          isSelected && 'bg-accent text-accent-foreground'
        )}
        style={{ paddingLeft: `${level * 16}px` }}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1 mr-1"
            onClick={handleToggle}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        ) : (
          <div className="w-6" />
        )}
        
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 justify-start h-auto py-1 px-2"
          onClick={handleSelect}
        >
          {isSelected ? (
            <FolderOpen className="h-4 w-4 mr-2 text-primary" />
          ) : (
            <Folder className="h-4 w-4 mr-2" />
          )}
          <span className="truncate">{folder.name}</span>
        </Button>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {folder.children!.map((childFolder) => (
            <FolderNode
              key={childFolder.id}
              folder={childFolder}
              selectedFolderId={selectedFolderId}
              onFolderSelect={onFolderSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FolderTreeView: React.FC<FolderTreeViewProps> = ({
  folders,
  selectedFolderId,
  onFolderSelect
}) => {
  return (
    <div className="space-y-1">
      {/* Root folder */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'w-full justify-start',
          selectedFolderId === null && 'bg-accent text-accent-foreground'
        )}
        onClick={() => onFolderSelect(null)}
      >
        {selectedFolderId === null ? (
          <FolderOpen className="h-4 w-4 mr-2 text-primary" />
        ) : (
          <Folder className="h-4 w-4 mr-2" />
        )}
        Todos os Documentos
      </Button>

      {/* Folder tree */}
      {folders.map((folder) => (
        <FolderNode
          key={folder.id}
          folder={folder}
          selectedFolderId={selectedFolderId}
          onFolderSelect={onFolderSelect}
          level={0}
        />
      ))}
    </div>
  );
};