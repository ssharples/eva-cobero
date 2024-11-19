export interface Artwork {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  createdAt: string;
  isBlurred: boolean;
}

export interface Artist {
  name: string;
  bio: string;
  avatarUrl: string;
  socialLinks: {
    instagram?: string;
    twitter?: string;
    website?: string;
  };
}