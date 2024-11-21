import React from 'react';
import { Artist } from '../types';

interface ArtistProfileProps {
  artist: Artist;
}

export function ArtistProfile({ artist }: ArtistProfileProps) {
  const socialLinks = {
    instagram: artist.instagram_url || '',
    twitter: artist.twitter_url || '',
    website: artist.website_url || ''
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="md:flex">
        {artist.image_url && (
          <div className="md:flex-shrink-0">
            <img
              className="h-48 w-full object-cover md:w-48"
              src={artist.image_url}
              alt={artist.name}
            />
          </div>
        )}
        <div className="p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">{artist.name}</h2>
            <div className="flex space-x-4">
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-600 hover:text-pink-700"
                >
                  Instagram
                </a>
              )}
              {socialLinks.twitter && (
                <a
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-500"
                >
                  Twitter
                </a>
              )}
              {socialLinks.website && (
                <a
                  href={socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-700"
                >
                  Website
                </a>
              )}
            </div>
          </div>
          {artist.bio && (
            <p className="mt-4 text-gray-600">{artist.bio}</p>
          )}
        </div>
      </div>
    </div>
  );
}