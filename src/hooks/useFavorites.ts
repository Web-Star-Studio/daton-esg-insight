import { useState, useCallback, useEffect } from 'react';

export interface FavoriteItem {
  id: string;
  title: string;
  path: string;
  icon: string;
  addedAt: Date;
}

const FAVORITES_STORAGE_KEY = 'daton-favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  // Carregar favoritos do localStorage
  useEffect(() => {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const favoritesWithDates = parsed.map((fav: any) => ({
          ...fav,
          addedAt: new Date(fav.addedAt)
        }));
        setFavorites(favoritesWithDates);
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    }
  }, []);

  // Salvar favoritos no localStorage
  const saveFavorites = useCallback((newFavorites: FavoriteItem[]) => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));
    setFavorites(newFavorites);
  }, []);

  const addFavorite = useCallback((item: Omit<FavoriteItem, 'addedAt'>) => {
    const newFavorite: FavoriteItem = {
      ...item,
      addedAt: new Date()
    };
    
    const updated = [newFavorite, ...favorites.filter(fav => fav.id !== item.id)];
    saveFavorites(updated);
  }, [favorites, saveFavorites]);

  const removeFavorite = useCallback((id: string) => {
    const updated = favorites.filter(fav => fav.id !== id);
    saveFavorites(updated);
  }, [favorites, saveFavorites]);

  const isFavorite = useCallback((id: string) => {
    return favorites.some(fav => fav.id === id);
  }, [favorites]);

  const toggleFavorite = useCallback((item: Omit<FavoriteItem, 'addedAt'>) => {
    if (isFavorite(item.id)) {
      removeFavorite(item.id);
    } else {
      addFavorite(item);
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  return {
    favorites: favorites.slice(0, 8), // Limitar a 8 favoritos
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite
  };
}