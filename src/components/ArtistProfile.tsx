import React from 'react';
import { Artist } from '../types';

interface ArtistProfileProps {
  artist: Artist;
}

export function ArtistProfile({ artist }: ArtistProfileProps) {
  const socialLinks = [
    {
      url: artist.instagram_url,
      label: 'Instagram',
      className: 'bg-gradient-to-r from-purple-500 to-pink-500'
    },
    {
      url: artist.twitter_url,
      label: 'Twitter',
      className: 'bg-blue-500'
    },
    {
      url: artist.website_url,
      label: 'Website',
      className: 'bg-gray-700'
    }
  ].filter(link => link.url);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 text-center">
      {artist.image_url && (
        <div className="mb-8">
          <img
            src={artist.image_url}
            alt={artist.name}
            className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white shadow-lg"
          />
        </div>
      )}
      
      <h1 className="text-3xl font-bold mb-4">{artist.name}</h1>
      
      {artist.bio && (
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          {artist.bio}
        </p>
      )}

      <div className="flex flex-col space-y-4 max-w-sm mx-auto">
        {socialLinks.map(link => (
          <a
            key={link.label}
            href={link.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`${link.className} text-white py-3 px-6 rounded-lg 
                      font-medium shadow-md hover:opacity-90 transition-opacity
                      flex items-center justify-center space-x-2`}
          >
            <span>{link.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}