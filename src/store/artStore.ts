import { create } from 'zustand';
import { Artwork, Artist } from '../types';

interface ArtStore {
  artworks: Artwork[];
  artist: Artist | null;
  isLoading: boolean;
  setArtworks: (artworks: Artwork[]) => void;
  setArtist: (artist: Artist) => void;
  setLoading: (loading: boolean) => void;
  updateArtwork: (id: string, updates: Partial<Artwork>) => void;
}

export const useArtStore = create<ArtStore>((set) => ({
  artworks: [],
  artist: null,
  isLoading: true,
  setArtworks: (artworks) => set({ artworks }),
  setArtist: (artist) => set({ artist }),
  setLoading: (isLoading) => set({ isLoading }),
  updateArtwork: (id, updates) =>
    set((state) => ({
      artworks: state.artworks.map((artwork) =>
        artwork.id === id ? { ...artwork, ...updates } : artwork
      ),
    })),
}));