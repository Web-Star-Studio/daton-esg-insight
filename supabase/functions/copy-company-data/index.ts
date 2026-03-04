import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BATCH_SIZE = 500;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { sourceCompanyId: SRC, targetCompanyId: TGT, phase } = await req.json();
    if (!SRC || !TGT) throw new Error("sourceCompanyId and targetCompanyId required");

    const { data: fp } = await supabase.from("profiles").select("id").eq("company_id", TGT).limit(1).single();
    const FU = fp?.id; // fallback user
    if (!FU) throw new Error("No user in target company");

    const log: string[] = [];
    const idMap = new Map<string, string>();
    function nid(old: string): string { if (!idMap.has(old)) idMap.set(old, crypto.randomUUID()); return idMap.get(old)!; }
    function remap(old: string | null): string | null { return old ? (idMap.has(old) ? idMap.get(old)! : null) : null; }

    async function fetchAll(table: string, cid: string) {
      const all: any[] = []; let from = 0;
      while (true) {
        const { data, error } = await supabase.from(table).select("*").eq("company_id", cid).range(from, from + 999);
        if (error) throw new Error(`Fetch ${table}: ${error.message}`);
        if (!data || !data.length) break;
        all.push(...data);
        if (data.length < 1000) break;
        from += 1000;
      }
      return all;
    }

    async function ins(table: string, rows: any[]) {
      if (!rows.length) return;
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const { error } = await supabase.from(table).insert(rows.slice(i, i + BATCH_SIZE));
        if (error) { log.push(`❌ ${table} batch ${i}: ${error.message}`); throw new Error(`Insert ${table}: ${error.message}`); }
      }
      log.push(`✅ ${table}: ${rows.length}`);
    }

    const now = new Date().toISOString();

    if (phase === "clean") {
      for (const t of [
        "compliance_tasks","legislation_compliance_profiles","license_conditions",
        "supplier_evaluation_criteria","supplier_required_documents",
        "employee_education","employee_experiences","employee_trainings",
        "training_programs","employees","gri_reports","documents","audits",
        "emission_sources","action_plans","esg_risks","non_conformities",
        "licenses","supplier_management","legislations","branches","departments",
      ]) {
        const { error } = await supabase.from(t).delete().eq("company_id", TGT);
        log.push(error ? `❌ ${t}: ${error.message}` : `✅ ${t}`);
      }
    }

    if (phase === "phase1") {
      // All non-employee independent tables
      const srcDepts = await fetchAll("departments", SRC);
      await ins("departments", srcDepts.map((d: any) => ({ id: nid(d.id), company_id: TGT, name: d.name, description: d.description, parent_department_id: null, manager_employee_id: null, budget: d.budget, cost_center: d.cost_center, created_at: d.created_at || now, updated_at: now })));

      const srcBranches = await fetchAll("branches", SRC);
      await ins("branches", srcBranches.map((b: any) => ({ id: nid(b.id), company_id: TGT, name: b.name, code: b.code, is_headquarters: b.is_headquarters, address: b.address, city: b.city, state: b.state, country: b.country, phone: b.phone, manager_id: null, status: b.status, created_at: b.created_at || now, updated_at: now, latitude: b.latitude, longitude: b.longitude, cep: b.cep, neighborhood: b.neighborhood, street_number: b.street_number, cnpj: null, parent_branch_id: null })));

      const srcLeg = await fetchAll("legislations", SRC);
      await ins("legislations", srcLeg.map((l: any) => ({ ...l, id: nid(l.id), company_id: TGT, created_by: null, responsible_user_id: null, revoked_by_legislation_id: null, revokes_legislation_id: null, created_at: l.created_at || now, updated_at: now })));

      const srcSup = await fetchAll("supplier_management", SRC);
      await ins("supplier_management", srcSup.map((s: any) => ({ ...s, id: nid(s.id), company_id: TGT, status_changed_by: null, access_code: null, temporary_password: null, password_hash: null, created_at: s.created_at || now, updated_at: now })));

      const srcLic = await fetchAll("licenses", SRC);
      await ins("licenses", srcLic.map((l: any) => ({ ...l, id: nid(l.id), company_id: TGT, branch_id: remap(l.branch_id), asset_id: null, responsible_user_id: null, created_at: l.created_at || now, updated_at: now })));

      const srcNC = await fetchAll("non_conformities", SRC);
      await ins("non_conformities", srcNC.map((n: any) => ({ ...n, id: nid(n.id), company_id: TGT, parent_nc_id: null, detected_by_user_id: null, responsible_user_id: null, approved_by_user_id: null, created_at: n.created_at || now, updated_at: now })));

      await ins("esg_risks", (await fetchAll("esg_risks", SRC)).map((r: any) => ({ ...r, id: nid(r.id), company_id: TGT, created_at: r.created_at || now, updated_at: now })));
      await ins("action_plans", (await fetchAll("action_plans", SRC)).map((p: any) => ({ ...p, id: nid(p.id), company_id: TGT, created_by_user_id: FU, created_at: p.created_at || now, updated_at: now })));
      await ins("emission_sources", (await fetchAll("emission_sources", SRC)).map((e: any) => ({ ...e, id: nid(e.id), company_id: TGT, asset_id: null, created_at: e.created_at || now, updated_at: now })));
      await ins("audits", (await fetchAll("audits", SRC)).map((a: any) => ({ ...a, id: nid(a.id), company_id: TGT, category_id: null, template_id: null, planning_locked_by: null, created_at: a.created_at || now, updated_at: now })));
      await ins("documents", (await fetchAll("documents", SRC)).map((d: any) => ({ ...d, id: nid(d.id), company_id: TGT, uploader_user_id: FU, folder_id: null })));
      await ins("gri_reports", (await fetchAll("gri_reports", SRC)).map((g: any) => ({ ...g, id: nid(g.id), company_id: TGT, created_by_user_id: FU, created_at: g.created_at || now, updated_at: now })));

      // Now dependent non-employee tables that use mappings from above
      await ins("license_conditions", (await fetchAll("license_conditions", SRC)).map((c: any) => ({ ...c, id: nid(c.id), license_id: remap(c.license_id) || c.license_id, approved_by_user_id: null, related_alert_id: null, company_id: TGT, created_at: c.created_at || now, updated_at: now })));
      await ins("supplier_required_documents", (await fetchAll("supplier_required_documents", SRC)).map((s: any) => ({ ...s, id: nid(s.id), company_id: TGT, supplier_id: remap(s.supplier_id), created_at: s.created_at || now, updated_at: now })));
      await ins("supplier_evaluation_criteria", (await fetchAll("supplier_evaluation_criteria", SRC)).map((s: any) => ({ ...s, id: nid(s.id), company_id: TGT, supplier_id: remap(s.supplier_id), created_at: s.created_at || now, updated_at: now })));
      await ins("legislation_compliance_profiles", (await fetchAll("legislation_compliance_profiles", SRC)).map((l: any) => ({ ...l, id: nid(l.id), company_id: TGT, legislation_id: remap(l.legislation_id), branch_id: remap(l.branch_id), completed_by: null, created_at: l.created_at || now, updated_at: now })));
      await ins("compliance_tasks", (await fetchAll("compliance_tasks", SRC)).map((t: any) => ({ ...t, id: nid(t.id), company_id: TGT, requirement_id: null, responsible_user_id: null, evidence_document_id: null, created_at: t.created_at || now, updated_at: now })));

      // Self-ref updates
      for (const l of srcLeg) {
        const u: any = {};
        if (l.revoked_by_legislation_id) u.revoked_by_legislation_id = remap(l.revoked_by_legislation_id);
        if (l.revokes_legislation_id) u.revokes_legislation_id = remap(l.revokes_legislation_id);
        if (Object.keys(u).length) await supabase.from("legislations").update(u).eq("id", nid(l.id));
      }
      for (const n of srcNC) { if (n.parent_nc_id) await supabase.from("non_conformities").update({ parent_nc_id: remap(n.parent_nc_id) }).eq("id", nid(n.id)); }
      for (const b of srcBranches) { if (b.parent_branch_id) await supabase.from("branches").update({ parent_branch_id: remap(b.parent_branch_id) }).eq("id", nid(b.id)); }
      for (const d of srcDepts) { if (d.parent_department_id) await supabase.from("departments").update({ parent_department_id: remap(d.parent_department_id) }).eq("id", nid(d.id)); }
      log.push("✅ self-refs updated");
    }

    if (phase === "phase2") {
      // Employees + branches mapping rebuild
      const srcBranches = await fetchAll("branches", SRC);
      const tgtBranches = await fetchAll("branches", TGT);
      // Map by name since IDs are random
      const branchMap = new Map<string, string>();
      for (const sb of srcBranches) {
        const tb = tgtBranches.find((t: any) => t.name === sb.name);
        if (tb) branchMap.set(sb.id, tb.id);
      }

      const srcEmployees = await fetchAll("employees", SRC);
      await ins("employees", srcEmployees.map((e: any) => ({
        ...e,
        id: nid(e.id),
        company_id: TGT,
        branch_id: branchMap.get(e.branch_id) || null,
        position_id: null,
        manager_id: null,
        employee_code: e.employee_code ? `${e.employee_code}` : null,
        created_at: e.created_at || now,
        updated_at: now,
      })));

      // Manager self-refs
      let mgr = 0;
      for (const e of srcEmployees) {
        if (e.manager_id && idMap.has(e.manager_id)) {
          await supabase.from("employees").update({ manager_id: idMap.get(e.manager_id) }).eq("id", nid(e.id));
          mgr++;
        }
      }
      log.push(`✅ manager refs: ${mgr}`);

      // Update departments with employee refs
      const srcDepts = await fetchAll("departments", SRC);
      const tgtDepts = await fetchAll("departments", TGT);
      const deptMap = new Map<string, string>();
      for (const sd of srcDepts) {
        const td = tgtDepts.find((t: any) => t.name === sd.name);
        if (td) deptMap.set(sd.id, td.id);
      }
      for (const d of srcDepts) {
        if (d.manager_employee_id && idMap.has(d.manager_employee_id)) {
          const tgtDeptId = deptMap.get(d.id);
          if (tgtDeptId) await supabase.from("departments").update({ manager_employee_id: idMap.get(d.manager_employee_id) }).eq("id", tgtDeptId);
        }
      }
      // Update branches with employee manager refs
      for (const b of srcBranches) {
        if (b.manager_id && idMap.has(b.manager_id)) {
          const tgtBranchId = branchMap.get(b.id);
          if (tgtBranchId) await supabase.from("branches").update({ manager_id: idMap.get(b.manager_id) }).eq("id", tgtBranchId);
        }
      }
      log.push("✅ dept/branch manager refs updated");
    }

    if (phase === "phase3") {
      // Training programs + employee-dependent tables
      // Rebuild employee mapping by name
      const srcEmployees = await fetchAll("employees", SRC);
      const tgtEmployees = await fetchAll("employees", TGT);
      const empMap = new Map<string, string>();
      for (const se of srcEmployees) {
        const te = tgtEmployees.find((t: any) => t.full_name === se.full_name && t.hire_date === se.hire_date);
        if (te) { empMap.set(se.id, te.id); idMap.set(se.id, te.id); }
      }
      log.push(`✅ employee map rebuilt: ${empMap.size}/${srcEmployees.length}`);

      const srcBranches = await fetchAll("branches", SRC);
      const tgtBranches = await fetchAll("branches", TGT);
      for (const sb of srcBranches) {
        const tb = tgtBranches.find((t: any) => t.name === sb.name);
        if (tb) idMap.set(sb.id, tb.id);
      }

      const srcProg = await fetchAll("training_programs", SRC);
      await ins("training_programs", srcProg.map((p: any) => ({
        ...p, id: nid(p.id), company_id: TGT,
        branch_id: remap(p.branch_id),
        responsible_id: remap(p.responsible_id),
        efficacy_evaluator_employee_id: remap(p.efficacy_evaluator_employee_id),
        created_at: p.created_at || now, updated_at: now,
      })));

      // Rebuild training program mapping
      const srcET = await fetchAll("employee_trainings", SRC);
      await ins("employee_trainings", srcET.filter((t: any) => empMap.has(t.employee_id)).map((t: any) => ({
        ...t, id: nid(t.id), company_id: TGT,
        employee_id: empMap.get(t.employee_id)!,
        training_program_id: remap(t.training_program_id),
        attendance_marked_by: null,
        created_at: t.created_at || now, updated_at: now,
      })));

      const srcEX = await fetchAll("employee_experiences", SRC);
      await ins("employee_experiences", srcEX.filter((e: any) => empMap.has(e.employee_id)).map((e: any) => ({
        ...e, id: nid(e.id), company_id: TGT,
        employee_id: empMap.get(e.employee_id)!,
        created_at: e.created_at || now, updated_at: now,
      })));

      const srcED = await fetchAll("employee_education", SRC);
      await ins("employee_education", srcED.filter((e: any) => empMap.has(e.employee_id)).map((e: any) => ({
        ...e, id: nid(e.id), company_id: TGT,
        employee_id: empMap.get(e.employee_id)!,
        created_at: e.created_at || now, updated_at: now,
      })));
    }

    return new Response(JSON.stringify({ success: true, phase, mappings: idMap.size, log }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
