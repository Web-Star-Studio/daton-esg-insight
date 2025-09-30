import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ExternalLink } from "lucide-react";

export function GRISocialModule() {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          Indicadores Sociais GRI
        </CardTitle>
        <CardDescription>
          Acesse o dashboard completo de gestão social
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          Gerencie todos os aspectos sociais: funcionários, segurança, treinamentos e impacto social.
        </p>
        <Button 
          onClick={() => window.location.href = '/social-esg'} 
          className="w-full"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Acessar Dashboard Social
        </Button>
      </CardContent>
    </Card>
  );
}