import { useState } from "react";
import { Plus, Pencil, Trash2, Calendar, Clock, MapPin, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AuditFormData, SessionFormData } from "./AuditCreationWizard";
import { SessionFormDialog } from "./SessionFormDialog";

interface WizardStepSessionsProps {
  formData: AuditFormData;
  onUpdate: (data: Partial<AuditFormData>) => void;
}

export function WizardStepSessions({ formData, onUpdate }: WizardStepSessionsProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const handleAddSession = () => {
    setEditingIndex(null);
    setFormOpen(true);
  };

  const handleEditSession = (index: number) => {
    setEditingIndex(index);
    setFormOpen(true);
  };

  const handleSaveSession = (session: SessionFormData) => {
    const newSessions = [...formData.sessions];
    if (editingIndex !== null) {
      newSessions[editingIndex] = session;
    } else {
      newSessions.push(session);
    }
    onUpdate({ sessions: newSessions });
    setFormOpen(false);
    setEditingIndex(null);
  };

  const handleDeleteSession = () => {
    if (deleteIndex !== null) {
      const newSessions = formData.sessions.filter((_, i) => i !== deleteIndex);
      onUpdate({ sessions: newSessions });
      setDeleteIndex(null);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("pt-BR");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Sessões de Auditoria</h4>
          <p className="text-sm text-muted-foreground">
            Organize a auditoria em sessões (opcional)
          </p>
        </div>
        <Button onClick={handleAddSession} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Sessão
        </Button>
      </div>

      {formData.sessions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              Nenhuma sessão configurada.<br />
              Você pode criar sessões agora ou depois.
            </p>
            <Button variant="outline" onClick={handleAddSession}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Sessão
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {formData.sessions.map((session, index) => (
            <Card key={index} className="group">
              <CardHeader className="py-3 px-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground mt-0.5 opacity-0 group-hover:opacity-100 cursor-grab" />
                    <div>
                      <CardTitle className="text-sm font-medium">
                        {session.name}
                      </CardTitle>
                      {session.description && (
                        <CardDescription className="text-xs mt-1 line-clamp-1">
                          {session.description}
                        </CardDescription>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {session.session_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(session.session_date)}
                          </span>
                        )}
                        {session.start_time && session.end_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {session.start_time} - {session.end_time}
                          </span>
                        )}
                        {session.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {session.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {session.item_ids.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {session.item_ids.length} itens
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditSession(index)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setDeleteIndex(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <SessionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        session={editingIndex !== null ? formData.sessions[editingIndex] : undefined}
        standardIds={formData.standard_ids}
        onSave={handleSaveSession}
      />

      <AlertDialog open={deleteIndex !== null} onOpenChange={() => setDeleteIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Sessão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta sessão?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSession} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
