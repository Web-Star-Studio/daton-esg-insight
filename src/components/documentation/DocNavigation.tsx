import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NavSection } from '@/hooks/navigation/useDocumentationNav';

interface DocNavigationProps {
  sections: NavSection[];
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export function DocNavigation({ sections, activeSection, onNavigate }: DocNavigationProps) {
  return (
    <aside className="w-64 shrink-0">
      <div className="sticky top-24">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Navegação</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <nav className="space-y-1 p-4">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => onNavigate(section.id)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                        activeSection === section.id ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {section.title}
                    </button>
                  );
                })}
              </nav>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
