import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
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
  Calendar,
  Eye,
  SortAsc,
  SortDesc,
  Filter
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
import { DocumentPreviewModal } from '@/components/DocumentPreviewModal';
import { BulkActionsBar } from '@/components/BulkActionsBar';
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
import { processDocumentWithAI, getExtractionJobStatus } from '@/services/documentAI';

export default function Documentos() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  
  // SEO
  useEffect(() => {
    document.title = 'Central de Documentos | Gestão de Documentos com IA';
    const desc = 'Gerencie, pesquise e analise documentos com IA. Upload inteligente, pastas e reconciliação de dados.';
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (meta) meta.setAttribute('content', desc);
    else {
      meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = desc;
      document.head.appendChild(meta);
    }
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const href = `${window.location.origin}/documentos`;
    if (canonical) canonical.setAttribute('href', href);
    else {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      canonical.href = href;
      document.head.appendChild(canonical);
    }
  }, []);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const itemsPerPage = 20;

  // Selection and bulk operations
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [analyzingDocId, setAnalyzingDocId] = useState<string | null>(null);

  // Advanced filters
  const [sortBy, setSortBy] = useState<string>('upload_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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
      
      const filters = {
        search: searchTerm || undefined,
        folder_id: selectedFolderId || undefined,
        tag: selectedTag === 'all' ? undefined : selectedTag,
        page: currentPage,
        limit: itemsPerPage,
        sortBy,
        sortOrder
      };

      const [foldersData, documentsResponse] = await Promise.all([
        getFolders(),
        getDocuments(filters)
      ]);

      setFolders(foldersData);
      setDocuments(documentsResponse.documents);
      setTotalPages(documentsResponse.totalPages);
      setTotalDocuments(documentsResponse.total);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm, selectedFolderId, selectedTag, currentPage, sortBy, sortOrder]);

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, selectedFolderId, selectedTag, sortBy, sortOrder]);

  // Selection handlers
  const toggleDocumentSelection = (document: Document) => {
    setSelectedDocuments(prev => {
      const isSelected = prev.find(d => d.id === document.id);
      if (isSelected) {
        return prev.filter(d => d.id !== document.id);
      } else {
        return [...prev, document];
      }
    });
  };

  const selectAllDocuments = () => {
    setSelectedDocuments(documents);
  };

  const clearSelection = () => {
    setSelectedDocuments([]);
  };

  const isDocumentSelected = (documentId: string) => {
    return selectedDocuments.some(d => d.id === documentId);
  };

  const isAllSelected = documents.length > 0 && selectedDocuments.length === documents.length;

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
        // Remove from selection if selected
        setSelectedDocuments(prev => prev.filter(d => d.id !== document.id));
        loadData();
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error('Erro ao excluir documento');
      }
    }
  };

  const handlePreview = (document: Document) => {
    setPreviewDocument(document);
    setShowPreviewModal(true);
  };

  const handleAnalyze = async (document: Document) => {
    setAnalyzingDocId(document.id);
    try {
      toast.info('🔄 Análise iniciada', { 
        description: 'Processando documento com IA. Você será notificado quando concluir.' 
      });
      
      const result = await processDocumentWithAI(document.id);
      
      if (!result.success) {
        toast.error('❌ Falha na análise', { 
          description: result.error || 'Erro desconhecido' 
        });
        return;
      }
      
      // Sucesso - recarregar dados
      await loadData();
      
      toast.success('✅ Análise concluída!', {
        description: (
          <div className="flex flex-col gap-2">
            <p>{result.message || 'Dados enviados para revisão'}</p>
            <button 
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('tab', 'extracoes');
                window.location.href = url.toString();
              }}
              className="text-sm font-medium underline text-left"
            >
              Ver na seção de Aprovações →
            </button>
          </div>
        ),
        duration: 8000,
      });
      
    } catch (error) {
      console.error('Error analyzing document with AI:', error);
      toast.error('❌ Erro ao iniciar análise', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setAnalyzingDocId(null);
    }
  };
  // Get all unique tags from documents
  const allTags = Array.from(
    new Set(documents.flatMap(doc => doc.tags || []))
  ).sort();

  return (
    <>
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
          <div className="space-y-4">
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
                <Select value={selectedTag} onValueChange={setSelectedTag}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as tags</SelectItem>
                    {allTags.map(tag => (
                      <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                  const [field, order] = value.split('-') as [string, 'asc' | 'desc'];
                  setSortBy(field);
                  setSortOrder(order);
                }}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upload_date-desc">Mais recente</SelectItem>
                    <SelectItem value="upload_date-asc">Mais antigo</SelectItem>
                    <SelectItem value="file_name-asc">Nome A-Z</SelectItem>
                    <SelectItem value="file_name-desc">Nome Z-A</SelectItem>
                    <SelectItem value="file_size-desc">Maior arquivo</SelectItem>
                    <SelectItem value="file_size-asc">Menor arquivo</SelectItem>
                  </SelectContent>
                </Select>
                
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

            {/* Selection Controls */}
            {documents.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          selectAllDocuments();
                        } else {
                          clearSelection();
                        }
                      }}
                    />
                    <span className="text-sm">
                      Selecionar todos ({documents.length})
                    </span>
                  </div>
                  
                  {selectedDocuments.length > 0 && (
                    <Badge variant="secondary">
                      {selectedDocuments.length} selecionado(s)
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    Mostrando {documents.length} de {totalDocuments} documentos
                  </span>
                  {totalPages > 1 && (
                    <span>• Página {currentPage} de {totalPages}</span>
                  )}
                </div>
              </div>
            )}
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
                  {searchTerm || selectedTag !== 'all' ? 'Tente ajustar os filtros de busca' : 'Comece fazendo upload de seus primeiros documentos'}
                </p>
                <Button onClick={() => setShowUploadModal(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload de Arquivo
                </Button>
              </Card>
            ) : (
              <>
                <div className={viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
                  : 'space-y-2'
                }>
                  {documents.map((document) => (
                    <div key={document.id} className="relative">
                      {viewMode === 'grid' && (
                        <div className="absolute top-2 left-2 z-10">
                          <Checkbox
                            checked={isDocumentSelected(document.id)}
                            onCheckedChange={() => toggleDocumentSelection(document)}
                            className="bg-background border-2"
                          />
                        </div>
                      )}
                      <DocumentCard
                        document={document}
                        viewMode={viewMode}
                        onDownload={() => handleDownload(document)}
                        onDelete={() => handleDelete(document)}
                        onPreview={() => handlePreview(document)}
                        onUpdate={loadData}
                        isSelected={isDocumentSelected(document.id)}
                        onToggleSelect={() => toggleDocumentSelection(document)}
                        onAnalyze={() => handleAnalyze(document)}
                        isAnalyzing={analyzingDocId === document.id}
                        extraActions={
                          <div className="flex gap-1">
                            {/* GED components will be added here */}
                          </div>
                        }
                      />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-8">
                    <Pagination>
                      <PaginationContent>
                        {currentPage > 1 && (
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              className="cursor-pointer"
                            />
                          </PaginationItem>
                        )}
                        
                        {/* Page numbers */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                onClick={() => setCurrentPage(pageNum)}
                                isActive={currentPage === pageNum}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        
                        {currentPage < totalPages && (
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                              className="cursor-pointer"
                            />
                          </PaginationItem>
                        )}
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedDocuments={selectedDocuments}
        onClearSelection={clearSelection}
        onRefresh={loadData}
        folders={folders}
      />

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

      <DocumentPreviewModal
        document={previewDocument}
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
      />
    </>
  );
}