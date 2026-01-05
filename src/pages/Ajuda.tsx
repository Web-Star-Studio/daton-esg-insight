/**
 * Ajuda (Help) Page
 * Central help page with FAQ integrated
 */

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { HelpCircle, Mail, MessageCircle, Phone, FileText, BookOpen } from "lucide-react";
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

export default function Ajuda() {
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

  // Handle anchor links (e.g., /ajuda#emissoes-gee)
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
        <div className="container mx-auto px-6 py-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Início</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Central de Ajuda</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Hero Section */}
      <div className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-3xl mx-auto text-center">
            <HelpCircle className="h-12 w-12 mx-auto text-primary mb-4" />
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

      {/* Quick Access Cards */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-primary" />
                Perguntas Frequentes
              </CardTitle>
              <CardDescription>
                Respostas para as dúvidas mais comuns
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-5 w-5 text-primary" />
                Documentação
              </CardTitle>
              <CardDescription>
                Guias completos e tutoriais
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="h-5 w-5 text-primary" />
                Suporte
              </CardTitle>
              <CardDescription>
                Entre em contato com nossa equipe
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Main Content - FAQ Section */}
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
          <div className="container mx-auto px-6 py-8 max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Perguntas Frequentes</h2>
            
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
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                  <MessageCircle className="h-5 w-5" />
                  <div className="text-center">
                    <div className="font-medium">Chat ao vivo</div>
                    <div className="text-xs text-muted-foreground">Seg-Sex, 9h-18h</div>
                  </div>
                </Button>

                <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
                  <a href="mailto:suporte@plataforma.com">
                    <Mail className="h-5 w-5" />
                    <div className="text-center">
                      <div className="font-medium">E-mail</div>
                      <div className="text-xs text-muted-foreground">Resposta em 24h</div>
                    </div>
                  </a>
                </Button>

                <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
                  <a href="tel:0800-xxx-xxxx">
                    <Phone className="h-5 w-5" />
                    <div className="text-center">
                      <div className="font-medium">Telefone</div>
                      <div className="text-xs text-muted-foreground">0800-XXX-XXXX</div>
                    </div>
                  </a>
                </Button>

                <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
                  <a href="https://ajuda.plataforma.com" target="_blank" rel="noopener noreferrer">
                    <FileText className="h-5 w-5" />
                    <div className="text-center">
                      <div className="font-medium">Documentação</div>
                      <div className="text-xs text-muted-foreground">Guias completos</div>
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
