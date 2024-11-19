export interface Database {
  public: {
    Tables: {
      artworks: {
        Row: {
          id: string;
          title: string;
          description: string;
          image_url: string;
          price: number;
          created_at: string;
          artist_id: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          image_url: string;
          price: number;
          created_at?: string;
          artist_id: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          image_url?: string;
          price?: number;
          created_at?: string;
          artist_id?: string;
        };
      };
      artists: {
        Row: {
          id: string;
          name: string;
          bio: string;
          avatar_url: string;
          instagram_url?: string;
          twitter_url?: string;
          website_url?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          bio: string;
          avatar_url: string;
          instagram_url?: string;
          twitter_url?: string;
          website_url?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          bio?: string;
          avatar_url?: string;
          instagram_url?: string;
          twitter_url?: string;
          website_url?: string;
          created_at?: string;
        };
      };
      user_purchases: {
        Row: {
          id: string;
          user_id: string;
          artwork_id: string;
          purchase_date: string;
          amount_paid: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          artwork_id: string;
          purchase_date?: string;
          amount_paid: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          artwork_id?: string;
          purchase_date?: string;
          amount_paid?: number;
        };
      };
    };
  };
}