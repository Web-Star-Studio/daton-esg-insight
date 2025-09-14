import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { addToFavorites, removeFromFavorites, getFavorites, getFavoriteIds } from '@/services/favorites';

export const useFavorites = () => {
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading: isLoadingFavorites } = useQuery({
    queryKey: ['marketplace-favorites'],
    queryFn: getFavorites,
  });

  const { data: favoriteIds = [], isLoading: isLoadingFavoriteIds } = useQuery({
    queryKey: ['marketplace-favorite-ids'],
    queryFn: getFavoriteIds,
  });

  const addToFavoritesMutation = useMutation({
    mutationFn: addToFavorites,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-favorites'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-favorite-ids'] });
      toast.success('Solução adicionada aos favoritos');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('Esta solução já está nos seus favoritos');
      } else {
        toast.error('Erro ao adicionar aos favoritos');
      }
    },
  });

  const removeFromFavoritesMutation = useMutation({
    mutationFn: removeFromFavorites,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-favorites'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-favorite-ids'] });
      toast.success('Solução removida dos favoritos');
    },
    onError: () => {
      toast.error('Erro ao remover dos favoritos');
    },
  });

  const toggleFavorite = (solutionId: string) => {
    if (favoriteIds.includes(solutionId)) {
      removeFromFavoritesMutation.mutate(solutionId);
    } else {
      addToFavoritesMutation.mutate(solutionId);
    }
  };

  const isFavorite = (solutionId: string) => favoriteIds.includes(solutionId);

  return {
    favorites,
    favoriteIds,
    isLoadingFavorites,
    isLoadingFavoriteIds,
    toggleFavorite,
    isFavorite,
    isUpdating: addToFavoritesMutation.isPending || removeFromFavoritesMutation.isPending,
  };
};