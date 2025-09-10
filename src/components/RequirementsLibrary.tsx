import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Search, Calendar, Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { complianceService, type RegulatoryRequirement } from "@/services/compliance";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function RequirementsLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequirement, setSelectedRequirement] = useState<RegulatoryRequirement | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { data: requirements, isLoading } = useQuery({
    queryKey: ['regulatory-requirements'],
    queryFn: complianceService.getRequirements,
  });

  const filteredRequirements = requirements?.filter(requirement => 
    requirement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    requirement.reference_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    requirement.summary?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getJurisdictionBadge = (jurisdiction: string) => {
    switch (jurisdiction) {
      case 'Federal':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Federal</Badge>;
      case 'Estadual':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Estadual</Badge>;
      case 'Municipal':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Municipal</Badge>;
      default:
        return <Badge variant="secondary">{jurisdiction}</Badge>;
    }
  };

  const handleViewDetails = (requirement: RegulatoryRequirement) => {
    setSelectedRequirement(requirement);
    setShowDetailsModal(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando requisitos regulatórios...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Matriz Regulatória</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar requisitos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRequirements.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {requirements?.length === 0 
                  ? "Nenhum requisito regulatório mapeado ainda." 
                  : "Nenhum requisito encontrado com o termo de busca."
                }
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requisito</TableHead>
                    <TableHead>Código de Referência</TableHead>
                    <TableHead>Jurisdição</TableHead>
                    <TableHead>Resumo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequirements.map((requirement) => (
                    <TableRow key={requirement.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{requirement.title}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            Mapeado em {format(new Date(requirement.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {requirement.reference_code ? (
                          <Badge variant="outline" className="font-mono text-xs">
                            {requirement.reference_code}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getJurisdictionBadge(requirement.jurisdiction)}
                      </TableCell>
                      <TableCell>
                        {requirement.summary ? (
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {requirement.summary}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(requirement)}
                          >
                            Ver Detalhes
                          </Button>
                          {requirement.source_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(requirement.source_url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Requirement Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              {selectedRequirement?.title}
            </DialogTitle>
            <DialogDescription>
              Detalhes do requisito regulatório
            </DialogDescription>
          </DialogHeader>

          {selectedRequirement && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                {getJurisdictionBadge(selectedRequirement.jurisdiction)}
                {selectedRequirement.reference_code && (
                  <Badge variant="outline" className="font-mono">
                    {selectedRequirement.reference_code}
                  </Badge>
                )}
              </div>

              {selectedRequirement.summary && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Resumo</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedRequirement.summary}
                  </p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Data de Mapeamento:</span>
                  <p className="text-muted-foreground">
                    {format(new Date(selectedRequirement.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
                
                {selectedRequirement.updated_at !== selectedRequirement.created_at && (
                  <div>
                    <span className="font-medium">Última Atualização:</span>
                    <p className="text-muted-foreground">
                      {format(new Date(selectedRequirement.updated_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>

              {selectedRequirement.source_url && (
                <div className="pt-4">
                  <Button
                    onClick={() => window.open(selectedRequirement.source_url, '_blank')}
                    className="w-full"
                    variant="outline"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Acessar Fonte Original
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}