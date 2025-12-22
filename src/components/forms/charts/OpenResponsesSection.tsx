import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MessageSquare, User, Calendar } from "lucide-react";

interface OpenResponse {
  text: string;
  date: string;
  user?: string;
}

interface OpenResponsesSectionProps {
  fieldLabel: string;
  responses: OpenResponse[];
}

export function OpenResponsesSection({ fieldLabel, responses }: OpenResponsesSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredResponses = responses.filter(response =>
    response.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            {fieldLabel}
          </CardTitle>
          <Badge variant="secondary">{responses.length} respostas</Badge>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar nas respostas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {filteredResponses.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchTerm ? 'Nenhuma resposta encontrada para a busca' : 'Nenhuma resposta disponível'}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {filteredResponses.map((response, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {response.text}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    {response.user && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {response.user}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(response.date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
