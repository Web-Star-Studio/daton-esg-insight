import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, User, Calendar, Hash } from "lucide-react";

export function LAIAMetodologia() {
  return (
    <div className="space-y-6">
      {/* Document Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="text-xl">Metodologia — Levantamento e Avaliação dos Aspectos e Impactos Ambientais</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Procedimento Ambiental</p>
              </div>
            </div>
            <Badge variant="outline" className="text-sm px-3 py-1 w-fit font-mono">
              FPLAN-002
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Elaboração</p>
                <p className="font-medium">Katia Huesken — Consultor</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Aprovação</p>
                <p className="font-medium">Aline Pivotto — Coord. SGI</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Data</p>
                <p className="font-medium">05/09/2023</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Revisão</p>
                <p className="font-medium">10</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Sections */}
      <Accordion type="multiple" defaultValue={["procedimento"]} className="space-y-2">
        {/* 1 - Objetivo */}
        <AccordionItem value="objetivo" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="flex items-center gap-2 font-semibold">
              <Badge variant="secondary" className="text-xs">1</Badge>
              Objetivo
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Definir uma sistemática para o Levantamento e Avaliação dos Aspectos e Impactos Ambientais a serem geridos pelo Sistema de Gestão Integrado.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* 2 - Aplicação */}
        <AccordionItem value="aplicacao" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="flex items-center gap-2 font-semibold">
              <Badge variant="secondary" className="text-xs">2</Badge>
              Aplicação
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Aplica-se a todas as atividades, produtos e serviços da organização.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* 3 - Generalidades */}
        <AccordionItem value="generalidades" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="flex items-center gap-2 font-semibold">
              <Badge variant="secondary" className="text-xs">3</Badge>
              Generalidades
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground italic">Não se aplica.</p>
          </AccordionContent>
        </AccordionItem>

        {/* 4 - Responsabilidades */}
        <AccordionItem value="responsabilidades" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="flex items-center gap-2 font-semibold">
              <Badge variant="secondary" className="text-xs">4</Badge>
              Responsabilidades
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              As responsabilidades estão estabelecidas conforme detalhamento do item 5) Procedimento.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* 5 - Procedimento */}
        <AccordionItem value="procedimento" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="flex items-center gap-2 font-semibold">
              <Badge variant="secondary" className="text-xs">5</Badge>
              Procedimento
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Este procedimento inicia-se verificando os processos/atividades/tarefas a ser avaliado, levando em conta as informações que se tenha autonomia, direção e responsabilidade. Adicionalmente e com a finalidade de cobrir todos os aspectos inerentes a gestão de risco, deverá levar em conta também:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
              <li>As atividades rotineiras e não rotineiras.</li>
              <li>As atividades de todas as pessoas que tenham acesso ao lugar de trabalho (incluindo subcontratadas e visitas).</li>
              <li>O comportamento humano, as capacidades e outros fatores humanos.</li>
              <li>Aspectos originados nas imediações e fora do local de trabalho que pudessem ser colocados sob controle da organização.</li>
              <li>Infraestrutura, equipamentos e materiais.</li>
              <li>As modificações ou propostas de mudança na organização, suas atividades e materiais.</li>
            </ul>

            {/* 5.1 - Modelo de Planilha */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Badge variant="outline" className="text-xs">5.1</Badge>
                Modelo de Planilha de Levantamento dos Aspectos e Impactos Ambientais
              </h4>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Identificação</TableHead>
                      <TableHead className="font-semibold">Caracterização</TableHead>
                      <TableHead className="font-semibold">Verificação de Importância</TableHead>
                      <TableHead className="font-semibold">Avaliação de Significância</TableHead>
                      <TableHead className="font-semibold">Observações / Ciclo de Vida</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-xs text-muted-foreground">Cod Set, Cod Asp/Imp, Atividade, Aspecto, Impacto</TableCell>
                      <TableCell className="text-xs text-muted-foreground">Temporalidade, Situação Operacional, Incidência, Classe</TableCell>
                      <TableCell className="text-xs text-muted-foreground">Abrangência, Consequência, Freq/Prob, Soma, Categoria</TableCell>
                      <TableCell className="text-xs text-muted-foreground">Req. Legais, DPI, OE, Enquadramento</TableCell>
                      <TableCell className="text-xs text-muted-foreground">Controles, Link Legislação, Estágios, Saídas</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* 5.2 - Explicativo de Preenchimento */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Badge variant="outline" className="text-xs">5.2</Badge>
                Explicativo sobre o preenchimento da Planilha
              </h4>

              <Accordion type="multiple" className="space-y-1">
                {/* Identificação */}
                <AccordionItem value="identificacao" className="border rounded-md px-3">
                  <AccordionTrigger className="hover:no-underline text-sm py-3">Identificação</AccordionTrigger>
                  <AccordionContent className="space-y-4 text-sm text-muted-foreground">
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-foreground">Cod Set</p>
                        <p className="text-xs text-muted-foreground mb-1">Responsável: Coordenadora de SGI</p>
                        <p>Código do setor para facilitar identificação. (Ex: 1 = Produção; 2 = Administrativo; 3 = Refeitório)</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Cod Asp/Imp</p>
                        <p className="text-xs text-muted-foreground mb-1">Responsável: Coordenadora de SGI</p>
                        <p>Código do setor.aspecto para facilitar a rastreabilidade pela sequência (Ex: 1.01 / 1.02)</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Atividade / Operação</p>
                        <p className="text-xs text-muted-foreground mb-1">Responsável: Coordenadora de SGI</p>
                        <p>Atividade, Área ou Processo que o Aspecto Ambiental ocorre.</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Aspectos Ambientais</p>
                        <p className="text-xs text-muted-foreground mb-1">Responsável: Coordenadora de SGI</p>
                        <p>Elemento de Atividades, produtos ou serviços que pode interagir com o meio ambiente.</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Impactos Ambientais</p>
                        <p className="text-xs text-muted-foreground mb-1">Responsável: Coordenadora de SGI</p>
                        <p>Modificação do meio ambiente, adversa ou benéfica, que resulte, no todo ou em parte, das atividades, produtos e serviços.</p>
                        <p className="text-xs mt-1 italic">OBS: Um aspecto ambiental pode possuir mais de um impacto ambiental.</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Caracterização */}
                <AccordionItem value="caracterizacao" className="border rounded-md px-3">
                  <AccordionTrigger className="hover:no-underline text-sm py-3">Caracterização</AccordionTrigger>
                  <AccordionContent className="space-y-4 text-sm text-muted-foreground">
                    {/* Temporalidade */}
                    <div>
                      <p className="font-medium text-foreground mb-2">Temporalidade</p>
                      <p className="text-xs text-muted-foreground mb-2">Responsável: Coordenadora de SGI</p>
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>Temporalidade</TableHead>
                              <TableHead>Descrição</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">Passada (P)</TableCell>
                              <TableCell>Impacto ambiental identificado no presente, mas que foi causado por atividade desenvolvida no passado.</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Atual (A)</TableCell>
                              <TableCell>Impacto ambiental decorrente de atividade atual.</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Futura (F)</TableCell>
                              <TableCell>Impacto ambiental previsto, decorrente de futuras alterações de processo, aquisições de novos equipamentos, introdução de novas tecnologias.</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Situação Operacional */}
                    <div>
                      <p className="font-medium text-foreground mb-2">Situação Operacional</p>
                      <p className="text-xs text-muted-foreground mb-2">Responsável: Coordenadora de SGI</p>
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>Situação</TableHead>
                              <TableHead>Descrição</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">Normal (N)</TableCell>
                              <TableCell>Associados à rotina diária, inclusive manutenção.</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Anormal (A)</TableCell>
                              <TableCell>Associados a operações não rotineiras (reformas de instalações, paradas, manutenções, alterações em rotinas, motivos específicos).</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Emergência (E)</TableCell>
                              <TableCell>Associados a situações não planejadas, de emergências (vazamentos, derramamentos, colapso de estruturas, incêndios, explosões, etc) inerentes à atividade/operação que possam causar impacto ambiental.</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Incidência */}
                    <div>
                      <p className="font-medium text-foreground mb-2">Incidência</p>
                      <p className="text-xs text-muted-foreground mb-2">Responsável: Coordenadora de SGI</p>
                      <p className="mb-1">Caracterização dos aspectos/impactos ambientais de acordo com os critérios de incidência:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><strong>SC</strong> = Sob Controle da Empresa ou Direta</li>
                        <li><strong>SI</strong> = Sob Influência da Empresa ou Indireta</li>
                      </ul>
                    </div>

                    {/* Classe */}
                    <div>
                      <p className="font-medium text-foreground mb-2">Classe</p>
                      <p className="text-xs text-muted-foreground mb-2">Responsável: Coordenadora de SGI</p>
                      <p className="mb-1">Caracterização dos aspectos/impactos ambientais de acordo com o tipo de impacto:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><strong>B</strong> = Benéfico (resulta em melhoria nas características do meio ambiente).</li>
                        <li><strong>A</strong> = Adverso (resulta em prejuízo nas características do meio ambiente).</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Verificação de Importância */}
                <AccordionItem value="importancia" className="border rounded-md px-3">
                  <AccordionTrigger className="hover:no-underline text-sm py-3">Verificação de Importância</AccordionTrigger>
                  <AccordionContent className="space-y-4 text-sm text-muted-foreground">
                    {/* Abrangência / Consequência */}
                    <div>
                      <p className="font-medium text-foreground mb-2">Abrangência / Consequência</p>
                      <p className="text-xs text-muted-foreground mb-2">Responsável: Coordenadora de SGI</p>
                      <p className="mb-2">Para a Verificação de Importância dos aspectos/impactos ambientais, os níveis de Abrangência e Consequência devem ser avaliados.</p>
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>Abrangência</TableHead>
                              <TableHead>Severidade</TableHead>
                              <TableHead className="text-center">Pontos</TableHead>
                              <TableHead>Impactos / Descrição</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">Local</TableCell>
                              <TableCell>Baixa</TableCell>
                              <TableCell className="text-center font-mono">10</TableCell>
                              <TableCell>Impacto Ambiental potencial de magnitude desprezível. Degradação ambiental sem consequências para o negócio e para a imagem da empresa, totalmente reversível com ações de controle.</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium" rowSpan={2}>Regional</TableCell>
                              <TableCell>Baixa</TableCell>
                              <TableCell className="text-center font-mono">20</TableCell>
                              <TableCell>Destruição da camada de ozônio; chuva ácida; efeito estufa (aquecimento global); poluição do ar por veículos.</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Média</TableCell>
                              <TableCell className="text-center font-mono">40</TableCell>
                              <TableCell>Impacto Ambiental não enquadrável como baixa ou alta mas capaz de alterar a qualidade ambiental. Locais de despejo de resíduos sólidos; desmatamento; poluição da água por resíduos industriais; despejos de óleo; consumo de recursos naturais; vazamento de tanques para o subsolo; contaminação da água potável.</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Local</TableCell>
                              <TableCell>Alta</TableCell>
                              <TableCell className="text-center font-mono">60</TableCell>
                              <TableCell>Impacto potencial de grande magnitude. Degradação ambiental com consequências financeiras e de imagem irreversível mesmo com ações de controle.</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Frequência / Probabilidade */}
                    <div>
                      <p className="font-medium text-foreground mb-2">Frequência / Probabilidade</p>
                      <p className="text-xs text-muted-foreground mb-2">Responsável: Coordenadora de SGI</p>
                      <p className="mb-2">Os aspectos ambientais necessitam ser considerados quanto a sua Frequência quando a Situação for Normal ou Anormal, ou Probabilidade quando a Situação for de Emergência.</p>

                      <p className="font-medium text-foreground text-xs mb-1 mt-3">Tabela de Frequência</p>
                      <div className="rounded-md border overflow-hidden mb-3">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>Frequência</TableHead>
                              <TableHead>Descrição (Normal / Anormal)</TableHead>
                              <TableHead className="text-center">Pontos</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">Baixa</TableCell>
                              <TableCell>Ocorre menos de uma vez/mês; Reduzido número de aspectos ambientais associados ao impacto.</TableCell>
                              <TableCell className="text-center font-mono">10</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Média</TableCell>
                              <TableCell>Ocorre mais de uma vez/mês; Médio número de aspectos ambientais associados ao impacto.</TableCell>
                              <TableCell className="text-center font-mono">20</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Alta</TableCell>
                              <TableCell>Ocorre diariamente; Elevado número de aspectos ambientais associados ao impacto.</TableCell>
                              <TableCell className="text-center font-mono">30</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>

                      <p className="font-medium text-foreground text-xs mb-1">Tabela de Probabilidade</p>
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>Probabilidade</TableHead>
                              <TableHead>Descrição (Emergência)</TableHead>
                              <TableHead className="text-center">Pontos</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">Baixa</TableCell>
                              <TableCell>Ocorre menos de uma vez/mês; Existência de procedimentos/controles/gerenciamentos adequados dos aspectos ambientais.</TableCell>
                              <TableCell className="text-center font-mono">10</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Média</TableCell>
                              <TableCell>Ocorre mais de uma vez/mês; Existência de procedimentos/controles/gerenciamentos inadequados dos aspectos ambientais.</TableCell>
                              <TableCell className="text-center font-mono">20</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Alta</TableCell>
                              <TableCell>Ocorre diariamente; Inexistência de procedimentos/controles/gerenciamentos dos aspectos ambientais; Elevado número de aspectos ambientais associados ao impacto.</TableCell>
                              <TableCell className="text-center font-mono">30</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Soma */}
                    <div>
                      <p className="font-medium text-foreground mb-2">Soma (Consequência + Freq/Prob)</p>
                      <p className="text-xs text-muted-foreground mb-2">Responsável: Coordenadora de SGI</p>
                      <p>Soma entre as colunas de Consequência e Frequência/Probabilidade.</p>
                    </div>

                    {/* Categoria / Enquadramento */}
                    <div>
                      <p className="font-medium text-foreground mb-2">Categoria / Enquadramento</p>
                      <p className="text-xs text-muted-foreground mb-2">Responsável: Coordenadora de SGI</p>
                      <p className="mb-2">Definição do enquadramento de importância dos aspectos/impactos ambientais. Soma simples dos itens de Consequência e Frequência/Probabilidade.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                          <p className="font-semibold text-green-800 dark:text-green-300">Desprezível (D)</p>
                          <p className="text-xs text-green-700 dark:text-green-400 mt-1">Pontuação total &lt; 50</p>
                        </div>
                        <div className="rounded-lg border p-4 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800">
                          <p className="font-semibold text-yellow-800 dark:text-yellow-300">Moderado (M)</p>
                          <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">Pontuação total entre 50 e 70</p>
                        </div>
                        <div className="rounded-lg border p-4 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
                          <p className="font-semibold text-red-800 dark:text-red-300">Crítico (C)</p>
                          <p className="text-xs text-red-700 dark:text-red-400 mt-1">Pontuação total &gt; 70</p>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Avaliação de Significância */}
                <AccordionItem value="significancia" className="border rounded-md px-3">
                  <AccordionTrigger className="hover:no-underline text-sm py-3">Avaliação de Significância</AccordionTrigger>
                  <AccordionContent className="space-y-4 text-sm text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground mb-2">Requisitos Legais</p>
                      <p className="text-xs text-muted-foreground mb-2">Responsável: Coordenadora do SGI</p>
                      <p>Filtro de significância com o objetivo de determinar a incidência de Requisitos Legais Aplicáveis sobre o impacto ambiental. Se existir, realizar marcação sombreada na coluna REQUISITOS LEGAIS.</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-2">DPI (Demanda Partes Interessadas)</p>
                      <p className="text-xs text-muted-foreground mb-2">Responsável: Coordenadora de SGI</p>
                      <p>Filtro de significância com o objetivo de determinar se há Demanda de Partes Interessadas sobre o impacto ambiental. Se existir, realizar marcação sombreada na coluna DPI.</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-2">OE (Opções Estratégicas)</p>
                      <p className="text-xs text-muted-foreground mb-2">Responsável: Coordenadora de SGI</p>
                      <p>Filtro de significância com o objetivo de determinar se o gerenciamento do aspecto/impacto ambiental está associado a determinado interesse estratégico ou de negócios da empresa. Se existir, realizar marcação sombreada na coluna OE.</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-2">Enquadramento Final</p>
                      <p className="text-xs text-muted-foreground mb-2">Responsável: Coordenadora de SGI</p>
                      <p className="mb-2">Classificação final do Impacto Ambiental, concluindo se o mesmo é significativo ou não.</p>
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>Categoria</TableHead>
                              <TableHead>Filtros (Req. Legais / DPI / OE)</TableHead>
                              <TableHead>Conclusão</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">Desprezível (D)</TableCell>
                              <TableCell>Desnecessário</TableCell>
                              <TableCell>Em virtude de suas características de Consequência e Frequência/Probabilidade, não necessitam ser submetidos à avaliação de significância, sendo considerados como <strong>"NÃO SIGNIFICATIVOS"</strong>.</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Moderado (M)</TableCell>
                              <TableCell>Necessário</TableCell>
                              <TableCell>O impacto ambiental que for aplicável a pelo menos um dos filtros de significância é considerado <strong>"SIGNIFICATIVO"</strong>.</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Crítico (C)</TableCell>
                              <TableCell>Necessário</TableCell>
                              <TableCell>Independentemente de sua retenção ou não em um dos filtros de significância, o impacto ambiental é sempre considerado <strong>"SIGNIFICATIVO"</strong>.</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Observações Adicionais */}
                <AccordionItem value="observacoes" className="border rounded-md px-3">
                  <AccordionTrigger className="hover:no-underline text-sm py-3">Observações Adicionais</AccordionTrigger>
                  <AccordionContent className="space-y-4 text-sm text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground mb-2">Tipos de Controle</p>
                      <p className="text-xs text-muted-foreground mb-2">Responsável: Coordenadora de SGI</p>
                      <p className="mb-2">Preencher com a sigla dos tipos de controles aplicados atualmente ao aspecto (caso existir).</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">ST — Sistemas de Tratamento</Badge>
                        <Badge variant="outline">CO — Controles Operacionais</Badge>
                        <Badge variant="outline">MO — Monitoramento</Badge>
                        <Badge variant="outline">PRE — Planos de Resposta a Emergências</Badge>
                        <Badge variant="outline">NC — Nenhum Controle</Badge>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-2">Controles Existentes</p>
                      <p className="text-xs text-muted-foreground mb-2">Responsável: Coordenadora de SGI</p>
                      <p>Informar os controles atualmente utilizados (caso existir). (Ex: PGRS / PRE / etc)</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-2">Link Legislação</p>
                      <p className="text-xs text-muted-foreground mb-2">Responsável: Coordenadora de SGI</p>
                      <p>Realizar uma citação do tema ou requisitos legais aplicáveis para o aspecto ambiental em questão, controlados pela FPLAN 003.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Perspectiva do Ciclo de Vida */}
                <AccordionItem value="ciclo-vida" className="border rounded-md px-3">
                  <AccordionTrigger className="hover:no-underline text-sm py-3">Perspectiva do Ciclo de Vida</AccordionTrigger>
                  <AccordionContent className="space-y-4 text-sm text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground mb-2">Existe Controle ou Influência Suficiente em algum Estágio?</p>
                      <p className="text-xs text-muted-foreground mb-2">Responsável: Coordenadora de SGI e Setores Pertinentes</p>
                      <p>Para os Aspectos Ambientais avaliados, determinar se a organização pode controlar ou influenciar suficientemente algum estágio no Ciclo de Vida. (Responder não caso não existir, ou sim caso existir).</p>
                      <p className="mt-2">Ao realizar essa análise, deve-se considerar se há suficiência de autonomia por parte da organização para tal controle e/ou influência. Essa autonomia é considerada insuficiente quando for considerado que a organização não tem acesso de opinião ou requisito ao desenvolvimento ou realização de determinado produto, serviço ou processo de provedores externos, clientes ou demais partes interessadas. Em caso de desenvolvimentos ou outras etapas internas, a autonomia poderá ser considerada como insuficiente quando houver potencial inviabilização econômica a partir de determinada ação a ser implementada sob o âmbito da perspectiva do ciclo de vida.</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-2">Em qual(is) estágio(s)?</p>
                      <p className="text-xs text-muted-foreground mb-2">Responsável: Coordenadora de SGI e Setores Pertinentes</p>
                      <p className="mb-2">Caso a resposta for sim, inserir qual estágio poderá ser controlado ou influenciado:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {[
                          "Extração/Origem da matéria-prima",
                          "Aquisição/Fornecimento",
                          "Armazenamento",
                          "Logística/Transporte",
                          "Operação/Processo Interno",
                          "Manutenção",
                          "Embalagem",
                          "Distribuição",
                          "Uso do produto/serviço",
                          "Reuso/Reciclagem",
                          "Descarte Final/Destinação",
                          "Pós-Consumo/Logística Reversa",
                        ].map((stage) => (
                          <div key={stage} className="rounded-md border p-2 text-xs bg-muted/30">
                            {stage}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-2">Saída(s) com base na Avaliação</p>
                      <p className="text-xs text-muted-foreground mb-2">Responsável: Coordenadora de SGI e Setores Pertinentes</p>
                      <p className="mb-1">Com base no(s) estágio(s) apontados, poderão ser estabelecidas várias saídas considerando o(s) estágio(s) influenciado(s) ou controlado(s):</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Apontar uma ação ou número de plano de ação para tratativa / melhoria.</li>
                        <li>Apontar um projeto ou ação já implementado, se aplicável.</li>
                        <li>Apontar um objetivo ambiental com planos a implementar.</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* 5.3 - Situações pertinentes */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Badge variant="outline" className="text-xs">5.3</Badge>
                Situações Pertinentes a Alteração/Revisão
              </h4>
              <ul className="text-sm text-muted-foreground space-y-2 list-none pl-0">
                <li className="flex gap-2">
                  <Badge variant="secondary" className="text-xs mt-0.5 shrink-0">5.3.1</Badge>
                  <span>Implantação do Sistema de Gestão Ambiental.</span>
                </li>
                <li className="flex gap-2">
                  <Badge variant="secondary" className="text-xs mt-0.5 shrink-0">5.3.2</Badge>
                  <span>Alterações substanciais em atividades, produtos ou serviços, aquisição de novos equipamentos ou desenvolvimento de projetos novos ou modificados e/ou introdução de novas tecnologias. Os aspectos e impactos ambientais devem ser identificados/avaliados de acordo com este procedimento e contemplado, quando pertinente, no Programa de Gestão Ambiental (ou RAC específica), desde a fase de planejamento (anteprojeto) até a fase de operação.</span>
                </li>
                <li className="flex gap-2">
                  <Badge variant="secondary" className="text-xs mt-0.5 shrink-0">5.3.3</Badge>
                  <span>Situações apresentadas no item anterior devem ser avaliadas criticamente quanto aos processos indiretos e/ou terceirizados, identificando a aplicação clara de controles operacionais e emergenciais ligados a estes 'personagens'.</span>
                </li>
                <li className="flex gap-2">
                  <Badge variant="secondary" className="text-xs mt-0.5 shrink-0">5.3.4</Badge>
                  <span>Alterações importantes em qualquer um dos filtros de significância.</span>
                </li>
                <li className="flex gap-2">
                  <Badge variant="secondary" className="text-xs mt-0.5 shrink-0">5.3.5</Badge>
                  <span>Periodicidade: sempre que houver alterações nos processos, ou no mínimo, anualmente.</span>
                </li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 6 - Tratativas aos Registros */}
        <AccordionItem value="registros" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="flex items-center gap-2 font-semibold">
              <Badge variant="secondary" className="text-xs">6</Badge>
              Tratativas aos Registros
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground italic">Não aplicável.</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
