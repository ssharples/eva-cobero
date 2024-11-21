export interface Artist {
  id: string;
  name: string;
  bio: string | null;
  image_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Artwork {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  price: number;
  createdAt: string;
  isBlurred: boolean;
}

export interface Database {
  public: {
    Tables: {
      artists: {
        Row: Artist;
      };
      artworks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          image_url: string;
          price: number;
          created_at: string;
          updated_at: string;
          artist_id: string;
        };
      };
    };
  };
}