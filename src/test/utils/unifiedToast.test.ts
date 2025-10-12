import { describe, it, expect, vi } from 'vitest';
import { unifiedToast } from '@/utils/unifiedToast';
import { toast } from 'sonner';

vi.mock('sonner');

describe('unifiedToast', () => {
  it('should call toast.success with correct parameters', () => {
    unifiedToast.success('Success message', {
      description: 'Success description',
      duration: 3000
    });

    expect(toast.success).toHaveBeenCalledWith('Success message', {
      description: 'Success description',
      duration: 3000,
      action: undefined
    });
  });

  it('should call toast.error with default duration', () => {
    unifiedToast.error('Error message');

    expect(toast.error).toHaveBeenCalledWith('Error message', {
      description: undefined,
      duration: 6000,
      action: undefined
    });
  });

  it('should call toast.warning with correct parameters', () => {
    unifiedToast.warning('Warning message', {
      description: 'Be careful'
    });

    expect(toast.warning).toHaveBeenCalledWith('Warning message', {
      description: 'Be careful',
      duration: 5000,
      action: undefined
    });
  });

  it('should call toast.info with action', () => {
    const action = {
      label: 'Undo',
      onClick: vi.fn()
    };

    unifiedToast.info('Info message', { action });

    expect(toast.info).toHaveBeenCalledWith('Info message', {
      description: undefined,
      duration: 4000,
      action
    });
  });

  it('should handle loading state with promise', async () => {
    const promise = Promise.resolve('Success');

    unifiedToast.loading('Loading...', promise);

    expect(toast.promise).toHaveBeenCalledWith(promise, {
      loading: 'Loading...',
      success: 'Operação concluída com sucesso',
      error: 'Erro ao executar operação'
    });
  });
});
