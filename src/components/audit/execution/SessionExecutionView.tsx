import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, CheckCircle, Circle, AlertTriangle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuditResponses } from "@/hooks/audit/useExecution";
import { ItemResponseModal } from "./ItemResponseModal";
import { OccurrenceModal } from "./OccurrenceModal";

interface SessionExecutionViewProps {
  session: {
    id: string;
    name: string;
    audit_id: string;
    total_items?: number | null;
    responded_items?: number | null;
  };
  companyId: string;
  onBack: () => void;
  defaultResponseTypeId?: string;
}

export function SessionExecutionView({
  session,
  companyId,
  onBack,
  defaultResponseTypeId,
}: SessionExecutionViewProps) {
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [occurrenceModalOpen, setOccurrenceModalOpen] = useState(false);
  const [occurrenceSessionItemId, setOccurrenceSessionItemId] = useState<string | null>(null);

  // Fetch session items
  const { data: sessionItems, isLoading: loadingItems } = useQuery({
    queryKey: ['session-items', session.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_session_items')
        .select('*')
        .eq('session_id', session.id)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch all responses for this audit
  const { data: responses } = useAuditResponses(session.audit_id);

  // Create a set of responded item IDs
  const respondedItemIds = new Set(responses?.map(r => r.session_item_id) || []);

  const handleItemClick = (index: number) => {
    setSelectedItemIndex(index);
  };

  const handleCreateOccurrence = (sessionItemId: string) => {
    setOccurrenceSessionItemId(sessionItemId);
    setOccurrenceModalOpen(true);
  };

  if (loadingItems) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold">{session.name}</h2>
          <p className="text-sm text-muted-foreground">
            {session.responded_items || 0} de {session.total_items || 0} itens respondidos
          </p>
        </div>
      </div>

      {/* Items List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Itens da Sessão</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="divide-y">
              {sessionItems?.map((item, index) => {
                const itemData = item.item_snapshot as any || {};
                const isResponded = respondedItemIds.has(item.id);

                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleItemClick(index)}
                  >
                    <div className="mt-0.5">
                      {isResponded ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="font-mono text-xs">
                          {itemData.item_number || `#${index + 1}`}
                        </Badge>
                        {isResponded && (
                          <Badge variant="secondary" className="text-xs">
                            Respondido
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-medium text-sm">{itemData.title || 'Item sem título'}</h4>
                      {itemData.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {itemData.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Response Modal */}
      {selectedItemIndex !== null && sessionItems && (
        <ItemResponseModal
          open={selectedItemIndex !== null}
          onOpenChange={(open) => !open && setSelectedItemIndex(null)}
          auditId={session.audit_id}
          companyId={companyId}
          sessionItems={sessionItems}
          currentIndex={selectedItemIndex}
          onNavigate={setSelectedItemIndex}
          onCreateOccurrence={handleCreateOccurrence}
          responseTypeId={defaultResponseTypeId}
        />
      )}

      {/* Occurrence Modal */}
      <OccurrenceModal
        open={occurrenceModalOpen}
        onOpenChange={setOccurrenceModalOpen}
        auditId={session.audit_id}
        companyId={companyId}
        sessionId={session.id}
        sessionItemId={occurrenceSessionItemId || undefined}
      />
    </div>
  );
}
