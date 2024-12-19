import React, { useEffect } from 'react';
import { useArtStore } from '../store/artStore';
import { supabase } from '../lib/supabase';

// Eva's artist ID
const ARTIST_ID = '26ad1700-852f-43f2-9abe-46e8aa8596e3';

export function Gallery() {
  const { artist, setArtist, setLoading } = useArtStore();
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: artistData } = await supabase
          .from('artists')
          .select('*')
          .eq('id', ARTIST_ID)
          .single();

        setArtist(artistData);
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setArtist, setLoading]);

  if (!artist) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center">
          <img
            src={artist.avatar_url}
            alt={artist.name}
            className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-white shadow-lg object-cover"
          />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{artist.name}</h1>
          <p className="text-gray-600 mb-8">{artist.bio}</p>

          {/* Main Fanvue Link */}
          <a
            href="https://www.fanvue.com/eva_cobero/fv-1"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-[#ff385c] text-white rounded-xl py-4 px-6 mb-4 font-medium hover:bg-[#ff2d54] transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg"
          >
            Watch me play with myself 😈
          </a>

          {error && (
            <div className="text-red-500 mt-4 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}