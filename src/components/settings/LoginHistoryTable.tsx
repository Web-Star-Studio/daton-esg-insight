import { useQuery } from "@tanstack/react-query";
import { History, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LoginHistoryEntry {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  location_info: {
    city?: string;
    country?: string;
  } | null;
  login_success: boolean;
  failure_reason: string | null;
  created_at: string;
}

export function LoginHistoryTable() {
  const { data: history, isLoading } = useQuery({
    queryKey: ["login-history"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("login_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []) as LoginHistoryEntry[];
    },
  });

  const parseUserAgent = (ua: string | null): { browser: string; os: string } => {
    if (!ua) return { browser: "Desconhecido", os: "Desconhecido" };

    let browser = "Desconhecido";
    let os = "Desconhecido";

    // Browser detection
    if (ua.includes("Chrome") && !ua.includes("Edg")) {
      browser = "Chrome";
    } else if (ua.includes("Firefox")) {
      browser = "Firefox";
    } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
      browser = "Safari";
    } else if (ua.includes("Edg")) {
      browser = "Edge";
    } else if (ua.includes("Opera") || ua.includes("OPR")) {
      browser = "Opera";
    }

    // OS detection
    if (ua.includes("Windows")) {
      os = "Windows";
    } else if (ua.includes("Mac OS")) {
      os = "macOS";
    } else if (ua.includes("Linux")) {
      os = "Linux";
    } else if (ua.includes("Android")) {
      os = "Android";
    } else if (ua.includes("iPhone") || ua.includes("iPad")) {
      os = "iOS";
    }

    return { browser, os };
  };

  const maskIp = (ip: string | null): string => {
    if (!ip) return "IP desconhecido";
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.***`;
    }
    return ip;
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Login</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Histórico de Login
        </CardTitle>
        <CardDescription>
          Últimos 20 acessos à sua conta
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!history || history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum histórico de login disponível.
          </p>
        ) : (
          <div className="space-y-3">
            {history.map((entry) => {
              const { browser, os } = parseUserAgent(entry.user_agent);
              
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {entry.login_success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {browser} em {os}
                        </span>
                        <Badge 
                          variant={entry.login_success ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          {entry.login_success ? "Sucesso" : "Falhou"}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {maskIp(entry.ip_address)}
                        {entry.location_info?.city && (
                          <> • {entry.location_info.city}, {entry.location_info.country}</>
                        )}
                      </div>
                      {entry.failure_reason && (
                        <div className="text-xs text-destructive mt-1">
                          {entry.failure_reason}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(entry.created_at)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
