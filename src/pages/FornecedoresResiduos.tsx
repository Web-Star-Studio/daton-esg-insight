import { MainLayout } from "@/components/MainLayout"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getWasteSuppliers, WasteSupplier } from "@/services/wasteSuppliers"
import { SupplierComplianceTable } from "@/components/SupplierComplianceTable"
import { WasteSupplierModal } from "@/components/WasteSupplierModal"
import { useToast } from "@/hooks/use-toast"

const FornecedoresResiduos = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<WasteSupplier | null>(null)
  const { toast } = useToast()

  const { data: suppliers = [], isLoading, refetch } = useQuery({
    queryKey: ['waste-suppliers'],
    queryFn: () => getWasteSuppliers(),
  })

  const handleSupplierSelect = (supplier: WasteSupplier) => {
    setSelectedSupplier(supplier)
    setIsModalOpen(true)
  }

  const handleCreateNew = () => {
    setSelectedSupplier(null)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedSupplier(null)
    refetch()
  }

  const handleSuccess = () => {
    toast({
      title: "Sucesso!",
      description: selectedSupplier 
        ? "Fornecedor atualizado com sucesso." 
        : "Fornecedor cadastrado com sucesso.",
    })
    handleModalClose()
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Fornecedores de Resíduos</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie transportadores e destinadores com controle de licenças
            </p>
          </div>
          <Button onClick={handleCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Fornecedor
          </Button>
        </div>

        {/* Suppliers Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Carregando fornecedores...</div>
          </div>
        ) : (
          <SupplierComplianceTable 
            suppliers={suppliers}
            onSupplierSelect={handleSupplierSelect}
          />
        )}

        {/* Modal */}
        <WasteSupplierModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          supplier={selectedSupplier}
          onSuccess={handleSuccess}
        />
      </div>
    </MainLayout>
  )
}

export default FornecedoresResiduos