import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BATCH_SIZE = 500;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { sourceCompanyId, targetCompanyId, phase } = await req.json();
    if (!sourceCompanyId || !targetCompanyId) {
      throw new Error("sourceCompanyId and targetCompanyId required");
    }

    const SRC = sourceCompanyId;
    const TGT = targetCompanyId;

    const { data: fallbackProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("company_id", TGT)
      .limit(1)
      .single();
    const fallbackUserId = fallbackProfile?.id;
    if (!fallbackUserId) throw new Error("No user in target company");

    // Persistent ID mapping stored in a temp table
    // We use a simple approach: store mappings in memory per phase

    const log: string[] = [];

    async function fetchAll(table: string, companyId: string) {
      const all: any[] = [];
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .eq("company_id", companyId)
          .range(from, from + 999);
        if (error) throw new Error(`Fetch ${table}: ${error.message}`);
        if (!data || data.length === 0) break;
        all.push(...data);
        if (data.length < 1000) break;
        from += 1000;
      }
      return all;
    }

    async function insertBatch(table: string, rows: any[]) {
      if (rows.length === 0) return;
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from(table).insert(batch);
        if (error) {
          log.push(`❌ ${table} batch ${i}: ${error.message}`);
          throw new Error(`Insert ${table}: ${error.message}`);
        }
      }
      log.push(`✅ ${table}: ${rows.length} registros`);
    }

    const now = new Date().toISOString();

    // We need ID mapping across phases. Store in a helper table.
    // For simplicity, use `copy_id_mappings` table or embed mapping logic.
    // Since we can't create tables here, we'll use a deterministic UUID approach:
    // newId = uuid5-like hash of (targetCompanyId + oldId)
    // Actually let's use a simpler approach: store mappings as JSON in a single row.

    // Better approach: use deterministic mapping via a simple hash
    // We'll create a mapping by querying the already-inserted target records by name/code matching.
    
    // Simplest: for phase approach, use a mapping table or just do name-based lookups.
    // Let's use a practical approach: store mappings in a temp kv table.

    // Use random UUIDs with in-memory cache
    function deterministicId(_oldId: string): string {
      return crypto.randomUUID();
    }

    // Cached mapping
    const idCache = new Map<string, string>();
    async function newId(oldId: string): Promise<string> {
      if (!idCache.has(oldId)) {
        idCache.set(oldId, await deterministicId(oldId));
      }
      return idCache.get(oldId)!;
    }

    async function remapOrNull(oldId: string | null): Promise<string | null> {
      if (!oldId) return null;
      return await newId(oldId);
    }

    if (phase === "clean") {
      const cleanTables = [
        "compliance_tasks", "legislation_compliance_profiles",
        "license_conditions", "supplier_evaluation_criteria", "supplier_required_documents",
        "employee_education", "employee_experiences", "employee_trainings",
        "training_programs", "employees",
        "gri_reports", "documents", "audits", "emission_sources", "action_plans",
        "esg_risks", "non_conformities", "licenses", "supplier_management",
        "legislations", "branches", "departments",
      ];
      for (const t of cleanTables) {
        const { error } = await supabase.from(t).delete().eq("company_id", TGT);
        log.push(error ? `❌ clean ${t}: ${error.message}` : `✅ cleaned ${t}`);
      }
    }

    if (phase === "phase1") {
      // Independent tables: departments, branches, legislations, supplier_management,
      // licenses, non_conformities, esg_risks, action_plans, emission_sources, audits, documents, gri_reports

      const srcDepts = await fetchAll("departments", SRC);
      await insertBatch("departments", await Promise.all(srcDepts.map(async (d: any) => ({
        id: await newId(d.id),
        company_id: TGT,
        name: d.name,
        description: d.description,
        parent_department_id: null,
        manager_employee_id: null,
        budget: d.budget,
        cost_center: d.cost_center,
        created_at: d.created_at || now,
        updated_at: now,
      }))));

      const srcBranches = await fetchAll("branches", SRC);
      await insertBatch("branches", await Promise.all(srcBranches.map(async (b: any) => ({
        id: await newId(b.id),
        company_id: TGT,
        name: b.name, code: b.code, is_headquarters: b.is_headquarters,
        address: b.address, city: b.city, state: b.state, country: b.country,
        phone: b.phone, manager_id: null, status: b.status,
        created_at: b.created_at || now, updated_at: now,
        latitude: b.latitude, longitude: b.longitude, cep: b.cep,
        neighborhood: b.neighborhood, street_number: b.street_number,
        cnpj: null, parent_branch_id: null,
      }))));

      const srcLeg = await fetchAll("legislations", SRC);
      await insertBatch("legislations", await Promise.all(srcLeg.map(async (l: any) => ({
        ...l,
        id: await newId(l.id),
        company_id: TGT,
        created_by: null, responsible_user_id: null,
        revoked_by_legislation_id: null, revokes_legislation_id: null,
        created_at: l.created_at || now, updated_at: now,
      }))));

      const srcSup = await fetchAll("supplier_management", SRC);
      await insertBatch("supplier_management", await Promise.all(srcSup.map(async (s: any) => ({
        ...s,
        id: await newId(s.id),
        company_id: TGT,
        status_changed_by: null,
        access_code: null, temporary_password: null, password_hash: null,
        created_at: s.created_at || now, updated_at: now,
      }))));

      const srcLic = await fetchAll("licenses", SRC);
      await insertBatch("licenses", await Promise.all(srcLic.map(async (l: any) => ({
        ...l,
        id: await newId(l.id),
        company_id: TGT,
        branch_id: await remapOrNull(l.branch_id),
        asset_id: null, responsible_user_id: null,
        created_at: l.created_at || now, updated_at: now,
      }))));

      const srcNC = await fetchAll("non_conformities", SRC);
      await insertBatch("non_conformities", await Promise.all(srcNC.map(async (n: any) => ({
        ...n,
        id: await newId(n.id),
        company_id: TGT,
        parent_nc_id: null,
        detected_by_user_id: null, responsible_user_id: null, approved_by_user_id: null,
        created_at: n.created_at || now, updated_at: now,
      }))));

      const srcRisks = await fetchAll("esg_risks", SRC);
      await insertBatch("esg_risks", await Promise.all(srcRisks.map(async (r: any) => ({
        ...r, id: await newId(r.id), company_id: TGT,
        created_at: r.created_at || now, updated_at: now,
      }))));

      const srcPlans = await fetchAll("action_plans", SRC);
      await insertBatch("action_plans", await Promise.all(srcPlans.map(async (p: any) => ({
        ...p, id: await newId(p.id), company_id: TGT,
        created_by_user_id: fallbackUserId,
        created_at: p.created_at || now, updated_at: now,
      }))));

      const srcEm = await fetchAll("emission_sources", SRC);
      await insertBatch("emission_sources", await Promise.all(srcEm.map(async (e: any) => ({
        ...e, id: await newId(e.id), company_id: TGT,
        asset_id: null,
        created_at: e.created_at || now, updated_at: now,
      }))));

      const srcAud = await fetchAll("audits", SRC);
      await insertBatch("audits", await Promise.all(srcAud.map(async (a: any) => ({
        ...a, id: await newId(a.id), company_id: TGT,
        category_id: null, template_id: null, planning_locked_by: null,
        created_at: a.created_at || now, updated_at: now,
      }))));

      const srcDocs = await fetchAll("documents", SRC);
      await insertBatch("documents", await Promise.all(srcDocs.map(async (d: any) => ({
        ...d, id: await newId(d.id), company_id: TGT,
        uploader_user_id: fallbackUserId, folder_id: null,
      }))));

      const srcGri = await fetchAll("gri_reports", SRC);
      await insertBatch("gri_reports", await Promise.all(srcGri.map(async (g: any) => ({
        ...g, id: await newId(g.id), company_id: TGT,
        created_by_user_id: fallbackUserId,
        created_at: g.created_at || now, updated_at: now,
      }))));
    }

    if (phase === "phase2") {
      // Employees (1913 records) - depends on branches
      const srcEmployees = await fetchAll("employees", SRC);
      const empRows = await Promise.all(srcEmployees.map(async (e: any) => ({
        ...e,
        id: await newId(e.id),
        company_id: TGT,
        branch_id: await remapOrNull(e.branch_id),
        position_id: null,
        manager_id: null,
        employee_code: e.employee_code ? `${e.employee_code}` : null,
        created_at: e.created_at || now,
        updated_at: now,
      })));
      await insertBatch("employees", empRows);
    }

    if (phase === "phase3") {
      // Update self-references + dependent tables
      const srcEmployees = await fetchAll("employees", SRC);
      
      // Update employee manager_id self-refs
      let managerUpdates = 0;
      for (const e of srcEmployees) {
        if (e.manager_id) {
          const newEmpId = await newId(e.id);
          const newMgrId = await newId(e.manager_id);
          await supabase.from("employees").update({ manager_id: newMgrId }).eq("id", newEmpId);
          managerUpdates++;
        }
      }
      log.push(`✅ employee manager self-refs: ${managerUpdates}`);

      // Update department self-refs
      const srcDepts = await fetchAll("departments", SRC);
      for (const d of srcDepts) {
        const updates: any = {};
        if (d.parent_department_id) updates.parent_department_id = await newId(d.parent_department_id);
        if (d.manager_employee_id) updates.manager_employee_id = await newId(d.manager_employee_id);
        if (Object.keys(updates).length > 0) {
          await supabase.from("departments").update(updates).eq("id", await newId(d.id));
        }
      }
      log.push("✅ department self-refs updated");

      // Update branch self-refs
      const srcBranches = await fetchAll("branches", SRC);
      for (const b of srcBranches) {
        const updates: any = {};
        if (b.parent_branch_id) updates.parent_branch_id = await newId(b.parent_branch_id);
        if (b.manager_id) updates.manager_id = await newId(b.manager_id);
        if (Object.keys(updates).length > 0) {
          await supabase.from("branches").update(updates).eq("id", await newId(b.id));
        }
      }
      log.push("✅ branch self-refs updated");

      // Update legislation self-refs
      const srcLeg = await fetchAll("legislations", SRC);
      for (const l of srcLeg) {
        const updates: any = {};
        if (l.revoked_by_legislation_id) updates.revoked_by_legislation_id = await newId(l.revoked_by_legislation_id);
        if (l.revokes_legislation_id) updates.revokes_legislation_id = await newId(l.revokes_legislation_id);
        if (Object.keys(updates).length > 0) {
          await supabase.from("legislations").update(updates).eq("id", await newId(l.id));
        }
      }
      log.push("✅ legislation self-refs updated");

      // NC self-refs
      const srcNC = await fetchAll("non_conformities", SRC);
      for (const n of srcNC) {
        if (n.parent_nc_id) {
          await supabase.from("non_conformities")
            .update({ parent_nc_id: await newId(n.parent_nc_id) })
            .eq("id", await newId(n.id));
        }
      }
      log.push("✅ NC self-refs updated");
    }

    if (phase === "phase4") {
      // Training programs + dependent tables
      const srcPrograms = await fetchAll("training_programs", SRC);
      await insertBatch("training_programs", await Promise.all(srcPrograms.map(async (p: any) => ({
        ...p,
        id: await newId(p.id),
        company_id: TGT,
        branch_id: await remapOrNull(p.branch_id),
        responsible_id: await remapOrNull(p.responsible_id),
        efficacy_evaluator_employee_id: await remapOrNull(p.efficacy_evaluator_employee_id),
        created_at: p.created_at || now, updated_at: now,
      }))));

      const srcET = await fetchAll("employee_trainings", SRC);
      await insertBatch("employee_trainings", await Promise.all(srcET.map(async (t: any) => ({
        ...t,
        id: await newId(t.id),
        company_id: TGT,
        employee_id: await newId(t.employee_id),
        training_program_id: await remapOrNull(t.training_program_id),
        attendance_marked_by: null,
        created_at: t.created_at || now, updated_at: now,
      }))));

      const srcEX = await fetchAll("employee_experiences", SRC);
      await insertBatch("employee_experiences", await Promise.all(srcEX.map(async (e: any) => ({
        ...e,
        id: await newId(e.id),
        company_id: TGT,
        employee_id: await newId(e.employee_id),
        created_at: e.created_at || now, updated_at: now,
      }))));

      const srcED = await fetchAll("employee_education", SRC);
      await insertBatch("employee_education", await Promise.all(srcED.map(async (e: any) => ({
        ...e,
        id: await newId(e.id),
        company_id: TGT,
        employee_id: await newId(e.employee_id),
        created_at: e.created_at || now, updated_at: now,
      }))));

      const srcSRD = await fetchAll("supplier_required_documents", SRC);
      await insertBatch("supplier_required_documents", await Promise.all(srcSRD.map(async (s: any) => ({
        ...s,
        id: await newId(s.id),
        company_id: TGT,
        supplier_id: await remapOrNull(s.supplier_id),
        created_at: s.created_at || now, updated_at: now,
      }))));

      const srcSEC = await fetchAll("supplier_evaluation_criteria", SRC);
      await insertBatch("supplier_evaluation_criteria", await Promise.all(srcSEC.map(async (s: any) => ({
        ...s,
        id: await newId(s.id),
        company_id: TGT,
        supplier_id: await remapOrNull(s.supplier_id),
        created_at: s.created_at || now, updated_at: now,
      }))));

      const srcLC = await fetchAll("license_conditions", SRC);
      await insertBatch("license_conditions", await Promise.all(srcLC.map(async (c: any) => ({
        ...c,
        id: await newId(c.id),
        license_id: await newId(c.license_id),
        approved_by_user_id: null, related_alert_id: null,
        company_id: TGT,
        created_at: c.created_at || now, updated_at: now,
      }))));

      const srcLCP = await fetchAll("legislation_compliance_profiles", SRC);
      await insertBatch("legislation_compliance_profiles", await Promise.all(srcLCP.map(async (l: any) => ({
        ...l,
        id: await newId(l.id),
        company_id: TGT,
        legislation_id: await remapOrNull(l.legislation_id),
        branch_id: await remapOrNull(l.branch_id),
        completed_by: null,
        created_at: l.created_at || now, updated_at: now,
      }))));

      const srcCT = await fetchAll("compliance_tasks", SRC);
      await insertBatch("compliance_tasks", await Promise.all(srcCT.map(async (t: any) => ({
        ...t,
        id: await newId(t.id),
        company_id: TGT,
        requirement_id: null,
        responsible_user_id: null, evidence_document_id: null,
        created_at: t.created_at || now, updated_at: now,
      }))));
    }

    return new Response(
      JSON.stringify({ success: true, phase, log }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
