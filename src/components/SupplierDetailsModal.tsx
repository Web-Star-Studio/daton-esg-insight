import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  Calendar,
  FileText,
  Award,
  TrendingUp,
  Edit
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Supplier, SupplierEvaluation } from "@/services/supplierService";
import { SupplierEditModal } from "./SupplierEditModal";

interface SupplierDetailsModalProps {
  supplier: Supplier | null;
  isOpen: boolean;
  onClose: () => void;
  onSupplierUpdate: () => void;
}

export function SupplierDetailsModal({ 
  supplier, 
  isOpen, 
  onClose, 
  onSupplierUpdate 
}: SupplierDetailsModalProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  if (!supplier) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ativo": return "bg-green-100 text-green-800";
      case "Inativo": return "bg-red-100 text-red-800";
      case "Suspenso": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getQualificationColor = (status: string) => {
    switch (status) {
      case "Qualificado": return "bg-green-100 text-green-800";
      case "Em Qualificação": return "bg-blue-100 text-blue-800";
      case "Re-qualificação": return "bg-yellow-100 text-yellow-800";
      case "Desqualificado": return "bg-red-100 text-red-800";
      case "Não Qualificado": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) 
            ? "fill-yellow-400 text-yellow-400" 
            : "text-gray-300"
        }`}
      />
    ));
  };

  const handleEditSuccess = () => {
    setIsEditOpen(false);
    onSupplierUpdate();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {supplier.name}
              </DialogTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <Badge className={getStatusColor(supplier.status)}>
                        {supplier.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Qualificação</p>
                      <Badge className={getQualificationColor(supplier.qualification_status)}>
                        {supplier.qualification_status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avaliação</p>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {getRatingStars(supplier.rating || 0)}
                        </div>
                        <span className="text-sm font-medium">
                          {supplier.rating ? supplier.rating.toFixed(1) : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="evaluations">Avaliações</TabsTrigger>
                <TabsTrigger value="contracts">Contratos</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Informações Básicas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Nome da Empresa</p>
                        <p className="text-sm">{supplier.name}</p>
                      </div>
                      {supplier.cnpj && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">CNPJ</p>
                          <p className="text-sm font-mono">{supplier.cnpj}</p>
                        </div>
                      )}
                      {supplier.category && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Categoria</p>
                          <Badge variant="outline">{supplier.category}</Badge>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Cadastrado em</p>
                        <p className="text-sm">
                          {format(new Date(supplier.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contact Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Contato
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {supplier.contact_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{supplier.contact_email}</span>
                        </div>
                      )}
                      {supplier.contact_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{supplier.contact_phone}</span>
                        </div>
                      )}
                      {supplier.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <span className="text-sm">{supplier.address}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Notes */}
                {supplier.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Observações
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{supplier.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="evaluations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Histórico de Avaliações
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {supplier.supplier_evaluations && supplier.supplier_evaluations.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Qualidade</TableHead>
                            <TableHead>Entrega</TableHead>
                            <TableHead>Atendimento</TableHead>
                            <TableHead>Geral</TableHead>
                            <TableHead>Comentários</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {supplier.supplier_evaluations.map((evaluation: SupplierEvaluation) => (
                            <TableRow key={evaluation.id}>
                              <TableCell>
                                {format(new Date(evaluation.evaluation_date), "dd/MM/yyyy", { locale: ptBR })}
                              </TableCell>
                              <TableCell>{evaluation.quality_score.toFixed(1)}</TableCell>
                              <TableCell>{evaluation.delivery_score.toFixed(1)}</TableCell>
                              <TableCell>{evaluation.service_score.toFixed(1)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{evaluation.overall_score.toFixed(1)}</span>
                                  <div className="flex">
                                    {getRatingStars(evaluation.overall_score)}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {evaluation.comments || "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma avaliação registrada</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contracts" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Contratos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Sistema de contratos em desenvolvimento</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Indicadores de Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Indicadores de performance em desenvolvimento</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <SupplierEditModal
        supplier={supplier}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}