export interface SocialMedia {
  platform: 'twitter' | 'facebook' | 'instagram' | 'linkedin';
  url: string;
}

export interface UserProfileData {
  username: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  followers: string[];
  following: string[];
  socialMedia?: SocialMedia[];
}

export interface UserProfile extends UserProfileData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
