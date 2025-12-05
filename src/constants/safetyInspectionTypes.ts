export const INSPECTION_TYPES = [
  { value: 'epi', label: 'Inspeção de EPI' },
  { value: 'area_trabalho', label: 'Inspeção de Área de Trabalho' },
  { value: 'equipamentos', label: 'Inspeção de Equipamentos' },
  { value: 'extintores', label: 'Inspeção de Extintores' },
  { value: 'nr_compliance', label: 'Verificação de Conformidade NR' },
  { value: 'permissao_trabalho', label: 'Permissão de Trabalho' },
  { value: 'ronda_seguranca', label: 'Ronda de Segurança' },
  { value: 'veiculo', label: 'Inspeção de Veículo' },
  { value: 'ordem_servico', label: 'Ordem de Serviço de Segurança' },
] as const;

export const INSPECTION_STATUSES = [
  { value: 'Pendente', label: 'Pendente' },
  { value: 'Em Andamento', label: 'Em Andamento' },
  { value: 'Concluída', label: 'Concluída' },
  { value: 'Cancelada', label: 'Cancelada' },
] as const;

export const INSPECTION_RESULTS = [
  { value: 'Conforme', label: 'Conforme' },
  { value: 'Não Conforme', label: 'Não Conforme' },
  { value: 'Parcialmente Conforme', label: 'Parcialmente Conforme' },
] as const;

export interface ChecklistTemplate {
  id: string;
  item: string;
  category: string;
}

export const CHECKLIST_TEMPLATES: Record<string, ChecklistTemplate[]> = {
  epi: [
    { id: '1', item: 'Capacete em bom estado', category: 'Cabeça' },
    { id: '2', item: 'Óculos de proteção limpos e sem riscos', category: 'Olhos' },
    { id: '3', item: 'Protetor auricular disponível', category: 'Audição' },
    { id: '4', item: 'Luvas adequadas para a atividade', category: 'Mãos' },
    { id: '5', item: 'Calçado de segurança com CA válido', category: 'Pés' },
    { id: '6', item: 'Uniforme em condições adequadas', category: 'Corpo' },
    { id: '7', item: 'Máscara respiratória (se aplicável)', category: 'Respiratório' },
    { id: '8', item: 'Cinto de segurança (se trabalho em altura)', category: 'Corpo' },
  ],
  area_trabalho: [
    { id: '1', item: 'Piso limpo e sem obstruções', category: 'Organização' },
    { id: '2', item: 'Iluminação adequada', category: 'Ambiente' },
    { id: '3', item: 'Sinalização de segurança visível', category: 'Sinalização' },
    { id: '4', item: 'Saídas de emergência desobstruídas', category: 'Emergência' },
    { id: '5', item: 'Extintores acessíveis e sinalizados', category: 'Emergência' },
    { id: '6', item: 'Equipamentos com proteção adequada', category: 'Equipamentos' },
    { id: '7', item: 'Ventilação adequada', category: 'Ambiente' },
    { id: '8', item: 'Materiais armazenados corretamente', category: 'Organização' },
  ],
  equipamentos: [
    { id: '1', item: 'Equipamento em bom estado de conservação', category: 'Geral' },
    { id: '2', item: 'Dispositivos de segurança funcionando', category: 'Segurança' },
    { id: '3', item: 'Botão de emergência operacional', category: 'Emergência' },
    { id: '4', item: 'Manutenção em dia', category: 'Manutenção' },
    { id: '5', item: 'Proteções e guardas instaladas', category: 'Segurança' },
    { id: '6', item: 'Sinalização de riscos visível', category: 'Sinalização' },
  ],
  extintores: [
    { id: '1', item: 'Extintor dentro da validade', category: 'Validade' },
    { id: '2', item: 'Lacre intacto', category: 'Integridade' },
    { id: '3', item: 'Manômetro na faixa verde', category: 'Pressão' },
    { id: '4', item: 'Sinalização adequada', category: 'Sinalização' },
    { id: '5', item: 'Acesso desobstruído', category: 'Acessibilidade' },
    { id: '6', item: 'Suporte fixado corretamente', category: 'Instalação' },
    { id: '7', item: 'Mangueira em bom estado', category: 'Integridade' },
  ],
  nr_compliance: [
    { id: '1', item: 'Documentação de segurança atualizada', category: 'Documentação' },
    { id: '2', item: 'PPRA/PGR vigente', category: 'Documentação' },
    { id: '3', item: 'PCMSO atualizado', category: 'Documentação' },
    { id: '4', item: 'Treinamentos obrigatórios em dia', category: 'Treinamento' },
    { id: '5', item: 'ASOs dentro da validade', category: 'Saúde' },
    { id: '6', item: 'CIPA constituída (se aplicável)', category: 'Organização' },
  ],
  veiculo: [
    { id: '1', item: 'Pneus em bom estado', category: 'Rodagem' },
    { id: '2', item: 'Freios funcionando', category: 'Segurança' },
    { id: '3', item: 'Luzes e sinalização OK', category: 'Sinalização' },
    { id: '4', item: 'Documentação em dia', category: 'Documentação' },
    { id: '5', item: 'Kit de emergência completo', category: 'Emergência' },
    { id: '6', item: 'Extintor válido', category: 'Emergência' },
    { id: '7', item: 'Cintos de segurança funcionando', category: 'Segurança' },
  ],
  ronda_seguranca: [
    { id: '1', item: 'Perímetro seguro', category: 'Segurança' },
    { id: '2', item: 'Portas e acessos trancados', category: 'Acesso' },
    { id: '3', item: 'Iluminação externa funcionando', category: 'Ambiente' },
    { id: '4', item: 'Câmeras operacionais', category: 'Vigilância' },
    { id: '5', item: 'Alarmes testados', category: 'Emergência' },
  ],
  permissao_trabalho: [
    { id: '1', item: 'Análise de risco realizada', category: 'Análise' },
    { id: '2', item: 'EPIs adequados disponíveis', category: 'EPI' },
    { id: '3', item: 'Área isolada e sinalizada', category: 'Isolamento' },
    { id: '4', item: 'Equipamentos de emergência próximos', category: 'Emergência' },
    { id: '5', item: 'Comunicação estabelecida', category: 'Comunicação' },
    { id: '6', item: 'Trabalhadores treinados', category: 'Treinamento' },
  ],
  ordem_servico: [
    { id: '1', item: 'OS emitida e assinada', category: 'Documentação' },
    { id: '2', item: 'Riscos identificados', category: 'Análise' },
    { id: '3', item: 'Medidas de controle definidas', category: 'Controle' },
    { id: '4', item: 'Responsável designado', category: 'Responsabilidade' },
  ],
};

export const getInspectionTypeLabel = (value: string): string => {
  const type = INSPECTION_TYPES.find(t => t.value === value);
  return type?.label || value;
};
