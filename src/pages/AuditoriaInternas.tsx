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
import { Plus, Search, Eye, FileText, Calendar, AlertCircle, CheckCircle, Clock } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";

interface Audit {
  id: string;
  title: string;
  audit_type: string;
  status: string;
  auditor: string | null;
  scope: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

const AuditoriaInternas = () => {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();

  const [newAudit, setNewAudit] = useState({
    title: '',
    audit_type: 'Interna',
    status: 'Planejada',
    auditor: '',
    scope: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    loadAudits();
  }, []);

  const loadAudits = async () => {
    try {
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAudits(data || []);
    } catch (error) {
      console.error('Erro ao carregar auditorias:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as auditorias.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAudit = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .single();

      if (!profile?.company_id) {
        throw new Error('Company ID não encontrado');
      }

      const { error } = await supabase
        .from('audits')
        .insert([{
          ...newAudit,
          company_id: profile.company_id
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Auditoria criada com sucesso!",
      });

      setIsCreateModalOpen(false);
      setNewAudit({
        title: '',
        audit_type: 'Interna',
        status: 'Planejada',
        auditor: '',
        scope: '',
        start_date: '',
        end_date: ''
      });
      
      loadAudits();
    } catch (error) {
      console.error('Erro ao criar auditoria:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a auditoria.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Planejada':
        return <Clock className="h-4 w-4" />;
      case 'Em Andamento':
        return <AlertCircle className="h-4 w-4" />;
      case 'Concluída':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planejada':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'Em Andamento':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'Concluída':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const filteredAudits = audits.filter(audit =>
    audit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    audit.auditor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ''
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EnhancedLoading size="lg" text="Carregando auditorias..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Auditorias Internas</h1>
            <p className="text-muted-foreground">Sistema de gestão de auditorias do SGQ</p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Auditoria
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Criar Nova Auditoria</DialogTitle>
                <DialogDescription>
                  Defina os detalhes da nova auditoria interna do sistema de qualidade.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Título da Auditoria</Label>
                  <Input
                    id="title"
                    value={newAudit.title}
                    onChange={(e) => setNewAudit({ ...newAudit, title: e.target.value })}
                    placeholder="Ex: Auditoria ISO 9001 - Processo de Vendas"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="auditor">Auditor Responsável</Label>
                  <Input
                    id="auditor"
                    value={newAudit.auditor}
                    onChange={(e) => setNewAudit({ ...newAudit, auditor: e.target.value })}
                    placeholder="Nome do auditor"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="scope">Escopo da Auditoria</Label>
                  <Textarea
                    id="scope"
                    value={newAudit.scope}
                    onChange={(e) => setNewAudit({ ...newAudit, scope: e.target.value })}
                    placeholder="Defina o escopo da auditoria..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="start_date">Data de Início</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={newAudit.start_date}
                      onChange={(e) => setNewAudit({ ...newAudit, start_date: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="end_date">Data de Término</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={newAudit.end_date}
                      onChange={(e) => setNewAudit({ ...newAudit, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={newAudit.status} onValueChange={(value) => setNewAudit({ ...newAudit, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planejada">Planejada</SelectItem>
                      <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                      <SelectItem value="Concluída">Concluída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateAudit} disabled={!newAudit.title}>
                  Criar Auditoria
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar auditorias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Auditorias do Sistema de Qualidade
            </CardTitle>
            <CardDescription>
              Gestão completa de auditorias internas do SGQ
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAudits.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Nenhuma auditoria encontrada</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Tente uma pesquisa diferente.' : 'Comece criando sua primeira auditoria.'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Auditor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAudits.map((audit) => (
                    <TableRow key={audit.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{audit.title}</p>
                          {audit.scope && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {audit.scope.substring(0, 80)}...
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {audit.auditor || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`gap-1 ${getStatusColor(audit.status)}`}>
                          {getStatusIcon(audit.status)}
                          {audit.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {audit.start_date && audit.end_date ? (
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(audit.start_date).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="text-muted-foreground">
                              até {new Date(audit.end_date).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
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

export default AuditoriaInternas;