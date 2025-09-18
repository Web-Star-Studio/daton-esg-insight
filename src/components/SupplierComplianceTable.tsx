import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertTriangle, CheckCircle, Clock, Search, FileText, Phone, Mail, Calendar } from "lucide-react"
import { WasteSupplier, formatSupplierType } from "@/services/wasteSuppliers"
import { format, differenceInDays, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

interface SupplierComplianceTableProps {
  suppliers: WasteSupplier[]
  onSupplierSelect?: (supplier: WasteSupplier) => void
}

export const SupplierComplianceTable = ({ suppliers, onSupplierSelect }: SupplierComplianceTableProps) => {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.cnpj || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.supplier_type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getComplianceStatus = (supplier: WasteSupplier) => {
    if (!supplier.license_expiry) return "no-license"
    
    const expiryDate = parseISO(supplier.license_expiry)
    const daysUntilExpiry = differenceInDays(expiryDate, new Date())
    
    if (daysUntilExpiry < 0) return "expired"
    if (daysUntilExpiry <= 30) return "expiring"
    if (daysUntilExpiry <= 90) return "warning"
    return "compliant"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "compliant":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Conforme
          </Badge>
        )
      case "warning":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            Atenção
          </Badge>
        )
      case "expiring":
        return (
          <Badge variant="destructive" className="bg-orange-100 text-orange-800 border-orange-300">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Vencendo
          </Badge>
        )
      case "expired":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Vencida
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            <FileText className="h-3 w-3 mr-1" />
            Sem Licença
          </Badge>
        )
    }
  }

  const getDaysText = (supplier: WasteSupplier) => {
    if (!supplier.license_expiry) return "N/A"
    
    const expiryDate = parseISO(supplier.license_expiry)
    const daysUntilExpiry = differenceInDays(expiryDate, new Date())
    
    if (daysUntilExpiry < 0) return `${Math.abs(daysUntilExpiry)} dias vencida`
    if (daysUntilExpiry === 0) return "Vence hoje"
    return `${daysUntilExpiry} dias`
  }

  // Compliance Statistics
  const stats = {
    total: suppliers.length,
    compliant: suppliers.filter(s => getComplianceStatus(s) === "compliant").length,
    warning: suppliers.filter(s => ["warning", "expiring"].includes(getComplianceStatus(s))).length,
    expired: suppliers.filter(s => getComplianceStatus(s) === "expired").length,
    noLicense: suppliers.filter(s => getComplianceStatus(s) === "no-license").length,
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Conformidade de Fornecedores
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar fornecedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
        </div>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.compliant}</div>
            <div className="text-xs text-muted-foreground">Conformes</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{stats.warning}</div>
            <div className="text-xs text-muted-foreground">Atenção</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <div className="text-xs text-muted-foreground">Vencidas</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{stats.noLicense}</div>
            <div className="text-xs text-muted-foreground">Sem Licença</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Licença</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "Nenhum fornecedor encontrado" : "Nenhum fornecedor cadastrado"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSuppliers.map((supplier) => {
                  const status = getComplianceStatus(supplier)
                  return (
                    <TableRow key={supplier.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <div className="font-medium">{supplier.company_name}</div>
                          <div className="text-sm text-muted-foreground">{supplier.cnpj}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{formatSupplierType(supplier.supplier_type)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {supplier.contact_email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              {supplier.contact_email}
                            </div>
                          )}
                          {supplier.contact_phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {supplier.contact_phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {supplier.license_number ? (
                          <div>
                            <div className="font-mono text-sm">{supplier.license_number}</div>
                            {supplier.license_expiry && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(parseISO(supplier.license_expiry), "dd/MM/yyyy", { locale: ptBR })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Não informada</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {getDaysText(supplier)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSupplierSelect?.(supplier)}
                        >
                          Ver Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}