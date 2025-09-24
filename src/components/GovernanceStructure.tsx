import { useState } from "react";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  Edit, 
  Search, 
  Filter,
  Calendar,
  Shield,
  Crown,
  Building2,
  TrendingUp
} from "lucide-react";
import { getBoardMembers } from "@/services/governance";

interface GovernanceStructureProps {
  onEditMember: (member: any) => void;
}

export function GovernanceStructure({ onEditMember }: GovernanceStructureProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCommittee, setFilterCommittee] = useState("all");

  const { data: boardMembers = [], isLoading } = useOptimizedQuery({
    queryKey: ['board-members'],
    queryFn: getBoardMembers,
  });

  const filteredMembers = boardMembers.filter(member => {
    const matchesSearch = member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || member.status === filterStatus;
    const matchesCommittee = filterCommittee === "all" || member.committee === filterCommittee;
    
    return matchesSearch && matchesStatus && matchesCommittee;
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Inativo': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const committees = [...new Set(boardMembers.map(m => m.committee).filter(Boolean))];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-muted rounded-full"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Total de Membros</p>
                <p className="text-2xl font-bold">{boardMembers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Membros Independentes</p>
                <p className="text-2xl font-bold">
                  {boardMembers.filter(m => m.is_independent).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Comitês Ativos</p>
                <p className="text-2xl font-bold">{committees.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Taxa de Independência</p>
                <p className="text-2xl font-bold">
                  {boardMembers.length > 0 
                    ? Math.round((boardMembers.filter(m => m.is_independent).length / boardMembers.length) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Estrutura do Conselho
          </CardTitle>
          <CardDescription>
            Gerencie os membros do conselho de administração e comitês
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou cargo..."
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
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterCommittee} onValueChange={setFilterCommittee}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Comitê" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Comitês</SelectItem>
                {committees.map((committee: string) => (
                  <SelectItem key={committee} value={committee}>
                    {committee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <div className="grid gap-4">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getInitials(member.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{member.full_name}</h3>
                      <Badge className={getStatusColor(member.status)}>
                        {member.status}
                      </Badge>
                      {member.is_independent && (
                        <Badge variant="outline" className="text-blue-600 border-blue-200">
                          <Shield className="w-3 h-3 mr-1" />
                          Independente
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-primary font-medium">{member.position}</p>
                    
                    {member.committee && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {member.committee}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Nomeado em: {new Date(member.appointment_date).toLocaleDateString('pt-BR')}
                      </div>
                      
                      {member.experience_years && (
                        <div>
                          {member.experience_years} anos de experiência
                        </div>
                      )}
                      
                      {member.gender && (
                        <div>
                          {member.gender}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditMember(member)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </div>
              
              {member.expertise_areas && member.expertise_areas.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Áreas de Expertise:</p>
                  <div className="flex flex-wrap gap-2">
                    {member.expertise_areas.map((area, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {filteredMembers.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum membro encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterStatus !== "all" || filterCommittee !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "Adicione membros ao conselho para começar"
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}