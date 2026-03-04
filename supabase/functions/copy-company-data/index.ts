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

    const { sourceCompanyId, targetCompanyId, cleanFirst } = await req.json();
    if (!sourceCompanyId || !targetCompanyId) {
      throw new Error("sourceCompanyId and targetCompanyId are required");
    }

    // Clean up any previously inserted data if requested
    if (cleanFirst) {
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
        await supabase.from(t).delete().eq("company_id", targetCompanyId);
      }
    }

    // Fallback user for NOT NULL user_id fields
    const { data: fallbackProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("company_id", targetCompanyId)
      .limit(1)
      .single();

    const fallbackUserId = fallbackProfile?.id;
    if (!fallbackUserId) throw new Error("No user found in target company");

    const idMap = new Map<string, string>();
    const log: string[] = [];

    function newId(oldId: string): string {
      if (!idMap.has(oldId)) {
        idMap.set(oldId, crypto.randomUUID());
      }
      return idMap.get(oldId)!;
    }

    function remapOrNull(oldId: string | null): string | null {
      if (!oldId) return null;
      return idMap.get(oldId) ?? null;
    }

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

    // ===== PHASE 1: Independent tables =====

    // 1a. Departments (without self-refs and employee refs initially)
    const srcDepts = await fetchAll("departments", sourceCompanyId);
    const deptRows = srcDepts.map((d: any) => ({
      id: newId(d.id),
      company_id: targetCompanyId,
      name: d.name,
      description: d.description,
      parent_department_id: null, // will update later
      manager_employee_id: null, // will update later
      budget: d.budget,
      cost_center: d.cost_center,
      created_at: d.created_at || now,
      updated_at: now,
    }));
    await insertBatch("departments", deptRows);

    // 1b. Branches (without self-refs initially)
    const srcBranches = await fetchAll("branches", sourceCompanyId);
    const branchRows = srcBranches.map((b: any) => ({
      id: newId(b.id),
      company_id: targetCompanyId,
      name: b.name,
      code: b.code,
      is_headquarters: b.is_headquarters,
      address: b.address,
      city: b.city,
      state: b.state,
      country: b.country,
      phone: b.phone,
      manager_id: null, // will update later
      status: b.status,
      created_at: b.created_at || now,
      updated_at: now,
      latitude: b.latitude,
      longitude: b.longitude,
      cep: b.cep,
      neighborhood: b.neighborhood,
      street_number: b.street_number,
      cnpj: null, // avoid unique constraint conflicts
      parent_branch_id: null, // will update later
    }));
    await insertBatch("branches", branchRows);

    // 1c. Legislations (without self-refs)
    const srcLeg = await fetchAll("legislations", sourceCompanyId);
    const legRows = srcLeg.map((l: any) => ({
      ...l,
      id: newId(l.id),
      company_id: targetCompanyId,
      created_by: null,
      responsible_user_id: null,
      revoked_by_legislation_id: null,
      revokes_legislation_id: null,
      theme_id: l.theme_id, // these are global, keep as-is
      subtheme_id: l.subtheme_id,
      created_at: l.created_at || now,
      updated_at: now,
    }));
    await insertBatch("legislations", legRows);

    // 1d. Supplier management
    const srcSuppliers = await fetchAll("supplier_management", sourceCompanyId);
    const supplierRows = srcSuppliers.map((s: any) => ({
      ...s,
      id: newId(s.id),
      company_id: targetCompanyId,
      status_changed_by: null,
      access_code: null, // unique constraint
      temporary_password: null,
      password_hash: null,
      created_at: s.created_at || now,
      updated_at: now,
    }));
    await insertBatch("supplier_management", supplierRows);

    // 1e. Licenses (remap branch_id)
    const srcLicenses = await fetchAll("licenses", sourceCompanyId);
    const licenseRows = srcLicenses.map((l: any) => ({
      ...l,
      id: newId(l.id),
      company_id: targetCompanyId,
      branch_id: remapOrNull(l.branch_id),
      asset_id: null, // assets not copied
      responsible_user_id: null,
      created_at: l.created_at || now,
      updated_at: now,
    }));
    await insertBatch("licenses", licenseRows);

    // 1f. Non-conformities (without self-ref)
    const srcNC = await fetchAll("non_conformities", sourceCompanyId);
    const ncRows = srcNC.map((n: any) => ({
      ...n,
      id: newId(n.id),
      company_id: targetCompanyId,
      parent_nc_id: null,
      detected_by_user_id: null,
      responsible_user_id: null,
      approved_by_user_id: null,
      created_at: n.created_at || now,
      updated_at: now,
    }));
    await insertBatch("non_conformities", ncRows);

    // 1g. ESG risks
    const srcRisks = await fetchAll("esg_risks", sourceCompanyId);
    const riskRows = srcRisks.map((r: any) => ({
      ...r,
      id: newId(r.id),
      company_id: targetCompanyId,
      created_at: r.created_at || now,
      updated_at: now,
    }));
    await insertBatch("esg_risks", riskRows);

    // 1h. Action plans (created_by_user_id NOT NULL)
    const srcPlans = await fetchAll("action_plans", sourceCompanyId);
    const planRows = srcPlans.map((p: any) => ({
      ...p,
      id: newId(p.id),
      company_id: targetCompanyId,
      created_by_user_id: fallbackUserId,
      created_at: p.created_at || now,
      updated_at: now,
    }));
    await insertBatch("action_plans", planRows);

    // 1i. Emission sources
    const srcEmissions = await fetchAll("emission_sources", sourceCompanyId);
    const emissionRows = srcEmissions.map((e: any) => ({
      ...e,
      id: newId(e.id),
      company_id: targetCompanyId,
      asset_id: null,
      created_at: e.created_at || now,
      updated_at: now,
    }));
    await insertBatch("emission_sources", emissionRows);

    // 1j. Audits
    const srcAudits = await fetchAll("audits", sourceCompanyId);
    const auditRows = srcAudits.map((a: any) => ({
      ...a,
      id: newId(a.id),
      company_id: targetCompanyId,
      category_id: null,
      template_id: null,
      planning_locked_by: null,
      created_at: a.created_at || now,
      updated_at: now,
    }));
    await insertBatch("audits", auditRows);

    // 1k. Documents (uploader_user_id NOT NULL)
    const srcDocs = await fetchAll("documents", sourceCompanyId);
    const docRows = srcDocs.map((d: any) => ({
      ...d,
      id: newId(d.id),
      company_id: targetCompanyId,
      uploader_user_id: fallbackUserId,
      folder_id: null,
      created_at: d.created_at || now,
    }));
    await insertBatch("documents", docRows);

    // 1l. GRI reports
    const srcGri = await fetchAll("gri_reports", sourceCompanyId);
    const griRows = srcGri.map((g: any) => ({
      ...g,
      id: newId(g.id),
      company_id: targetCompanyId,
      created_by_user_id: fallbackUserId,
      created_at: g.created_at || now,
      updated_at: now,
    }));
    await insertBatch("gri_reports", griRows);

    // ===== PHASE 2: Employees (depends on branches) =====
    const srcEmployees = await fetchAll("employees", sourceCompanyId);
    const empRows = srcEmployees.map((e: any, idx: number) => ({
      ...e,
      id: newId(e.id),
      company_id: targetCompanyId,
      branch_id: remapOrNull(e.branch_id),
      position_id: null, // positions not copied
      manager_id: null, // will update after all employees inserted
      employee_code: e.employee_code ? `${e.employee_code}-CPY` : null, // unique constraint (company_id, employee_code)
      created_at: e.created_at || now,
      updated_at: now,
    }));
    await insertBatch("employees", empRows);

    // Update self-references for employees (manager_id)
    for (const e of srcEmployees) {
      if (e.manager_id && idMap.has(e.manager_id)) {
        await supabase
          .from("employees")
          .update({ manager_id: idMap.get(e.manager_id) })
          .eq("id", idMap.get(e.id));
      }
    }
    log.push("✅ employees manager_id self-refs updated");

    // Update self-references for departments
    for (const d of srcDepts) {
      const updates: any = {};
      if (d.parent_department_id && idMap.has(d.parent_department_id)) {
        updates.parent_department_id = idMap.get(d.parent_department_id);
      }
      if (d.manager_employee_id && idMap.has(d.manager_employee_id)) {
        updates.manager_employee_id = idMap.get(d.manager_employee_id);
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from("departments").update(updates).eq("id", idMap.get(d.id));
      }
    }
    log.push("✅ departments self-refs updated");

    // Update self-references for branches
    for (const b of srcBranches) {
      const updates: any = {};
      if (b.parent_branch_id && idMap.has(b.parent_branch_id)) {
        updates.parent_branch_id = idMap.get(b.parent_branch_id);
      }
      if (b.manager_id && idMap.has(b.manager_id)) {
        updates.manager_id = idMap.get(b.manager_id);
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from("branches").update(updates).eq("id", idMap.get(b.id));
      }
    }
    log.push("✅ branches self-refs updated");

    // Update self-references for legislations
    for (const l of srcLeg) {
      const updates: any = {};
      if (l.revoked_by_legislation_id && idMap.has(l.revoked_by_legislation_id)) {
        updates.revoked_by_legislation_id = idMap.get(l.revoked_by_legislation_id);
      }
      if (l.revokes_legislation_id && idMap.has(l.revokes_legislation_id)) {
        updates.revokes_legislation_id = idMap.get(l.revokes_legislation_id);
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from("legislations").update(updates).eq("id", idMap.get(l.id));
      }
    }
    log.push("✅ legislations self-refs updated");

    // Update non_conformities self-refs
    for (const n of srcNC) {
      if (n.parent_nc_id && idMap.has(n.parent_nc_id)) {
        await supabase
          .from("non_conformities")
          .update({ parent_nc_id: idMap.get(n.parent_nc_id) })
          .eq("id", idMap.get(n.id));
      }
    }
    log.push("✅ non_conformities self-refs updated");

    // ===== PHASE 3: Training programs (depends on branches + employees) =====
    const srcPrograms = await fetchAll("training_programs", sourceCompanyId);
    const programRows = srcPrograms.map((p: any) => ({
      ...p,
      id: newId(p.id),
      company_id: targetCompanyId,
      branch_id: remapOrNull(p.branch_id),
      responsible_id: remapOrNull(p.responsible_id),
      efficacy_evaluator_employee_id: remapOrNull(p.efficacy_evaluator_employee_id),
      created_at: p.created_at || now,
      updated_at: now,
    }));
    await insertBatch("training_programs", programRows);

    // ===== PHASE 4: Dependent tables =====

    // 4a. Employee trainings
    const srcET = await fetchAll("employee_trainings", sourceCompanyId);
    const etRows = srcET.map((t: any) => ({
      ...t,
      id: newId(t.id),
      company_id: targetCompanyId,
      employee_id: idMap.get(t.employee_id)!,
      training_program_id: remapOrNull(t.training_program_id),
      attendance_marked_by: null,
      created_at: t.created_at || now,
      updated_at: now,
    }));
    await insertBatch("employee_trainings", etRows);

    // 4b. Employee experiences
    const srcEX = await fetchAll("employee_experiences", sourceCompanyId);
    const exRows = srcEX.map((e: any) => ({
      ...e,
      id: newId(e.id),
      company_id: targetCompanyId,
      employee_id: idMap.get(e.employee_id)!,
      created_at: e.created_at || now,
      updated_at: now,
    }));
    await insertBatch("employee_experiences", exRows);

    // 4c. Employee education
    const srcED = await fetchAll("employee_education", sourceCompanyId);
    const edRows = srcED.map((e: any) => ({
      ...e,
      id: newId(e.id),
      company_id: targetCompanyId,
      employee_id: idMap.get(e.employee_id)!,
      created_at: e.created_at || now,
      updated_at: now,
    }));
    await insertBatch("employee_education", edRows);

    // 4d. Supplier required documents
    const srcSRD = await fetchAll("supplier_required_documents", sourceCompanyId);
    const srdRows = srcSRD.map((s: any) => ({
      ...s,
      id: newId(s.id),
      company_id: targetCompanyId,
      supplier_id: remapOrNull(s.supplier_id),
      created_at: s.created_at || now,
      updated_at: now,
    }));
    await insertBatch("supplier_required_documents", srdRows);

    // 4e. Supplier evaluation criteria
    const srcSEC = await fetchAll("supplier_evaluation_criteria", sourceCompanyId);
    const secRows = srcSEC.map((s: any) => ({
      ...s,
      id: newId(s.id),
      company_id: targetCompanyId,
      supplier_id: remapOrNull(s.supplier_id),
      created_at: s.created_at || now,
      updated_at: now,
    }));
    await insertBatch("supplier_evaluation_criteria", secRows);

    // 4f. License conditions
    const srcLC = await fetchAll("license_conditions", sourceCompanyId);
    const lcRows = srcLC.map((c: any) => ({
      ...c,
      id: newId(c.id),
      license_id: idMap.get(c.license_id)!,
      approved_by_user_id: null,
      related_alert_id: null,
      company_id: targetCompanyId,
      created_at: c.created_at || now,
      updated_at: now,
    }));
    await insertBatch("license_conditions", lcRows);

    // 4g. Legislation compliance profiles
    const srcLCP = await fetchAll("legislation_compliance_profiles", sourceCompanyId);
    const lcpRows = srcLCP.map((l: any) => ({
      ...l,
      id: newId(l.id),
      company_id: targetCompanyId,
      legislation_id: remapOrNull(l.legislation_id),
      branch_id: remapOrNull(l.branch_id),
      completed_by: null,
      created_at: l.created_at || now,
      updated_at: now,
    }));
    await insertBatch("legislation_compliance_profiles", lcpRows);

    // 4h. Compliance tasks
    const srcCT = await fetchAll("compliance_tasks", sourceCompanyId);
    const ctRows = srcCT.map((t: any) => ({
      ...t,
      id: newId(t.id),
      company_id: targetCompanyId,
      requirement_id: remapOrNull(t.requirement_id),
      responsible_user_id: null,
      evidence_document_id: null,
      created_at: t.created_at || now,
      updated_at: now,
    }));
    await insertBatch("compliance_tasks", ctRows);

    return new Response(
      JSON.stringify({
        success: true,
        totalMappings: idMap.size,
        log,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
