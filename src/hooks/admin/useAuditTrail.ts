import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import type { Json } from '@/integrations/supabase/types';

export interface AuditTrailFilters {
  userId?: string;
  actionType?: string;
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
}

export interface AuditLogEntry {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  action_type: string;
  description: string;
  details_json: Json;
  created_at: string;
  company_id: string;
}

export interface PaginatedAuditResult {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  totalPages: number;
}

const ACTION_TYPE_LABELS: Record<string, string> = {
  CREATE: 'Criação',
  UPDATE: 'Atualização',
  DELETE: 'Exclusão',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  user_created: 'Usuário Criado',
  user_updated: 'Usuário Atualizado',
  user_deleted: 'Usuário Excluído',
  admin_user_created: 'Usuário Criado (Admin)',
  admin_user_updated: 'Usuário Atualizado (Admin)',
  admin_user_role_changed: 'Role Alterado',
  admin_user_deactivated: 'Usuário Desativado',
  admin_user_deleted: 'Usuário Excluído (Admin)',
  admin_password_reset_sent: 'Reset Senha Enviado',
  audit_created: 'Auditoria Criada',
  audit_updated: 'Auditoria Atualizada',
  audit_finding_created: 'Achado Criado',
  settings_updated: 'Configuração Alterada',
};

export const useAuditTrail = (filters: AuditTrailFilters) => {
  const fetchAuditLogs = async (): Promise<PaginatedAuditResult> => {
    const { page, limit, userId, actionType, startDate, endDate } = filters;
    const offset = (page - 1) * limit;

    // Get 90 days ago for retention policy
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    let query = supabase
      .from('activity_logs')
      .select(`
        id,
        user_id,
        action_type,
        description,
        details_json,
        created_at,
        company_id,
        profiles!activity_logs_user_id_fkey(full_name, email)
      `, { count: 'exact' })
      .gte('created_at', ninetyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (actionType) {
      query = query.eq('action_type', actionType);
    }

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      query = query.lte('created_at', endOfDay.toISOString());
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Erro ao buscar logs: ${error.message}`);
    }

    const logs: AuditLogEntry[] = (data || []).map((log: any) => ({
      id: log.id,
      user_id: log.user_id,
      user_name: log.profiles?.full_name || 'Sistema',
      user_email: log.profiles?.email || '',
      action_type: log.action_type,
      description: log.description,
      details_json: log.details_json,
      created_at: log.created_at,
      company_id: log.company_id,
    }));

    return {
      logs,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    };
  };

  const query = useQuery({
    queryKey: ['audit-trail', filters],
    queryFn: fetchAuditLogs,
    staleTime: 1000 * 60, // 1 minute
  });

  return {
    ...query,
    logs: query.data?.logs || [],
    total: query.data?.total || 0,
    totalPages: query.data?.totalPages || 0,
  };
};

export const useAuditUsers = () => {
  return useQuery({
    queryKey: ['audit-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');

      if (error) throw error;
      return data || [];
    },
  });
};

export const useAuditActionTypes = () => {
  return useQuery({
    queryKey: ['audit-action-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('action_type')
        .order('action_type');

      if (error) throw error;
      
      const uniqueTypes = [...new Set(data?.map(d => d.action_type) || [])];
      return uniqueTypes.map(type => ({
        value: type,
        label: ACTION_TYPE_LABELS[type] || type,
      }));
    },
  });
};

export const exportAuditLogsToCSV = async (filters: Omit<AuditTrailFilters, 'page' | 'limit'>) => {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  let query = supabase
    .from('activity_logs')
    .select(`
      id,
      user_id,
      action_type,
      description,
      details_json,
      created_at,
      profiles!activity_logs_user_id_fkey(full_name, email)
    `)
    .gte('created_at', ninetyDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(1000);

  if (filters.userId) {
    query = query.eq('user_id', filters.userId);
  }

  if (filters.actionType) {
    query = query.eq('action_type', filters.actionType);
  }

  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate.toISOString());
  }

  if (filters.endDate) {
    const endOfDay = new Date(filters.endDate);
    endOfDay.setHours(23, 59, 59, 999);
    query = query.lte('created_at', endOfDay.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao exportar logs: ${error.message}`);
  }

  const csvData = (data || []).map((log: any) => ({
    'ID': log.id,
    'Data/Hora': format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss'),
    'Usuário': log.profiles?.full_name || 'Sistema',
    'Email': log.profiles?.email || '',
    'Ação': ACTION_TYPE_LABELS[log.action_type] || log.action_type,
    'Descrição': log.description,
    'Detalhes': JSON.stringify(log.details_json || {}),
  }));

  if (!csvData.length) {
    throw new Error('Nenhum log para exportar');
  }

  const headers = Object.keys(csvData[0]);
  const csvContent = [
    headers.join(','),
    ...csvData.map(row =>
      headers.map(header => {
        const value = row[header as keyof typeof row];
        return typeof value === 'string' && (value.includes(',') || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `audit_logs_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
