import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Post } from './quick-post.service';

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
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private currentUser = new BehaviorSubject<UserProfile>({
    id: 'user1',
    username: 'Recipe Enthusiast',
    bio: 'Passionate about cooking and sharing recipes!',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  constructor() {
    // Load user data from storage if available
  }

  getCurrentUser(): Observable<UserProfile> {
    return this.currentUser.asObservable();
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<void> {
    const current = this.currentUser.value;
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.currentUser.next(updated);
    // In a real app, you would save this to a backend
  }

  async updateAvatar(file: File): Promise<void> {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async (e) => {
        try {
          await this.updateProfile({
            avatarUrl: e.target?.result as string,
          });
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  async addSocialMedia(
    platform: SocialMedia['platform'],
    url: string
  ): Promise<void> {
    const current = this.currentUser.value;
    const socialMedia = current.socialMedia || [];

    // Remove if already exists
    const filtered = socialMedia.filter((sm) => sm.platform !== platform);

    await this.updateProfile({
      socialMedia: [...filtered, { platform, url }],
    });
  }

  async removeSocialMedia(platform: SocialMedia['platform']): Promise<void> {
    const current = this.currentUser.value;
    const socialMedia = current.socialMedia || [];

    await this.updateProfile({
      socialMedia: socialMedia.filter((sm) => sm.platform !== platform),
    });
  }
}
