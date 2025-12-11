import { useState } from "react";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageSquare, 
  Eye, 
  Search, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Users,
  TrendingUp,
  FileText
} from "lucide-react";
import { getWhistleblowerReports } from "@/services/governance";

interface EthicsChannelProps {
  onViewReport: (report: any) => void;
  onInvestigateReport: (report: any) => void;
  onCreateReport?: () => void;
}

export function EthicsChannel({ onViewReport, onInvestigateReport, onCreateReport }: EthicsChannelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const { data: reports = [], isLoading } = useOptimizedQuery({
    queryKey: ['whistleblower-reports'],
    queryFn: getWhistleblowerReports,
  });

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.report_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || report.status === filterStatus;
    const matchesCategory = filterCategory === "all" || report.category === filterCategory;
    const matchesPriority = filterPriority === "all" || report.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aberta': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Em Investigação': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Resolvida': return 'bg-green-100 text-green-800 border-green-200';
      case 'Fechada': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Arquivada': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Crítica': return 'bg-red-100 text-red-800 border-red-200';
      case 'Alta': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Média': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Baixa': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Aberta': return <AlertTriangle className="w-3 h-3" />;
      case 'Em Investigação': return <Clock className="w-3 h-3" />;
      case 'Resolvida': return <CheckCircle className="w-3 h-3" />;
      case 'Fechada': return <CheckCircle className="w-3 h-3" />;
      default: return <MessageSquare className="w-3 h-3" />;
    }
  };

  const categories = [...new Set(reports.map(r => r.category))];
  const currentYear = new Date().getFullYear();

  const stats = {
    total: reports.length,
    open: reports.filter(r => ['Aberta', 'Em Investigação'].includes(r.status)).length,
    resolved: reports.filter(r => ['Resolvida', 'Fechada'].includes(r.status)).length,
    currentYear: reports.filter(r => new Date(r.created_at).getFullYear() === currentYear).length,
    anonymous: reports.filter(r => r.is_anonymous).length,
    critical: reports.filter(r => r.priority === 'Crítica').length,
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Abertas</p>
                <p className="text-2xl font-bold">{stats.open}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Resolvidas</p>
                <p className="text-2xl font-bold">{stats.resolved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Este Ano</p>
                <p className="text-2xl font-bold">{stats.currentYear}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Anônimas</p>
                <p className="text-2xl font-bold">{stats.anonymous}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">Críticas</p>
                <p className="text-2xl font-bold">{stats.critical}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Canal de Ética e Integridade
              </CardTitle>
              <CardDescription>
                Gerencie denúncias e relatórios do canal de ética
              </CardDescription>
            </div>
            {onCreateReport && (
              <Button onClick={onCreateReport}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Denúncia
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código, categoria ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Aberta">Aberta</SelectItem>
                <SelectItem value="Em Investigação">Em Investigação</SelectItem>
                <SelectItem value="Resolvida">Resolvida</SelectItem>
                <SelectItem value="Fechada">Fechada</SelectItem>
                <SelectItem value="Arquivada">Arquivada</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Crítica">Crítica</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {categories.map((category: string) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="grid gap-4">
        {filteredReports.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {report.report_code}
                    </h3>
                    <Badge className={getStatusColor(report.status)}>
                      {getStatusIcon(report.status)}
                      <span className="ml-1">{report.status}</span>
                    </Badge>
                    <Badge className={getPriorityColor(report.priority)}>
                      {report.priority}
                    </Badge>
                    {report.is_anonymous && (
                      <Badge variant="outline" className="text-purple-600 border-purple-200">
                        <Shield className="w-3 h-3 mr-1" />
                        Anônimo
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{report.category}</Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {report.description.length > 200 
                      ? `${report.description.substring(0, 200)}...`
                      : report.description
                    }
                  </p>
                  
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Criado em: {new Date(report.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    
                    {report.incident_date && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Incidente: {new Date(report.incident_date).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                    
                    {report.location && (
                      <div>
                        Local: {report.location}
                      </div>
                    )}
                  </div>
                  
                  {!report.is_anonymous && (report.reporter_name || report.reporter_email) && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Denunciante: </span>
                      {report.reporter_name && report.reporter_name}
                      {report.reporter_name && report.reporter_email && " - "}
                      {report.reporter_email && report.reporter_email}
                    </div>
                  )}
                  
                  {report.people_involved && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Envolvidos: </span>
                      {report.people_involved}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewReport(report)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Visualizar
                  </Button>
                  
                  {report.status !== 'Fechada' && report.status !== 'Arquivada' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onInvestigateReport(report)}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      {report.status === 'Aberta' ? 'Investigar' : 'Atualizar'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredReports.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma denúncia encontrada</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterStatus !== "all" || filterCategory !== "all" || filterPriority !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "Nenhuma denúncia foi registrada ainda no canal de ética"
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}