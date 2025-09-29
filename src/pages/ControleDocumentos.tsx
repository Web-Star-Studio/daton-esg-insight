import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Download, Eye, FileText, Calendar, User, Archive, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EnhancedLoading } from "@/components/ui/enhanced-loading";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  document_type: string;
  ai_extracted_category: string | null;
  upload_date: string;
  uploader_user_id: string;
  company_id: string;
  tags: string[] | null;
  ai_processing_status: string | null;
  ai_confidence_score: number | null;
  controlled_copy: boolean;
  requires_approval: boolean;
  approval_status: string;
  master_list_included: boolean;
  code: string | null;
  responsible_department: string | null;
}

const ControleDocumentos = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { toast } = useToast();

  const [uploadData, setUploadData] = useState({
    document_type: 'Manual',
    tags: [] as string[],
    controlled_copy: false
  });

  const documentCategories = [
    'Manual',
    'Procedimento',
    'Instrução de Trabalho',
    'Formulário',
    'Política',
    'Plano',
    'Relatório',
    'Certificado',
    'Outros'
  ];

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          file_name,
          file_path,
          file_size,
          document_type,
          ai_extracted_category,
          upload_date,
          uploader_user_id,
          company_id,
          tags,
          ai_processing_status,
          ai_confidence_score,
          controlled_copy,
          requires_approval,
          approval_status,
          master_list_included,
          code,
          responsible_department
        `)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os documentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Manual': 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      'Procedimento': 'bg-green-100 text-green-800 hover:bg-green-100',
      'Instrução de Trabalho': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      'Formulário': 'bg-purple-100 text-purple-800 hover:bg-purple-100',
      'Política': 'bg-red-100 text-red-800 hover:bg-red-100',
      'Plano': 'bg-orange-100 text-orange-800 hover:bg-orange-100',
      'Relatório': 'bg-teal-100 text-teal-800 hover:bg-teal-100',
      'Certificado': 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
      'Outros': 'bg-gray-100 text-gray-800 hover:bg-gray-100'
    };
    return colors[category] || colors['Outros'];
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.ai_extracted_category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         '';
    const matchesCategory = categoryFilter === 'all' || doc.document_type === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EnhancedLoading size="lg" text="Carregando documentos..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Controle de Documentos</h1>
            <p className="text-muted-foreground">Sistema de gestão documental do SGQ</p>
          </div>
          <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Upload de Documento</DialogTitle>
                <DialogDescription>
                  Faça upload de um novo documento para o sistema de qualidade.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="file">Arquivo</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="document_type">Tipo de Documento</Label>
                  <Select value={uploadData.document_type} onValueChange={(value) => setUploadData({ ...uploadData, document_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {documentCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="controlled_copy"
                    checked={uploadData.controlled_copy}
                    onChange={(e) => setUploadData({ ...uploadData, controlled_copy: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="controlled_copy">Cópia controlada</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>
                  Cancelar
                </Button>
                <Button>
                  Fazer Upload
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {documentCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Biblioteca de Documentos
            </CardTitle>
            <CardDescription>
              Controle de versão e gestão de documentos do sistema de qualidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Nenhum documento encontrado</h3>
                <p className="text-muted-foreground">
                  {searchTerm || categoryFilter !== 'all' 
                    ? 'Tente uma pesquisa diferente ou altere os filtros.' 
                    : 'Comece fazendo upload do seu primeiro documento.'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Última Atualização</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-blue-600" />
                          <div>
                            <p className="font-medium">{doc.file_name}</p>
                            {doc.ai_extracted_category && (
                              <p className="text-sm text-muted-foreground">
                                {doc.ai_extracted_category}
                              </p>
                            )}
                            {doc.controlled_copy && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                Controlado
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(doc.document_type)}>
                          {doc.document_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatFileSize(doc.file_size)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(doc.upload_date).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ControleDocumentos;