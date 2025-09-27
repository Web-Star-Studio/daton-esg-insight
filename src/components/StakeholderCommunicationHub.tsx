import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Send, 
  Mail, 
  Phone, 
  Calendar, 
  FileText, 
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Plus,
  Search,
  Filter,
  Archive,
  Star,
  Reply,
  Forward,
  Paperclip
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Communication {
  id: string;
  stakeholder_id: string;
  stakeholder_name: string;
  type: 'email' | 'meeting' | 'phone' | 'survey' | 'document';
  subject: string;
  content: string;
  direction: 'outbound' | 'inbound';
  status: 'sent' | 'delivered' | 'read' | 'replied' | 'scheduled';
  priority: 'low' | 'medium' | 'high';
  scheduled_date?: string;
  sent_date?: string;
  attachments?: string[];
  tags?: string[];
  created_at: string;
  created_by: string;
}

interface Template {
  id: string;
  name: string;
  type: string;
  subject: string;
  content: string;
  variables: string[];
}

const StakeholderCommunicationHub = () => {
  const [activeTab, setActiveTab] = useState('inbox');
  const [selectedCommunication, setSelectedCommunication] = useState<Communication | null>(null);
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [newMessage, setNewMessage] = useState<{
    type: 'email' | 'meeting' | 'phone' | 'survey' | 'document';
    priority: 'low' | 'medium' | 'high';
    stakeholder_id: string;
    template_id: string;
    subject: string;
    content: string;
  }>({
    type: 'email',
    priority: 'medium',
    stakeholder_id: '',
    template_id: '',
    subject: '',
    content: ''
  });

  const queryClient = useQueryClient();

  const { data: communications, isLoading } = useQuery({
    queryKey: ['communications', filterType, filterStatus, searchTerm],
    queryFn: async () => {
      // Mock data - in production, this would come from your API
      return [
        {
          id: '1',
          stakeholder_id: 'st1',
          stakeholder_name: 'Associação de Investidores',
          type: 'email' as const,
          subject: 'Relatório Trimestral Q4 2024',
          content: 'Prezados investidores, segue em anexo o relatório de performance do último trimestre...',
          direction: 'outbound' as const,
          status: 'delivered' as const,
          priority: 'high' as const,
          sent_date: '2025-01-15T10:00:00Z',
          attachments: ['relatorio-q4-2024.pdf'],
          tags: ['relatório', 'investidores', 'trimestral'],
          created_at: '2025-01-15T09:30:00Z',
          created_by: 'Felipe Antunes'
        },
        {
          id: '2',
          stakeholder_id: 'st2',
          stakeholder_name: 'Sindicato dos Trabalhadores',
          type: 'meeting' as const,
          subject: 'Reunião - Negociação Coletiva 2025',
          content: 'Reunião agendada para discussão dos termos da negociação coletiva para o ano de 2025.',
          direction: 'inbound' as const,
          status: 'scheduled' as const,
          priority: 'high' as const,
          scheduled_date: '2025-02-20T14:00:00Z',
          tags: ['negociação', 'trabalhadores', 'reunião'],
          created_at: '2025-01-10T11:00:00Z',
          created_by: 'Sistema'
        },
        {
          id: '3',
          stakeholder_id: 'st3',
          stakeholder_name: 'ONG Ambiental Local',
          type: 'survey' as const,
          subject: 'Pesquisa de Satisfação - Programas Ambientais',
          content: 'Gostaríamos de obter seu feedback sobre nossos programas de sustentabilidade...',
          direction: 'outbound' as const,
          status: 'sent' as const,
          priority: 'medium' as const,
          sent_date: '2025-01-12T16:00:00Z',
          tags: ['pesquisa', 'sustentabilidade', 'feedback'],
          created_at: '2025-01-12T15:30:00Z',
          created_by: 'Felipe Antunes'
        }
      ] as Communication[];
    },
  });

  const { data: templates } = useQuery({
    queryKey: ['communication-templates'],
    queryFn: async () => {
      return [
        {
          id: '1',
          name: 'Relatório Trimestral',
          type: 'email',
          subject: 'Relatório Trimestral {PERIODO}',
          content: 'Prezado(a) {NOME_STAKEHOLDER},\n\nSegue em anexo o relatório de performance referente ao período {PERIODO}.\n\nPrincipais destaques:\n- {DESTAQUE_1}\n- {DESTAQUE_2}\n- {DESTAQUE_3}\n\nFicamos à disposição para esclarecimentos.\n\nAtenciosamente,\n{REMETENTE}',
          variables: ['NOME_STAKEHOLDER', 'PERIODO', 'DESTAQUE_1', 'DESTAQUE_2', 'DESTAQUE_3', 'REMETENTE']
        },
        {
          id: '2',
          name: 'Convite para Reunião',
          type: 'email',
          subject: 'Convite - {ASSUNTO_REUNIAO}',
          content: 'Prezado(a) {NOME_STAKEHOLDER},\n\nGostaríamos de convidá-lo(a) para uma reunião sobre {ASSUNTO_REUNIAO}.\n\nData: {DATA}\nHorário: {HORARIO}\nLocal: {LOCAL}\n\nAgenda:\n- {ITEM_1}\n- {ITEM_2}\n- {ITEM_3}\n\nPor favor, confirme sua presença.\n\nAtenciosamente,\n{REMETENTE}',
          variables: ['NOME_STAKEHOLDER', 'ASSUNTO_REUNIAO', 'DATA', 'HORARIO', 'LOCAL', 'ITEM_1', 'ITEM_2', 'ITEM_3', 'REMETENTE']
        }
      ] as Template[];
    },
  });

  const sendCommunicationMutation = useMutation({
    mutationFn: async (communication: Partial<Communication>) => {
      // Real API call will be implemented
      throw new Error('Comunicação com stakeholders não configurada ainda');
    },
    onSuccess: () => {
      toast.success('Comunicação enviada com sucesso!');
      setIsNewMessageOpen(false);
      resetNewMessage();
      queryClient.invalidateQueries({ queryKey: ['communications'] });
    },
    onError: () => {
      toast.error('Erro ao enviar comunicação.');
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <Send className="h-4 w-4 text-blue-500" />;
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'read': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'replied': return <Reply className="h-4 w-4 text-purple-500" />;
      case 'scheduled': return <Clock className="h-4 w-4 text-orange-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'survey': return <FileText className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCommunications = communications?.filter(comm => {
    const matchesSearch = comm.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comm.stakeholder_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || comm.type === filterType;
    const matchesStatus = filterStatus === 'all' || comm.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleSendCommunication = () => {
    if (!newMessage.subject || !newMessage.content || !newMessage.stakeholder_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const communicationData = {
      ...newMessage,
      direction: 'outbound' as const,
      status: 'sent' as const,
      created_at: new Date().toISOString(),
      created_by: 'Felipe Antunes'
    };

    sendCommunicationMutation.mutate(communicationData);
  };

  const resetNewMessage = () => {
    setNewMessage({
      type: 'email',
      priority: 'medium',
      stakeholder_id: '',
      template_id: '',
      subject: '',
      content: ''
    });
  };

  const applyTemplate = (templateId: string) => {
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      setNewMessage(prev => ({
        ...prev,
        subject: template.subject,
        content: template.content
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Central de Comunicação</h2>
          <p className="text-muted-foreground">
            Gerencie todas as comunicações com stakeholders em um só lugar
          </p>
        </div>
        <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Nova Comunicação</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Comunicação</DialogTitle>
              <DialogDescription>
                Envie uma mensagem para stakeholders ou grupos específicos
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Comunicação</Label>
                <Select value={newMessage.type} onValueChange={(value) => setNewMessage(prev => ({...prev, type: value as 'email' | 'meeting' | 'phone' | 'survey' | 'document'}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="meeting">Reunião</SelectItem>
                    <SelectItem value="survey">Pesquisa</SelectItem>
                    <SelectItem value="document">Documento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Prioridade</Label>
                <Select value={newMessage.priority} onValueChange={(value) => setNewMessage(prev => ({...prev, priority: value as 'low' | 'medium' | 'high'}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Destinatário(s)</Label>
              <Select value={newMessage.stakeholder_id} onValueChange={(value) => setNewMessage(prev => ({...prev, stakeholder_id: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione os stakeholders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="st1">Associação de Investidores</SelectItem>
                  <SelectItem value="st2">Sindicato dos Trabalhadores</SelectItem>
                  <SelectItem value="st3">ONG Ambiental Local</SelectItem>
                  <SelectItem value="all_investors">Todos os Investidores</SelectItem>
                  <SelectItem value="all_employees">Todos os Funcionários</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Modelo (Opcional)</Label>
              <Select value={newMessage.template_id} onValueChange={(value) => {
                setNewMessage(prev => ({...prev, template_id: value}));
                if (value) applyTemplate(value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Usar modelo existente" />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Assunto</Label>
              <Input 
                placeholder="Digite o assunto da comunicação" 
                value={newMessage.subject}
                onChange={(e) => setNewMessage(prev => ({...prev, subject: e.target.value}))}
              />
            </div>

            <div>
              <Label>Conteúdo</Label>
              <Textarea 
                placeholder="Digite o conteúdo da comunicação..."
                className="min-h-[120px]"
                value={newMessage.content}
                onChange={(e) => setNewMessage(prev => ({...prev, content: e.target.value}))}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setIsNewMessageOpen(false);
                resetNewMessage();
              }}>
                Cancelar
              </Button>
              <Button onClick={handleSendCommunication} disabled={sendCommunicationMutation.isPending}>
                <Send className="h-4 w-4 mr-2" />
                {sendCommunicationMutation.isPending ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar comunicações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="email">E-mail</SelectItem>
            <SelectItem value="meeting">Reunião</SelectItem>
            <SelectItem value="phone">Telefone</SelectItem>
            <SelectItem value="survey">Pesquisa</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="sent">Enviado</SelectItem>
            <SelectItem value="delivered">Entregue</SelectItem>
            <SelectItem value="read">Lido</SelectItem>
            <SelectItem value="replied">Respondido</SelectItem>
            <SelectItem value="scheduled">Agendado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Communication Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inbox">Caixa de Entrada</TabsTrigger>
          <TabsTrigger value="sent">Enviados</TabsTrigger>
          <TabsTrigger value="scheduled">Agendados</TabsTrigger>
          <TabsTrigger value="templates">Modelos</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Communications List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Comunicações ({filteredCommunications?.length || 0})</span>
                    <Button variant="outline" size="sm">
                      <Archive className="h-4 w-4 mr-2" />
                      Arquivar Selecionados
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-3">
                      {filteredCommunications?.map((comm) => (
                        <div
                          key={comm.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                            selectedCommunication?.id === comm.id ? 'bg-muted border-primary' : ''
                          }`}
                          onClick={() => setSelectedCommunication(comm)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              {getTypeIcon(comm.type)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium truncate">{comm.stakeholder_name}</span>
                                  <Badge className={getPriorityColor(comm.priority)}>
                                    {comm.priority}
                                  </Badge>
                                </div>
                                <div className="text-sm font-medium text-foreground truncate">
                                  {comm.subject}
                                </div>
                                <div className="text-sm text-muted-foreground truncate">
                                  {comm.content}
                                </div>
                                <div className="flex items-center space-x-2 mt-2">
                                  {comm.tags?.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              {getStatusIcon(comm.status)}
                              <span className="text-xs text-muted-foreground">
                                {new Date(comm.created_at).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Communication Details */}
            <div>
              {selectedCommunication ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{selectedCommunication.subject}</CardTitle>
                      <div className="flex space-x-1">
                        <Button variant="outline" size="sm">
                          <Star className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Reply className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Forward className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{selectedCommunication.stakeholder_name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(selectedCommunication.status)}
                        <span className="capitalize">{selectedCommunication.status}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Conteúdo</Label>
                        <div className="mt-2 p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                          {selectedCommunication.content}
                        </div>
                      </div>

                      {selectedCommunication.attachments && selectedCommunication.attachments.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium">Anexos</Label>
                          <div className="mt-2 space-y-2">
                            {selectedCommunication.attachments.map((attachment, index) => (
                              <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                                <Paperclip className="h-4 w-4" />
                                <span className="text-sm">{attachment}</span>
                                <Button variant="outline" size="sm" className="ml-auto">
                                  Download
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-4 border-t">
                        <div className="text-xs text-muted-foreground">
                          <div>Criado por: {selectedCommunication.created_by}</div>
                          <div>Data: {new Date(selectedCommunication.created_at).toLocaleString('pt-BR')}</div>
                          {selectedCommunication.sent_date && (
                            <div>Enviado: {new Date(selectedCommunication.sent_date).toLocaleString('pt-BR')}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Selecione uma comunicação para ver os detalhes
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Modelos de Comunicação</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Modelo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates?.map((template) => (
                  <Card key={template.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>Tipo: {template.type}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-sm font-medium">Assunto</Label>
                          <div className="text-sm text-muted-foreground">{template.subject}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Variáveis</Label>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {template.variables.map((variable) => (
                              <Badge key={variable} variant="outline" className="text-xs">
                                {variable}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 mt-4">
                        <Button variant="outline" size="sm">Editar</Button>
                        <Button size="sm">Usar Modelo</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StakeholderCommunicationHub;