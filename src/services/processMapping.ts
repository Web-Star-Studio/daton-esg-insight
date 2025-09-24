import { supabase } from '@/integrations/supabase/client';

export interface ProcessMap {
  id: string;
  name: string;
  description?: string;
  process_type: string;
  status: string;
  version: string;
  canvas_data: any;
  parent_version_id?: string;
  approved_by_user_id?: string;
  approved_at?: string;
  is_current_version: boolean;
  company_id: string;
  created_at: string;
}

export interface ProcessStep {
  id: string;
  process_map_id: string;
  step_type: 'start' | 'end' | 'activity' | 'decision' | 'connector';
  name: string;
  description?: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  properties: any;
  order_index: number;
}

export interface ProcessConnection {
  id: string;
  process_map_id: string;
  from_step_id: string;
  to_step_id: string;
  label?: string;
  condition_text?: string;
}

export interface SIPOCElement {
  id: string;
  process_map_id: string;
  element_type: 'supplier' | 'input' | 'output' | 'customer';
  name: string;
  description?: string;
  stakeholder_id?: string;
  requirements?: string;
  specifications?: string;
  order_index: number;
}

export interface TurtleDiagram {
  id: string;
  process_map_id: string;
  process_step_id?: string;
  inputs: any[];
  outputs: any[];
  resources: any[];
  methods: any[];
  measurements: any[];
  risks: any[];
}

// Process Maps CRUD
export const getProcessMaps = async () => {
  const { data, error } = await supabase
    .from('process_maps')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as ProcessMap[];
};

export const getProcessMapById = async (id: string) => {
  const { data, error } = await supabase
    .from('process_maps')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as ProcessMap;
};

export const createProcessMap = async (processMapData: Omit<ProcessMap, 'id' | 'company_id' | 'created_at'>) => {
  // Get current user's company_id
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) throw new Error('User company not found');

  const { data, error } = await supabase
    .from('process_maps')
    .insert({
      ...processMapData,
      company_id: profile.company_id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ProcessMap;
};

export const updateProcessMap = async (id: string, updates: Partial<ProcessMap>) => {
  const { data, error } = await supabase
    .from('process_maps')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ProcessMap;
};

export const deleteProcessMap = async (id: string) => {
  const { error } = await supabase
    .from('process_maps')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Version Control
export const createProcessMapVersion = async (originalId: string, changes?: any) => {
  const original = await getProcessMapById(originalId);
  
  // Mark current version as not current
  await supabase
    .from('process_maps')
    .update({ is_current_version: false })
    .eq('id', originalId);

  // Create new version
  const newVersion = await createProcessMap({
    name: original.name,
    description: original.description,
    process_type: original.process_type,
    status: 'Draft',
    version: incrementVersion(original.version),
    canvas_data: changes || original.canvas_data,
    parent_version_id: originalId,
    is_current_version: true,
  });

  return newVersion;
};

export const approveProcessMapVersion = async (id: string, approvedByUserId: string) => {
  const { data, error } = await supabase
    .from('process_maps')
    .update({
      status: 'Approved',
      approved_by_user_id: approvedByUserId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Process Steps CRUD
export const getProcessSteps = async (processMapId: string) => {
  const { data, error } = await supabase
    .from('process_steps')
    .select('*')
    .eq('process_map_id', processMapId)
    .order('order_index');

  if (error) throw error;
  return data as ProcessStep[];
};

export const createProcessStep = async (stepData: Omit<ProcessStep, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('process_steps')
    .insert(stepData)
    .select()
    .single();

  if (error) throw error;
  return data as ProcessStep;
};

export const updateProcessStep = async (id: string, updates: Partial<ProcessStep>) => {
  const { data, error } = await supabase
    .from('process_steps')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ProcessStep;
};

export const deleteProcessStep = async (id: string) => {
  const { error } = await supabase
    .from('process_steps')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Process Connections CRUD
export const getProcessConnections = async (processMapId: string) => {
  const { data, error } = await supabase
    .from('process_connections')
    .select('*')
    .eq('process_map_id', processMapId);

  if (error) throw error;
  return data as ProcessConnection[];
};

export const createProcessConnection = async (connectionData: Omit<ProcessConnection, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('process_connections')
    .insert(connectionData)
    .select()
    .single();

  if (error) throw error;
  return data as ProcessConnection;
};

// SIPOC Elements CRUD
export const getSIPOCElements = async (processMapId: string) => {
  const { data, error } = await supabase
    .from('sipoc_elements')
    .select('*')
    .eq('process_map_id', processMapId)
    .order('element_type, order_index');

  if (error) throw error;
  return data as SIPOCElement[];
};

export const createSIPOCElement = async (elementData: Omit<SIPOCElement, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('sipoc_elements')
    .insert(elementData)
    .select()
    .single();

  if (error) throw error;
  return data as SIPOCElement;
};

export const updateSIPOCElement = async (id: string, updates: Partial<SIPOCElement>) => {
  const { data, error } = await supabase
    .from('sipoc_elements')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as SIPOCElement;
};

export const deleteSIPOCElement = async (id: string) => {
  const { error } = await supabase
    .from('sipoc_elements')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const saveSIPOCElements = async (processMapId: string, elements: any[]) => {
  // Delete existing elements
  await supabase
    .from('sipoc_elements')
    .delete()
    .eq('process_map_id', processMapId);

  // Insert new elements
  if (elements.length > 0) {
    const elementsToInsert = elements.map(el => ({
      process_map_id: processMapId,
      element_type: el.element_type,
      name: el.name,
      description: el.description || '',
      requirements: el.requirements || '',
      specifications: el.specifications || '',
      order_index: el.order_index || 0,
    }));

    const { data, error } = await supabase
      .from('sipoc_elements')
      .insert(elementsToInsert)
      .select();

    if (error) throw error;
    return data;
  }
  return [];
};

// Turtle Diagram CRUD
export const getTurtleDiagram = async (processMapId: string, processStepId?: string) => {
  const query = supabase
    .from('turtle_diagrams')
    .select('*')
    .eq('process_map_id', processMapId);

  if (processStepId) {
    query.eq('process_step_id', processStepId);
  } else {
    query.is('process_step_id', null);
  }

  const { data, error } = await query.single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as TurtleDiagram | null;
};

export const saveTurtleDiagram = async (turtleData: Omit<TurtleDiagram, 'id' | 'created_at' | 'updated_at'>) => {
  const existingDiagram = await getTurtleDiagram(
    turtleData.process_map_id,
    turtleData.process_step_id
  );

  if (existingDiagram) {
    const { data, error } = await supabase
      .from('turtle_diagrams')
      .update({
        inputs: turtleData.inputs,
        outputs: turtleData.outputs,
        resources: turtleData.resources,
        methods: turtleData.methods,
        measurements: turtleData.measurements,
        risks: turtleData.risks,
      })
      .eq('id', existingDiagram.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('turtle_diagrams')
      .insert(turtleData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Utility functions
export const incrementVersion = (currentVersion: string): string => {
  const parts = currentVersion.split('.');
  const major = parseInt(parts[0]);
  const minor = parseInt(parts[1] || '0');
  
  return `${major}.${minor + 1}`;
};

export const saveCanvasData = async (processMapId: string, canvasData: any) => {
  const { data, error } = await supabase
    .from('process_maps')
    .update({ canvas_data: canvasData })
    .eq('id', processMapId)
    .select()
    .single();

  if (error) throw error;
  return data;
};