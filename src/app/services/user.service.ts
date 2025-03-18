import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Post } from './quick-post.service';
import { map } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

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
  followers: string[];
  following: string[];
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private currentUser = new BehaviorSubject<UserProfile>({
    id: 'user1',
    username: 'Recipe Enthusiast',
    bio: 'Passionate about cooking and sharing recipes!',
    followers: [],
    following: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  private defaultAvatarUrl = 'assets/images/default-avatar.png';
  private isBrowser: boolean;

  private mockUsers: UserProfile[] = [
    {
      id: 'user1',
      username: 'Recipe Enthusiast',
      bio: 'Passionate about cooking and sharing recipes!',
      followers: [],
      following: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'user2',
      username: 'Chef Master',
      bio: 'Professional chef sharing cooking tips',
      followers: [],
      following: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);

    // Initialize with default user data
    const defaultUser = this.mockUsers[0];
    this.currentUser.next(defaultUser);

    // Load user data from storage if available
    if (this.isBrowser) {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          this.currentUser.next(parsedUser);
        } catch (error) {
          console.error('Error parsing saved user data:', error);
        }
      }
    }
  }

  getCurrentUser(): Observable<UserProfile> {
    return this.currentUser.asObservable();
  }

  getUserProfile(userId: string): Observable<UserProfile> {
    // In a real application, this would make an API call
    // For now, we'll use mock data
    return new Observable<UserProfile>((observer) => {
      const user = this.mockUsers.find((u) => u.id === userId);
      if (user) {
        observer.next(user);
      } else {
        observer.error(new Error('User not found'));
      }
      observer.complete();
    });
  }

  getAvatarUrl(): Observable<string> {
    return this.currentUser.pipe(
      map((user) => user.avatarUrl || this.defaultAvatarUrl)
    );
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<void> {
    const current = this.currentUser.value;
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.currentUser.next(updated);

    // Save to localStorage if in browser environment
    if (this.isBrowser) {
      try {
        localStorage.setItem('currentUser', JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving user data:', error);
      }
    }
  }

  async updateAvatar(file: File): Promise<void> {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async (e) => {
        try {
          const avatarUrl = e.target?.result as string;
          await this.updateProfile({ avatarUrl });
          // Notify all subscribers about the avatar update
          this.currentUser.next({
            ...this.currentUser.value,
            avatarUrl,
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

  async followUser(userIdToFollow: string): Promise<void> {
    const currentUser = this.currentUser.value;
    if (!currentUser.following.includes(userIdToFollow)) {
      const updatedUser = {
        ...currentUser,
        following: [...currentUser.following, userIdToFollow],
        updatedAt: new Date().toISOString(),
      };
      this.currentUser.next(updatedUser);

      if (this.isBrowser) {
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
    }
  }

  async unfollowUser(userIdToUnfollow: string): Promise<void> {
    const currentUser = this.currentUser.value;
    const updatedUser = {
      ...currentUser,
      following: currentUser.following.filter((id) => id !== userIdToUnfollow),
      updatedAt: new Date().toISOString(),
    };
    this.currentUser.next(updatedUser);

    if (this.isBrowser) {
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
  }

  isFollowing(userId: string): Observable<boolean> {
    return this.currentUser.pipe(
      map((user) => user.following.includes(userId))
    );
  }

  getFollowersCount(userId: string): Observable<number> {
    return this.currentUser.pipe(map((user) => user.followers.length));
  }

  getFollowingCount(userId: string): Observable<number> {
    return this.currentUser.pipe(map((user) => user.following.length));
  }
}
