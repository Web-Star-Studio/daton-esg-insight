import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDocumentApprovalLog, getDocumentApprovalLogs } from '@/services/documentApprovalLog';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('documentApprovalLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createDocumentApprovalLog', () => {
    it('should throw error when user is not authenticated', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null
      } as any);

      await expect(
        createDocumentApprovalLog({
          preview_id: '123',
          action: 'approved',
          items_count: 5
        })
      ).rejects.toThrow('User not authenticated');
    });

    it('should throw error when profile is not found', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: { user: { id: 'user123' } } },
        error: null
      } as any);

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            single: vi.fn().mockResolvedValueOnce({ data: null, error: null })
          })
        })
      } as any);

      await expect(
        createDocumentApprovalLog({
          preview_id: '123',
          action: 'approved',
          items_count: 5
        })
      ).rejects.toThrow('User profile not found');
    });

    it('should create approval log successfully', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: { user: { id: 'user123' } } },
        error: null
      } as any);

      const mockFrom = vi.fn();
      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      // Mock profile query
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { company_id: 'company123' },
              error: null
            })
          })
        })
      } as any);

      // Mock insert query
      mockFrom.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ data: null, error: null })
      } as any);

      await createDocumentApprovalLog({
        preview_id: '123',
        action: 'approved',
        items_count: 5,
        high_confidence_count: 3
      });

      expect(mockFrom).toHaveBeenCalledWith('extraction_approval_log');
    });
  });

  describe('getDocumentApprovalLogs', () => {
    it('should fetch all logs when no previewId is provided', async () => {
      const mockLogs = [
        { id: '1', action: 'approved', items_count: 5 },
        { id: '2', action: 'rejected', items_count: 2 }
      ];

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          order: vi.fn().mockResolvedValueOnce({
            data: mockLogs,
            error: null
          })
        })
      } as any);

      const result = await getDocumentApprovalLogs();

      expect(result).toEqual(mockLogs);
    });

    it('should filter logs by previewId', async () => {
      const mockLogs = [
        { id: '1', preview_id: '123', action: 'approved', items_count: 5 }
      ];

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          order: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockResolvedValueOnce({
              data: mockLogs,
              error: null
            })
          })
        })
      } as any);

      const result = await getDocumentApprovalLogs('123');

      expect(result).toEqual(mockLogs);
    });

    it('should throw error on fetch failure', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          order: vi.fn().mockResolvedValueOnce({
            data: null,
            error: { message: 'Database error' }
          })
        })
      } as any);

      await expect(getDocumentApprovalLogs()).rejects.toThrow(
        'Failed to fetch approval logs: Database error'
      );
    });
  });
});
