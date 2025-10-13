// Bulk import actions for write tools

export async function bulkImportEmissionsAction(
  args: any,
  companyId: string,
  userId: string,
  supabase: any
) {
  console.log('[BULK IMPORT] Importing emissions:', { count: args.emissions?.length });

  if (!args.emissions || !Array.isArray(args.emissions) || args.emissions.length === 0) {
    return {
      success: false,
      error: 'Lista de emissões vazia ou inválida'
    };
  }

  const results = {
    success: true,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [] as Array<{ record: any; error: string }>
  };

  for (const emission of args.emissions) {
    try {
      // Validate required fields
      if (!emission.source_name || !emission.scope) {
        results.errors.push({
          record: emission,
          error: 'Campos obrigatórios faltando: source_name ou scope'
        });
        results.skipped++;
        continue;
      }

      // Check for duplicate
      const { data: existing } = await supabase
        .from('emission_sources')
        .select('id')
        .eq('company_id', companyId)
        .eq('source_name', emission.source_name)
        .eq('scope', emission.scope)
        .maybeSingle();

      if (existing && args.skip_duplicates) {
        results.skipped++;
        continue;
      }

      if (existing && args.update_existing) {
        // Update existing source
        const { error: updateError } = await supabase
          .from('emission_sources')
          .update({
            category: emission.category,
            description: emission.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (updateError) {
          results.errors.push({ record: emission, error: updateError.message });
        } else {
          results.updated++;
        }
      } else if (!existing) {
        // Insert new source
        const { data: newSource, error: insertError } = await supabase
          .from('emission_sources')
          .insert({
            company_id: companyId,
            source_name: emission.source_name,
            scope: emission.scope,
            category: emission.category || 'Outros',
            description: emission.description,
            created_by_user_id: userId
          })
          .select()
          .single();

        if (insertError) {
          results.errors.push({ record: emission, error: insertError.message });
          continue;
        }

        // If there's activity data, create it
        if (emission.quantity && emission.period_start && newSource) {
          await supabase.from('activity_data').insert({
            company_id: companyId,
            emission_source_id: newSource.id,
            quantity: emission.quantity,
            unit: emission.unit || 'L',
            period_start_date: emission.period_start,
            period_end_date: emission.period_end || emission.period_start,
            created_by_user_id: userId
          });
        }

        results.inserted++;
      }
    } catch (error: any) {
      results.errors.push({ record: emission, error: error.message });
    }
  }

  return {
    ...results,
    message: `Importação concluída: ${results.inserted} inseridos, ${results.updated} atualizados, ${results.skipped} ignorados, ${results.errors.length} erros`
  };
}

export async function bulkImportEmployeesAction(
  args: any,
  companyId: string,
  userId: string,
  supabase: any
) {
  console.log('[BULK IMPORT] Importing employees:', { count: args.employees?.length });

  if (!args.employees || !Array.isArray(args.employees) || args.employees.length === 0) {
    return {
      success: false,
      error: 'Lista de funcionários vazia ou inválida'
    };
  }

  const results = {
    success: true,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [] as Array<{ record: any; error: string }>
  };

  for (const employee of args.employees) {
    try {
      // Validate required fields
      if (!employee.full_name) {
        results.errors.push({
          record: employee,
          error: 'Nome completo é obrigatório'
        });
        results.skipped++;
        continue;
      }

      // Check for duplicate by email or CPF
      let existing = null;
      if (employee.email) {
        const { data } = await supabase
          .from('employees')
          .select('id')
          .eq('company_id', companyId)
          .eq('email', employee.email)
          .maybeSingle();
        existing = data;
      }

      if (!existing && employee.cpf) {
        const { data } = await supabase
          .from('employees')
          .select('id')
          .eq('company_id', companyId)
          .eq('cpf', employee.cpf.replace(/\D/g, ''))
          .maybeSingle();
        existing = data;
      }

      if (existing && args.skip_duplicates) {
        results.skipped++;
        continue;
      }

      const employeeData = {
        company_id: companyId,
        full_name: employee.full_name,
        email: employee.email,
        cpf: employee.cpf?.replace(/\D/g, ''),
        department: employee.department,
        position: employee.position,
        hire_date: employee.hire_date,
        birth_date: employee.birth_date,
        gender: employee.gender,
        status: 'Ativo'
      };

      if (existing && args.update_existing) {
        const { error: updateError } = await supabase
          .from('employees')
          .update(employeeData)
          .eq('id', existing.id);

        if (updateError) {
          results.errors.push({ record: employee, error: updateError.message });
        } else {
          results.updated++;
        }
      } else if (!existing) {
        const { error: insertError } = await supabase
          .from('employees')
          .insert(employeeData);

        if (insertError) {
          results.errors.push({ record: employee, error: insertError.message });
        } else {
          results.inserted++;
        }
      }
    } catch (error: any) {
      results.errors.push({ record: employee, error: error.message });
    }
  }

  return {
    ...results,
    message: `Importação concluída: ${results.inserted} inseridos, ${results.updated} atualizados, ${results.skipped} ignorados, ${results.errors.length} erros`
  };
}

export async function bulkImportGoalsAction(
  args: any,
  companyId: string,
  userId: string,
  supabase: any
) {
  console.log('[BULK IMPORT] Importing goals:', { count: args.goals?.length });

  if (!args.goals || !Array.isArray(args.goals) || args.goals.length === 0) {
    return {
      success: false,
      error: 'Lista de metas vazia ou inválida'
    };
  }

  const results = {
    success: true,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [] as Array<{ record: any; error: string }>
  };

  for (const goal of args.goals) {
    try {
      // Validate required fields
      if (!goal.goal_name || goal.target_value === undefined) {
        results.errors.push({
          record: goal,
          error: 'Campos obrigatórios faltando: goal_name ou target_value'
        });
        results.skipped++;
        continue;
      }

      // Check for duplicate by name
      const { data: existing } = await supabase
        .from('goals')
        .select('id')
        .eq('company_id', companyId)
        .eq('goal_name', goal.goal_name)
        .maybeSingle();

      if (existing && args.skip_duplicates) {
        results.skipped++;
        continue;
      }

      const goalData = {
        company_id: companyId,
        goal_name: goal.goal_name,
        category: goal.category || 'Ambiental',
        target_value: goal.target_value,
        baseline_value: goal.baseline_value || 0,
        target_date: goal.target_date,
        unit: goal.unit,
        description: goal.description,
        status: 'Ativa',
        progress: 0,
        created_by_user_id: userId
      };

      if (existing && args.update_existing) {
        const { error: updateError } = await supabase
          .from('goals')
          .update(goalData)
          .eq('id', existing.id);

        if (updateError) {
          results.errors.push({ record: goal, error: updateError.message });
        } else {
          results.updated++;
        }
      } else if (!existing) {
        const { error: insertError } = await supabase
          .from('goals')
          .insert(goalData);

        if (insertError) {
          results.errors.push({ record: goal, error: insertError.message });
        } else {
          results.inserted++;
        }
      }
    } catch (error: any) {
      results.errors.push({ record: goal, error: error.message });
    }
  }

  return {
    ...results,
    message: `Importação concluída: ${results.inserted} inseridos, ${results.updated} atualizados, ${results.skipped} ignorados, ${results.errors.length} erros`
  };
}

export async function bulkImportWasteAction(
  args: any,
  companyId: string,
  userId: string,
  supabase: any
) {
  console.log('[BULK IMPORT] Importing waste logs:', { count: args.waste?.length });

  if (!args.waste || !Array.isArray(args.waste) || args.waste.length === 0) {
    return {
      success: false,
      error: 'Lista de resíduos vazia ou inválida'
    };
  }

  const results = {
    success: true,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [] as Array<{ record: any; error: string }>
  };

  for (const waste of args.waste) {
    try {
      // Validate required fields
      if (!waste.waste_type || !waste.quantity) {
        results.errors.push({
          record: waste,
          error: 'Campos obrigatórios faltando: waste_type ou quantity'
        });
        results.skipped++;
        continue;
      }

      const wasteData = {
        company_id: companyId,
        waste_type: waste.waste_type,
        waste_class: waste.waste_class || 'IIA',
        quantity: waste.quantity,
        unit: waste.unit || 'kg',
        disposal_method: waste.disposal_method,
        log_date: waste.log_date || new Date().toISOString().split('T')[0],
        notes: waste.notes
      };

      const { error: insertError } = await supabase
        .from('waste_logs')
        .insert(wasteData);

      if (insertError) {
        results.errors.push({ record: waste, error: insertError.message });
      } else {
        results.inserted++;
      }
    } catch (error: any) {
      results.errors.push({ record: waste, error: error.message });
    }
  }

  return {
    ...results,
    message: `Importação concluída: ${results.inserted} inseridos, ${results.errors.length} erros`
  };
}
