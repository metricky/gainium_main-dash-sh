import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface Coin {
  symbol: string;
  name: string;
  icon: string;
  price: number;
  color: string;
  rank?: number;
  change24h?: number;
  change7d?: number;
  change30d?: number;
  marketCap?: number;
  volume24h?: number;
  circulatingSupply?: number;
  totalSupply?: number;
  category?: string;
  description?: string;
}

export interface FavoriteCoin extends Coin {
  id: string;
  pair: string;
  sparklineData: number[];
}

interface FavoritesState {
  favorites: FavoriteCoin[];
  isNavbarFavoritesVisible: boolean;

  // Actions
  addFavorite: (coinSymbol: string) => void;
  removeFavorite: (id: string) => void;
  reorderFavorites: (favorites: FavoriteCoin[]) => void;
  toggleNavbarFavorites: () => void;
  setNavbarFavoritesVisible: (visible: boolean) => void;
}

// Generate mock sparkline data
const generateSparklineData = (): number[] => {
  const data = [];
  let value = 100;
  for (let i = 0; i < 20; i++) {
    value += (Math.random() - 0.5) * 10;
    data.push(Math.max(value, 50)); // Keep values above 50
  }
  return data;
};

// Default favorites
const getDefaultFavorites = (): FavoriteCoin[] => {
  return [];
};

export const useFavoritesStore = create<FavoritesState>()(
  devtools(
    persist(
      (set, get) => ({
        favorites: getDefaultFavorites(),
        isNavbarFavoritesVisible: true,

        addFavorite: (coinSymbol: string) => {
          const coinData: Coin = {
            symbol: coinSymbol,
            name: coinSymbol,
            icon: '',
            price: 0,
            color: '#000000',
          };

          const existingFavorite = get().favorites.find(
            (fav) => fav.symbol === coinSymbol
          );
          if (existingFavorite) return;

          const newFavorite: FavoriteCoin = {
            ...coinData,
            id: coinSymbol.toLowerCase(),
            pair: `${coinSymbol}/USDT`,
            sparklineData: generateSparklineData(),
          };

          set((state) => ({
            favorites: [...state.favorites, newFavorite],
          }));
        },

        removeFavorite: (id: string) => {
          set((state) => ({
            favorites: state.favorites.filter((fav) => fav.id !== id),
          }));
        },

        reorderFavorites: (favorites: FavoriteCoin[]) => {
          set({ favorites });
        },

        toggleNavbarFavorites: () => {
          set((state) => ({
            isNavbarFavoritesVisible: !state.isNavbarFavoritesVisible,
          }));
        },

        setNavbarFavoritesVisible: (visible: boolean) => {
          set({ isNavbarFavoritesVisible: visible });
        },
      }),
      {
        name: 'favorites-store',
        partialize: (state) => ({
          favorites: state.favorites,
          isNavbarFavoritesVisible: state.isNavbarFavoritesVisible,
        }),
      }
    )
  )
);
