import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, BookOpen, CheckCircle2, Info } from "lucide-react";
import { useISORequirements } from "@/hooks/useISORequirements";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ISOStandardType } from "@/services/isoRequirements";

const STANDARDS = [
  { id: 'ISO_9001' as ISOStandardType, label: 'ISO 9001:2015', description: 'Sistema de Gestão da Qualidade', color: 'bg-blue-500' },
  { id: 'ISO_14001' as ISOStandardType, label: 'ISO 14001:2015', description: 'Sistema de Gestão Ambiental', color: 'bg-green-500' },
  { id: 'ISO_45001' as ISOStandardType, label: 'ISO 45001:2018', description: 'Saúde e Segurança Ocupacional', color: 'bg-orange-500' },
  { id: 'ISO_39001' as ISOStandardType, label: 'ISO 39001:2012', description: 'Segurança Viária', color: 'bg-purple-500' },
];

export function ISORequirementsLibrary() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStandard, setSelectedStandard] = useState<ISOStandardType>('ISO_9001');
  const { requirements, isLoading } = useISORequirements(selectedStandard);

  const filteredRequirements = requirements?.filter(req => 
    req.clause_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.clause_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStandardColor = (standard: string) => {
    return STANDARDS.find(s => s.id === standard)?.color || 'bg-gray-500';
  };

  if (isLoading) {
    return <div className="p-6">Carregando requisitos ISO...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            Biblioteca de Requisitos ISO
          </h2>
          <p className="text-muted-foreground">
            Consulte requisitos normativos para planejamento de auditorias
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cláusula, título ou conteúdo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs value={selectedStandard} onValueChange={(v) => setSelectedStandard(v as ISOStandardType)}>
        <TabsList className="grid w-full grid-cols-4">
          {STANDARDS.map((standard) => (
            <TabsTrigger key={standard.id} value={standard.id}>
              {standard.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {STANDARDS.map((standard) => (
          <TabsContent key={standard.id} value={standard.id} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded ${standard.color}`} />
                  <div>
                    <CardTitle>{standard.label}</CardTitle>
                    <CardDescription>{standard.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredRequirements && filteredRequirements.length > 0 ? (
                  <>
                    <div className="mb-4 text-sm text-muted-foreground">
                      {filteredRequirements.length} {filteredRequirements.length === 1 ? 'requisito encontrado' : 'requisitos encontrados'}
                    </div>
                    <Accordion type="single" collapsible className="w-full">
                      {filteredRequirements.map((req) => (
                        <AccordionItem key={req.id} value={req.id}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-start gap-3 text-left">
                              <Badge variant="outline" className="font-mono">
                                {req.clause_number}
                              </Badge>
                              <div className="flex-1">
                                <div className="font-semibold">{req.clause_title}</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {req.description.substring(0, 100)}...
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 pt-4 pl-4">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Info className="h-4 w-4 text-primary" />
                                  <h4 className="font-semibold">Descrição</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">{req.description}</p>
                              </div>

                              {req.guidance_notes && (
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <h4 className="font-semibold">Orientações</h4>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{req.guidance_notes}</p>
                                </div>
                              )}

                              {req.evidence_examples && req.evidence_examples.length > 0 && (
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <BookOpen className="h-4 w-4 text-blue-500" />
                                    <h4 className="font-semibold">Exemplos de Evidências</h4>
                                  </div>
                                  <ul className="list-disc list-inside space-y-1">
                                    {req.evidence_examples.map((example, idx) => (
                                      <li key={idx} className="text-sm text-muted-foreground">
                                        {example}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Nenhum requisito encontrado</h3>
                    <p className="text-muted-foreground">
                      {searchTerm ? 'Tente ajustar sua busca.' : 'Aguardando carregamento...'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
