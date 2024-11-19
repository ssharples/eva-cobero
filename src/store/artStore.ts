import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Artwork, Artist } from '../types';

interface ArtStore {
  artworks: Artwork[];
  artist: Artist | null;
  isLoading: boolean;
  purchasedArtworkIds: string[];
  hasLifetimeAccess: boolean;
  setArtworks: (artworks: Artwork[]) => void;
  setArtist: (artist: Artist) => void;
  setLoading: (loading: boolean) => void;
  updateArtwork: (id: string, updates: Partial<Artwork>) => void;
  addPurchasedArtwork: (id: string) => void;
  isPurchased: (id: string) => boolean;
  setLifetimeAccess: (hasAccess: boolean) => void;
}

export const useArtStore = create<ArtStore>()(
  persist(
    (set, get) => ({
      artworks: [],
      artist: null,
      isLoading: true,
      purchasedArtworkIds: [],
      hasLifetimeAccess: false,
      setArtworks: (artworks) => {
        // When setting artworks, apply the purchased state
        const purchasedIds = get().purchasedArtworkIds;
        const hasLifetime = get().hasLifetimeAccess;
        const updatedArtworks = artworks.map(artwork => ({
          ...artwork,
          isBlurred: !hasLifetime && !purchasedIds.includes(artwork.id)
        }));
        set({ artworks: updatedArtworks });
      },
      setArtist: (artist) => set({ artist }),
      setLoading: (isLoading) => set({ isLoading }),
      updateArtwork: (id, updates) =>
        set((state) => ({
          artworks: state.artworks.map((artwork) =>
            artwork.id === id ? { ...artwork, ...updates } : artwork
          ),
        })),
      addPurchasedArtwork: (id) =>
        set((state) => ({
          purchasedArtworkIds: [...new Set([...state.purchasedArtworkIds, id])],
          artworks: state.artworks.map((artwork) =>
            artwork.id === id ? { ...artwork, isBlurred: false } : artwork
          ),
        })),
      isPurchased: (id) => {
        const state = get();
        return state.hasLifetimeAccess || state.purchasedArtworkIds.includes(id);
      },
      setLifetimeAccess: (hasAccess) =>
        set((state) => ({
          hasLifetimeAccess: hasAccess,
          // If lifetime access is granted, unblur all artworks
          artworks: hasAccess 
            ? state.artworks.map(artwork => ({ ...artwork, isBlurred: false }))
            : state.artworks
        })),
    }),
    {
      name: 'eva-cobero-storage',
      partialize: (state) => ({ 
        purchasedArtworkIds: state.purchasedArtworkIds,
        hasLifetimeAccess: state.hasLifetimeAccess 
      }),
    }
  )
);