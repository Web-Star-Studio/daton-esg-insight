import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileText, Paperclip, MoreVertical, Eye, Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  upload_date: string;
}

interface LicenseDocumentsCardProps {
  documents?: Document[];
  isLoading: boolean;
  onUpload: () => void;
  onView: (filePath: string) => void;
  onDownload: (filePath: string, fileName: string) => void;
}

export function LicenseDocumentsCard({
  documents,
  isLoading,
  onUpload,
  onView,
  onDownload,
}: LicenseDocumentsCardProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Documentos Anexados
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onUpload}
          >
            <Paperclip className="h-4 w-4 mr-2" />
            Anexar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        ) : documents && documents.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Arquivo</TableHead>
                <TableHead>Data de Upload</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.file_name}</TableCell>
                  <TableCell>{formatDate(doc.upload_date)}</TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView(doc.file_path)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDownload(doc.file_path, doc.file_name)}>
                            <Download className="h-4 w-4 mr-2" />
                            Baixar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum documento anexado</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={onUpload}
            >
              <Paperclip className="h-4 w-4 mr-2" />
              Anexar primeiro documento
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
