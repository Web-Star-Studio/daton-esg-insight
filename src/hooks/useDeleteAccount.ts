import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeleteAccountParams {
  confirmText: string;
}

interface DeleteAccountResponse {
  success: boolean;
  message: string;
  deletedUsers?: number;
  deletedTables?: number;
}

export const useDeleteAccount = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ confirmText }: DeleteAccountParams): Promise<DeleteAccountResponse> => {
      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: { confirmText }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao excluir conta');
      }

      if (data?.error) {
        throw new Error(data.message || data.error);
      }

      return data as DeleteAccountResponse;
    },
    onSuccess: async (data) => {
      toast({
        title: "Conta excluída",
        description: data.message,
      });

      // Sign out and redirect
      await supabase.auth.signOut();
      
      // Small delay to ensure signout completes
      setTimeout(() => {
        window.location.href = '/auth';
      }, 500);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir conta",
        description: error.message,
        variant: "destructive",
      });
    }
  });
};
