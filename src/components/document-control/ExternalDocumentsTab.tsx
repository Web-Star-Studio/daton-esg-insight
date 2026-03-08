import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, AlertTriangle, ExternalLink, Scale } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EnhancedLoading } from "@/components/ui/enhanced-loading";

interface ExternalDoc {
  id: string;
  document_name: string;
  document_type: string;
  origin: string | null;
  reference_number: string | null;
  issuing_authority: string | null;
  effective_date: string | null;
  expiration_date: string | null;
  revalidation_date: string | null;
  revalidation_frequency: string | null;
  compliance_status: string | null;
  responsible_user_id: string | null;
  notes: string | null;
  is_active: boolean;
}

const DOC_TYPES = [
  { value: "legislacao", label: "Legislação" },
  { value: "fornecedor", label: "Documento de Fornecedor" },
  { value: "norma", label: "Norma Técnica" },
  { value: "outro", label: "Outro" },
];

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  vigente: { label: "Vigente", variant: "default" },
  vencido: { label: "Vencido", variant: "destructive" },
  revogado: { label: "Revogado", variant: "destructive" },
  revalidado: { label: "Revalidado", variant: "secondary" },
};

export const ExternalDocumentsTab = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDoc, setNewDoc] = useState({
    document_name: "",
    document_type: "legislacao",
    origin: "",
    reference_number: "",
    issuing_authority: "",
    effective_date: "",
    expiration_date: "",
    revalidation_frequency: "trimestral",
    notes: "",
  });

  const { data: externalDocs = [], isLoading } = useQuery({
    queryKey: ["external-documents"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("document_external")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ExternalDoc[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (doc: typeof newDoc) => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) throw new Error("Não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (!profile?.company_id) throw new Error("Empresa não encontrada");

      // Calculate revalidation date based on frequency
      let revalidationDate: string | null = null;
      if (doc.effective_date) {
        const base = new Date(doc.effective_date);
        const freqMonths = doc.revalidation_frequency === "trimestral" ? 3 : doc.revalidation_frequency === "semestral" ? 6 : 12;
        base.setMonth(base.getMonth() + freqMonths);
        revalidationDate = base.toISOString().split("T")[0];
      }

      const { error } = await (supabase as any).from("document_external").insert({
        company_id: profile.company_id,
        document_name: doc.document_name,
        document_type: doc.document_type,
        origin: doc.origin || null,
        reference_number: doc.reference_number || null,
        issuing_authority: doc.issuing_authority || null,
        effective_date: doc.effective_date || null,
        expiration_date: doc.expiration_date || null,
        revalidation_date: revalidationDate,
        revalidation_frequency: doc.revalidation_frequency,
        compliance_status: "vigente",
        notes: doc.notes || null,
        created_by_user_id: authData.user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-documents"] });
      toast({ title: "Documento externo registrado" });
      setIsCreateOpen(false);
      setNewDoc({
        document_name: "",
        document_type: "legislacao",
        origin: "",
        reference_number: "",
        issuing_authority: "",
        effective_date: "",
        expiration_date: "",
        revalidation_frequency: "trimestral",
        notes: "",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const filtered = externalDocs.filter((doc) => {
    const search = searchTerm.toLowerCase();
    return (
      doc.document_name.toLowerCase().includes(search) ||
      (doc.reference_number || "").toLowerCase().includes(search) ||
      (doc.origin || "").toLowerCase().includes(search)
    );
  });

  // Identify docs needing revalidation
  const today = new Date().toISOString().split("T")[0];
  const needsRevalidation = externalDocs.filter(
    (doc) => doc.revalidation_date && doc.revalidation_date <= today
  );

  if (isLoading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <EnhancedLoading size="lg" text="Carregando documentos externos..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revalidation alert */}
      {needsRevalidation.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive text-base">
              <AlertTriangle className="h-5 w-5" />
              {needsRevalidation.length} documento(s) pendente(s) de revalidação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {needsRevalidation.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between text-sm">
                  <span>{doc.document_name}</span>
                  <Badge variant="destructive">
                    Revalidar até {new Date(`${doc.revalidation_date}T00:00:00`).toLocaleDateString("pt-BR")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar documento externo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-[300px]"
          />
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Registrar Documento Externo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Novo Documento Externo
              </DialogTitle>
              <DialogDescription>
                Registre legislações, documentos de fornecedores ou normas técnicas.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid gap-2">
                <Label>Nome do Documento *</Label>
                <Input
                  value={newDoc.document_name}
                  onChange={(e) => setNewDoc({ ...newDoc, document_name: e.target.value })}
                  placeholder="Ex: NR-12, ISO 14001..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select value={newDoc.document_type} onValueChange={(v) => setNewDoc({ ...newDoc, document_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DOC_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Frequência de Revalidação</Label>
                  <Select value={newDoc.revalidation_frequency} onValueChange={(v) => setNewDoc({ ...newDoc, revalidation_frequency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="semestral">Semestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Origem</Label>
                  <Input
                    value={newDoc.origin}
                    onChange={(e) => setNewDoc({ ...newDoc, origin: e.target.value })}
                    placeholder="Ex: SOGI, Fornecedor X"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Nº Referência</Label>
                  <Input
                    value={newDoc.reference_number}
                    onChange={(e) => setNewDoc({ ...newDoc, reference_number: e.target.value })}
                    placeholder="Ex: Lei 12.305/2010"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Autoridade Emissora</Label>
                <Input
                  value={newDoc.issuing_authority}
                  onChange={(e) => setNewDoc({ ...newDoc, issuing_authority: e.target.value })}
                  placeholder="Ex: MMA, ANVISA"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Data Vigência</Label>
                  <Input
                    type="date"
                    value={newDoc.effective_date}
                    onChange={(e) => setNewDoc({ ...newDoc, effective_date: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Data Expiração</Label>
                  <Input
                    type="date"
                    value={newDoc.expiration_date}
                    onChange={(e) => setNewDoc({ ...newDoc, expiration_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Observações</Label>
                <Textarea
                  value={newDoc.notes}
                  onChange={(e) => setNewDoc({ ...newDoc, notes: e.target.value })}
                  rows={3}
                  placeholder="Notas adicionais..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button
                onClick={() => createMutation.mutate(newDoc)}
                disabled={createMutation.isPending || !newDoc.document_name}
              >
                {createMutation.isPending ? "Registrando..." : "Registrar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Referência</TableHead>
                  <TableHead>Vigência</TableHead>
                  <TableHead>Revalidação</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Nenhum documento externo registrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((doc) => {
                    const statusConfig = STATUS_CONFIG[doc.compliance_status || "vigente"] || STATUS_CONFIG.vigente;
                    const typeLabel = DOC_TYPES.find((t) => t.value === doc.document_type)?.label || doc.document_type;
                    return (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.document_name}</TableCell>
                        <TableCell><Badge variant="outline">{typeLabel}</Badge></TableCell>
                        <TableCell>{doc.origin || "—"}</TableCell>
                        <TableCell className="font-mono text-sm">{doc.reference_number || "—"}</TableCell>
                        <TableCell>
                          {doc.effective_date
                            ? new Date(`${doc.effective_date}T00:00:00`).toLocaleDateString("pt-BR")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {doc.revalidation_date
                            ? new Date(`${doc.revalidation_date}T00:00:00`).toLocaleDateString("pt-BR")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
