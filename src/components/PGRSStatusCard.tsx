import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FileText, Plus, Calendar, Target, AlertTriangle } from "lucide-react"
import { useState } from "react"
import PGRSWizard from "./PGRSWizard"

interface PGRSStatus {
  id?: string
  plan_name: string
  status: string // Changed from specific union to string
  creation_date?: Date
  next_review_date?: Date
  completion_percentage?: number
  goals_count?: number
  procedures_count?: number
  sources_count?: number
}

interface PGRSStatusCardProps {
  pgrsStatus?: PGRSStatus | null
  onUpdate?: () => void
}

export default function PGRSStatusCard({ pgrsStatus, onUpdate }: PGRSStatusCardProps) {
  const [showWizard, setShowWizard] = useState(false)

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Ativo':
        return 'success'
      case 'Vencido':
        return 'destructive'
      case 'Em Desenvolvimento':
        return 'warning'
      case 'Em Revisão':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo':
        return 'bg-success/10 text-success border-success/20'
      case 'Vencido':
        return 'bg-destructive/10 text-destructive border-destructive/20'
      case 'Em Desenvolvimento':
        return 'bg-warning/10 text-warning border-warning/20'
      case 'Em Revisão':
        return 'bg-secondary/10 text-secondary border-secondary/20'
      default:
        return 'bg-secondary/10 text-secondary border-secondary/20'
    }
  }

  const formatDate = (date?: Date) => {
    if (!date) return 'N/A'
    return new Intl.DateTimeFormat('pt-BR').format(date)
  }

  const isOverdue = (date?: Date) => {
    if (!date) return false
    return date < new Date()
  }

  if (!pgrsStatus) {
    return (
      <>
        <Card className="shadow-card border-dashed border-2 border-muted-foreground/20">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum PGRS Cadastrado
            </h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Crie seu Plano de Gerenciamento de Resíduos Sólidos para organizar 
              e otimizar a gestão dos resíduos de sua empresa.
            </p>
            <Button onClick={() => setShowWizard(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar PGRS
            </Button>
          </CardContent>
        </Card>

        <PGRSWizard 
          open={showWizard}
          onOpenChange={setShowWizard}
          onSuccess={() => {
            onUpdate?.()
            setShowWizard(false)
          }}
        />
      </>
    )
  }

  return (
    <>
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5" />
              PGRS - Plano Ativo
            </CardTitle>
            <Badge 
              variant="outline" 
              className={getStatusColor(pgrsStatus.status)}
            >
              {pgrsStatus.status}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-foreground mb-1">{pgrsStatus.plan_name}</h4>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Criado em {formatDate(pgrsStatus.creation_date)}
              </span>
              {pgrsStatus.next_review_date && (
                <span className={`flex items-center gap-1 ${isOverdue(pgrsStatus.next_review_date) ? 'text-destructive' : ''}`}>
                  {isOverdue(pgrsStatus.next_review_date) && <AlertTriangle className="w-3 h-3" />}
                  Revisão em {formatDate(pgrsStatus.next_review_date)}
                </span>
              )}
            </div>
          </div>

          {/* Progress do plano */}
          {typeof pgrsStatus.completion_percentage === 'number' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completude do Plano</span>
                <span className="font-medium">{pgrsStatus.completion_percentage}%</span>
              </div>
              <Progress value={pgrsStatus.completion_percentage} className="h-2" />
            </div>
          )}

          {/* Estatísticas rápidas */}
          <div className="flex items-center gap-4 text-sm">
            {typeof pgrsStatus.sources_count === 'number' && (
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                {pgrsStatus.sources_count} Fontes
              </span>
            )}
            {typeof pgrsStatus.procedures_count === 'number' && (
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-secondary rounded-full"></div>
                {pgrsStatus.procedures_count} Procedimentos
              </span>
            )}
            {typeof pgrsStatus.goals_count === 'number' && (
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                {pgrsStatus.goals_count} Metas
              </span>
            )}
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm">
              <FileText className="w-3 h-3 mr-1" />
              Ver Relatório
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowWizard(true)}>
              Editar Plano
            </Button>
          </div>
        </CardContent>
      </Card>

      <PGRSWizard 
        open={showWizard}
        onOpenChange={setShowWizard}
        onSuccess={() => {
          onUpdate?.()
          setShowWizard(false)
        }}
      />
    </>
  )
}