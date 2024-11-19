import React from 'react';
import { ArtworkCard } from './ArtworkCard';
import { Artwork } from '../types';

interface ArtworkGridProps {
  artworks: Artwork[];
}

export const ArtworkGrid: React.FC<ArtworkGridProps> = ({ artworks }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {artworks.map((artwork) => (
          <ArtworkCard key={artwork.id} artwork={artwork} />
        ))}
      </div>
    </div>
  );
};