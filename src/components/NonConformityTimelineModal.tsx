import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, User, FileText, CheckCircle, AlertTriangle } from "lucide-react";

interface TimelineEntry {
  id: string;
  action_type: string;
  action_description: string;
  created_at: string;
  user_id: string;
  old_values?: any;
  new_values?: any;
  attachments?: any[];
}

interface NonConformityTimelineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nonConformityId: string;
}

export function NonConformityTimelineModal({ 
  open, 
  onOpenChange, 
  nonConformityId 
}: NonConformityTimelineModalProps) {
  const { data: timeline, isLoading } = useQuery({
    queryKey: ["nc-timeline", nonConformityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("non_conformity_timeline")
        .select(`
          *,
          profiles:user_id(full_name)
        `)
        .eq("non_conformity_id", nonConformityId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as any[];
    },
    enabled: open && !!nonConformityId,
  });

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "created":
        return <FileText className="h-4 w-4" />;
      case "status_changed":
        return <Clock className="h-4 w-4" />;
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "updated":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case "created":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "status_changed":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "updated":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Linha do Tempo da Não Conformidade</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
              
              {timeline?.map((entry, index) => (
                <div key={entry.id} className="relative flex items-start space-x-4 pb-6">
                  {/* Timeline dot */}
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                      {getActionIcon(entry.action_type)}
                    </div>
                  </div>
                  
                  {/* Timeline content */}
                  <Card className="flex-1">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={getActionColor(entry.action_type)}>
                          {entry.action_description}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-3">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {entry.profiles?.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {entry.profiles?.full_name || "Usuário"}
                        </span>
                      </div>

                      {entry.action_type === "status_changed" && entry.old_values && entry.new_values && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-muted-foreground">Status anterior:</span>
                            <Badge variant="outline" className="ml-2">
                              {entry.old_values.status}
                            </Badge>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Novo status:</span>
                            <Badge variant="outline" className="ml-2">
                              {entry.new_values.status}
                            </Badge>
                          </div>
                        </div>
                      )}

                      {entry.attachments && entry.attachments.length > 0 && (
                        <>
                          <Separator className="my-2" />
                          <div className="text-sm">
                            <span className="font-medium">Anexos: </span>
                            <span className="text-muted-foreground">
                              {entry.attachments.length} arquivo(s)
                            </span>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}