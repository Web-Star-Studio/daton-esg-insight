/**
 * FAQ Page
 * Complete FAQ page with search, categories and Q&A
 */

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Mail, MessageCircle, Phone, FileText } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FAQSearch } from "@/components/faq/FAQSearch";
import { FAQSidebar } from "@/components/faq/FAQSidebar";
import { FAQCategory } from "@/components/faq/FAQCategory";
import { useFAQSearch } from "@/hooks/useFAQSearch";
import { buildPainelRedirect } from "@/config/externalApp";

export default function FAQ() {
  const location = useLocation();
  const {
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    filteredCategories,
    displayedCategories,
    totalQuestions,
  } = useFAQSearch();

  // Handle anchor links (e.g., /faq#emissoes-gee)
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, [location]);

  const sidebarCategories = filteredCategories.map((cat) => ({
    id: cat.id,
    title: cat.title,
    icon: cat.icon,
    description: cat.description,
    questionCount: cat.questions.length,
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="w-full overflow-hidden px-6 py-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Início</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Perguntas Frequentes</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Hero Section */}
      <div className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="w-full overflow-hidden px-6 py-12">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Central de Ajuda</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Encontre respostas para as perguntas mais comuns sobre a plataforma
            </p>
            <div className="max-w-2xl mx-auto">
              <FAQSearch
                value={searchQuery}
                onChange={setSearchQuery}
                resultsCount={totalQuestions}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden lg:block sticky top-0 h-screen">
          <FAQSidebar
            categories={sidebarCategories}
            activeCategory={activeCategory}
            onCategorySelect={setActiveCategory}
          />
        </div>

        {/* FAQ Content */}
        <div className="flex-1">
          <div className="w-full overflow-hidden px-6 py-8 max-w-4xl">
            {displayedCategories.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Nenhum resultado encontrado
                  </h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Não encontramos perguntas correspondentes à sua busca.
                    <br />
                    Tente usar outros termos ou navegue pelas categorias.
                  </p>
                  <Button variant="outline" onClick={() => setSearchQuery("")}>
                    Limpar busca
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-12">
                {displayedCategories.map((category) => (
                  <FAQCategory key={category.id} {...category} />
                ))}
              </div>
            )}

            {/* Help Section */}
            <Card className="mt-12 bg-muted/50">
              <CardHeader>
                <CardTitle>Não encontrou o que procurava?</CardTitle>
                <CardDescription>
                  Nossa equipe está pronta para ajudar você
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Button variant="outline" className="h-auto min-h-[44px] flex-col gap-2 py-4" onClick={() => { window.location.href = buildPainelRedirect("/app/ajuda"); }}>
                  <MessageCircle className="h-5 w-5" />
                  <div className="text-center">
                    <div className="font-medium">Ajuda no painel</div>
                    <div className="text-xs text-muted-foreground">Acesso ao painel</div>
                  </div>
                </Button>

                <Button variant="outline" className="h-auto min-h-[44px] flex-col gap-2 py-4" asChild>
                  <a href="mailto:contato@daton.com.br">
                    <Mail className="h-5 w-5" />
                    <div className="text-center">
                      <div className="font-medium">E-mail</div>
                      <div className="text-xs text-muted-foreground">Contato Daton</div>
                    </div>
                  </a>
                </Button>

                <Button variant="outline" className="h-auto min-h-[44px] flex-col gap-2 py-4" asChild>
                  <a href="/contato">
                    <Phone className="h-5 w-5" />
                    <div className="text-center">
                      <div className="font-medium">Contato</div>
                      <div className="text-xs text-muted-foreground">Página de contato</div>
                    </div>
                  </a>
                </Button>

                <Button variant="outline" className="h-auto min-h-[44px] flex-col gap-2 py-4" asChild>
                  <a href="/documentacao" target="_blank" rel="noopener noreferrer">
                    <FileText className="h-5 w-5" />
                    <div className="text-center">
                      <div className="font-medium">Documentação</div>
                      <div className="text-xs text-muted-foreground">Orientações</div>
                    </div>
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
