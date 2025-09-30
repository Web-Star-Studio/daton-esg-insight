import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Zap, Shield, Target, Users, Cpu, Globe, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useDocumentationNav } from '@/hooks/navigation/useDocumentationNav';
import { DocNavigation } from '@/components/documentation/DocNavigation';
import { DocOverviewSection } from '@/components/documentation/DocOverviewSection';
import { DocModulesSection } from '@/components/documentation/DocModulesSection';
import { DocTechnologiesSection } from '@/components/documentation/DocTechnologiesSection';
import { DocBenefitsClientsSection } from '@/components/documentation/DocBenefitsClientsSection';
import { DocSecuritySupportSection } from '@/components/documentation/DocSecuritySupportSection';
import { DocRoadmapCTA } from '@/components/documentation/DocRoadmapCTA';

const Documentacao = () => {
  const sections = [
    { id: 'overview', title: 'Visão Geral', icon: FileText },
    { id: 'modules', title: 'Módulos e Funcionalidades', icon: Zap },
    { id: 'technologies', title: 'Tecnologias', icon: Cpu },
    { id: 'benefits', title: 'Benefícios', icon: Target },
    { id: 'clients', title: 'Casos de Uso', icon: Users },
    { id: 'security', title: 'Segurança', icon: Shield },
    { id: 'support', title: 'Suporte', icon: Globe },
    { id: 'roadmap', title: 'Roadmap', icon: TrendingUp },
  ];

  const { activeSection, scrollToSection } = useDocumentationNav(sections);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <img src="/src/assets/daton-logo.png" alt="Daton" className="h-8 w-auto" />
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-lg font-semibold">Documentação</h1>
          </div>
          <Button asChild>
            <Link to="/" className="flex items-center gap-2">
              Voltar ao Site <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          <DocNavigation
            sections={sections}
            activeSection={activeSection}
            onNavigate={scrollToSection}
          />

          {/* Main Content */}
          <main className="flex-1 space-y-12">
            <DocOverviewSection />
            <DocModulesSection />
            <DocTechnologiesSection />
            <DocBenefitsClientsSection />
            <DocSecuritySupportSection />
            <DocRoadmapCTA />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Documentacao;
