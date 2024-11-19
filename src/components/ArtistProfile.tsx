import React from 'react';
import { Instagram, Twitter, Globe } from 'lucide-react';
import { Artist } from '../types';

interface ArtistProfileProps {
  artist: Artist;
}

export const ArtistProfile: React.FC<ArtistProfileProps> = ({ artist }) => {
  return (
    <div className="relative w-full bg-gradient-to-b from-purple-900 to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative w-32 h-32 rounded-full overflow-hidden ring-4 ring-purple-400 shadow-xl">
              <img
                src={artist.avatarUrl}
                alt={artist.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight">{artist.name}</h1>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-purple-200">
                {artist.bio}
              </p>
            </div>

            <div className="flex space-x-6">
              {artist.socialLinks.instagram && (
                <a
                  href={artist.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-300 hover:text-white transition-colors"
                >
                  <Instagram size={24} />
                </a>
              )}
              {artist.socialLinks.twitter && (
                <a
                  href={artist.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-300 hover:text-white transition-colors"
                >
                  <Twitter size={24} />
                </a>
              )}
              {artist.socialLinks.website && (
                <a
                  href={artist.socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-300 hover:text-white transition-colors"
                >
                  <Globe size={24} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};