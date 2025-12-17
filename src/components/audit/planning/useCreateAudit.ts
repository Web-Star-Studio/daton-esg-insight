import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { AuditFormData } from "./AuditCreationWizard";

export function useCreateAudit() {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createFullAudit = async (formData: AuditFormData) => {
    setIsCreating(true);

    try {
      // Get user profile for company_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) throw new Error("Empresa não encontrada");

      // 1. Create the audit
      const { data: audit, error: auditError } = await supabase
        .from("audits")
        .insert([
          {
            company_id: profile.company_id,
            title: formData.title,
            scope: formData.description,
            category_id: formData.category_id || null,
            template_id: formData.template_id || null,
            target_entity: formData.target_entity,
            target_entity_type: formData.target_entity_type,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            lead_auditor_id: formData.lead_auditor_id || user.id,
            status: "Planejamento",
            planning_status: "draft",
          } as any,
        ])
        .select()
        .single();

      if (auditError) throw auditError;

      // 2. Link standards to audit
      if (formData.standard_ids.length > 0) {
        const standardLinks = formData.standard_ids.map((standardId, index) => ({
          audit_id: audit.id,
          standard_id: standardId,
          display_order: index,
        }));

        const { error: linksError } = await supabase
          .from("audit_standards_link")
          .insert(standardLinks);

        if (linksError) throw linksError;
      }

      // 3. Create sessions with items
      for (let i = 0; i < formData.sessions.length; i++) {
        const sessionData = formData.sessions[i];

        const { data: session, error: sessionError } = await supabase
          .from("audit_sessions")
          .insert([
            {
              audit_id: audit.id,
              name: sessionData.name,
              description: sessionData.description,
              session_date: sessionData.session_date || null,
              start_time: sessionData.start_time || null,
              end_time: sessionData.end_time || null,
              location: sessionData.location,
              display_order: i,
              total_items: sessionData.item_ids.length,
            },
          ])
          .select()
          .single();

        if (sessionError) throw sessionError;

        // Add items to session
        if (sessionData.item_ids.length > 0) {
          const sessionItems = sessionData.item_ids.map((itemId, idx) => ({
            session_id: session.id,
            standard_item_id: itemId,
            display_order: idx,
          }));

          const { error: itemsError } = await supabase
            .from("audit_session_items")
            .insert(sessionItems);

          if (itemsError) throw itemsError;
        }
      }

      // Update total_items count on audit
      const totalItems = formData.sessions.reduce(
        (sum, s) => sum + s.item_ids.length,
        0
      );

      await supabase
        .from("audits")
        .update({ total_items: totalItems })
        .eq("id", audit.id);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["audits"] });

      toast({
        title: "Auditoria criada",
        description: `A auditoria "${formData.title}" foi criada com sucesso.`,
      });

      return audit;
    } catch (error: any) {
      console.error("Error creating audit:", error);
      toast({
        title: "Erro ao criar auditoria",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return { createFullAudit, isCreating };
}
