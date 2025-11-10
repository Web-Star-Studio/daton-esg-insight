import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function SDGIntroductionCard() {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-2xl">
              🌍 Objetivos de Desenvolvimento Sustentável (ODS)
              <Badge variant="secondary" className="ml-2">Agenda 2030 - ONU</Badge>
            </CardTitle>
            <CardDescription className="text-base">
              Integre os ODS à sua estratégia de gestão e sustentabilidade
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sobre os ODS */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
              <Info className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-lg">O que são os ODS?</h3>
              <p className="text-muted-foreground leading-relaxed">
                A Agenda 2030 da ONU estabelece <strong>17 Objetivos de Desenvolvimento Sustentável (ODS)</strong> como 
                um plano de ação global para acabar com a pobreza, proteger o planeta e garantir que todas as pessoas 
                tenham paz e prosperidade até 2030. Os ODS são compostos por <strong>169 metas específicas</strong> que 
                orientam governos, empresas e sociedade civil.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline" className="bg-primary/5">17 Objetivos Globais</Badge>
                <Badge variant="outline" className="bg-primary/5">169 Metas Específicas</Badge>
                <Badge variant="outline" className="bg-primary/5">193 Países Signatários</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Sobre o Pacto Global */}
        <div className="border-t pt-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-2xl">🤝</span>
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-lg">Pacto Global da ONU</h3>
              <p className="text-muted-foreground leading-relaxed">
                O Pacto Global é a maior iniciativa de sustentabilidade corporativa do mundo. Encoraja empresas a 
                alinhar estratégias e operações com <strong>10 princípios universais</strong> nas áreas de:
              </p>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <span className="text-xl">👥</span>
                  <div>
                    <p className="font-medium text-sm">Direitos Humanos</p>
                    <p className="text-xs text-muted-foreground">Princípios 1-2</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <span className="text-xl">💼</span>
                  <div>
                    <p className="font-medium text-sm">Trabalho</p>
                    <p className="text-xs text-muted-foreground">Princípios 3-6</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <span className="text-xl">🌱</span>
                  <div>
                    <p className="font-medium text-sm">Meio Ambiente</p>
                    <p className="text-xs text-muted-foreground">Princípios 7-9</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <span className="text-xl">⚖️</span>
                  <div>
                    <p className="font-medium text-sm">Anticorrupção</p>
                    <p className="text-xs text-muted-foreground">Princípio 10</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="border-t pt-6">
          <div className="bg-primary/5 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <span className="text-xl">🎯</span>
              Como usar este módulo
            </h4>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>Selecione os ODS prioritários para sua organização</li>
              <li>Escolha as metas específicas que sua empresa contribui</li>
              <li>Documente ações realizadas e resultados alcançados</li>
              <li>Adicione evidências e indicadores de progresso</li>
              <li>O sistema gerará automaticamente o texto para seu relatório GRI</li>
            </ol>
          </div>
        </div>

        {/* Links úteis */}
        <div className="flex flex-wrap gap-3 pt-4 border-t">
          <Button variant="outline" size="sm" asChild>
            <a href="https://brasil.un.org/pt-br/sdgs" target="_blank" rel="noopener noreferrer" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Conheça os 17 ODS
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="https://www.pactoglobal.org.br/" target="_blank" rel="noopener noreferrer" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Sobre o Pacto Global
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="https://www.globalreporting.org/standards/standards-development/sector-standard-for-oil-and-gas/sdg-mapping/" target="_blank" rel="noopener noreferrer" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              ODS e GRI Standards
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
