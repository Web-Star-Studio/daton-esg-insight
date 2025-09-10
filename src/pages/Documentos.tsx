import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Upload,
  FolderPlus,
  MoreHorizontal,
  Download,
  FolderOpen,
  File,
  Grid3X3,
  List,
  Tag,
  Calendar
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FolderTreeView } from '@/components/FolderTreeView';
import { DocumentUploadModal } from '@/components/DocumentUploadModal';
import { CreateFolderModal } from '@/components/CreateFolderModal';
import { DocumentCard } from '@/components/DocumentCard';
import { toast } from 'sonner';
import {
  getDocuments,
  getFolders,
  deleteDocument,
  downloadDocument,
  type Document,
  type DocumentFolder,
  type DocumentFilters,
  formatFileSize,
  getFileIcon
} from '@/services/documents';

export default function Documentos() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);

  // Get current folder name for breadcrumb
  const getCurrentFolderName = (folderId: string | null): string => {
    if (!folderId) return 'Documentos';
    
    const findFolder = (folders: DocumentFolder[], id: string): DocumentFolder | null => {
      for (const folder of folders) {
        if (folder.id === id) return folder;
        if (folder.children) {
          const found = findFolder(folder.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const folder = findFolder(folders, folderId);
    return folder ? folder.name : 'Documentos';
  };

  // Load folders and documents
  const loadData = async () => {
    try {
      setLoading(true);
      
      const filters: DocumentFilters = {};
      if (searchTerm) filters.search = searchTerm;
      if (selectedFolderId) filters.folder_id = selectedFolderId;
      if (selectedTag) filters.tag = selectedTag;

      const [foldersData, documentsData] = await Promise.all([
        getFolders(),
        getDocuments(filters)
      ]);

      setFolders(foldersData);
      setDocuments(documentsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm, selectedFolderId, selectedTag]);

  // Handle document actions
  const handleDownload = async (document: Document) => {
    try {
      const { url, fileName } = await downloadDocument(document.id);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      toast.success('Download iniciado');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Erro ao baixar documento');
    }
  };

  const handleDelete = async (document: Document) => {
    if (confirm(`Tem certeza que deseja excluir "${document.file_name}"?`)) {
      try {
        await deleteDocument(document.id);
        toast.success('Documento excluído com sucesso');
        loadData();
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error('Erro ao excluir documento');
      }
    }
  };

  // Get all unique tags from documents
  const allTags = Array.from(
    new Set(documents.flatMap(doc => doc.tags || []))
  ).sort();

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Central de Documentos</h1>
            <p className="text-muted-foreground">
              Gerencie todos os documentos da sua empresa
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCreateFolderModal(true)}
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Nova Pasta
            </Button>
            <Button onClick={() => setShowUploadModal(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="">Todas as tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
              
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Folder Tree */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center">
                <FolderOpen className="h-4 w-4 mr-2" />
                Pastas
              </h3>
              <FolderTreeView
                folders={folders}
                selectedFolderId={selectedFolderId}
                onFolderSelect={setSelectedFolderId}
              />
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFolderId(null)}
                className="h-auto p-1"
              >
                Documentos
              </Button>
              {selectedFolderId && (
                <>
                  <span>/</span>
                  <span>{getCurrentFolderName(selectedFolderId)}</span>
                </>
              )}
            </div>

            {/* Documents Display */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : documents.length === 0 ? (
              <Card className="p-12 text-center">
                <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum documento encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedTag ? 'Tente ajustar os filtros de busca' : 'Comece fazendo upload de seus primeiros documentos'}
                </p>
                <Button onClick={() => setShowUploadModal(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload de Arquivo
                </Button>
              </Card>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
                : 'space-y-2'
              }>
                {documents.map((document) => (
                  <DocumentCard
                    key={document.id}
                    document={document}
                    viewMode={viewMode}
                    onDownload={() => handleDownload(document)}
                    onDelete={() => handleDelete(document)}
                    onUpdate={loadData}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={loadData}
        selectedFolderId={selectedFolderId}
      />

      <CreateFolderModal
        isOpen={showCreateFolderModal}
        onClose={() => setShowCreateFolderModal(false)}
        onSuccess={loadData}
        parentFolderId={selectedFolderId}
      />
    </MainLayout>
  );
}