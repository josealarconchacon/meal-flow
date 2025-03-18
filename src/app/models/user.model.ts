export interface SocialMedia {
  platform: 'twitter' | 'facebook' | 'instagram' | 'linkedin';
  url: string;
}

export interface UserProfile {
  id: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  socialMedia?: SocialMedia[];
  followers: string[]; // Array of user IDs who follow this user
  following: string[]; // Array of user IDs this user follows
  createdAt: string;
  updatedAt: string;
}
