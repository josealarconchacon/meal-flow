import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Post } from './quick-post.service';
import { map, switchMap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';

export interface SocialMedia {
  platform: 'twitter' | 'facebook' | 'instagram' | 'linkedin';
  url: string;
}

// Interface for data stored in Firestore (without id)
export interface UserProfileData {
  username: string;
  bio: string;
  avatarUrl?: string;
  followers: string[];
  following: string[];
  createdAt: string;
  updatedAt: string;
  socialMedia?: SocialMedia[];
}

// Interface for the full user profile including id
export interface UserProfile extends UserProfileData {
  id: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private currentUser = new BehaviorSubject<UserProfile | null>(null);
  private defaultAvatarUrl = 'assets/images/default-avatar.png';
  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private auth: Auth,
    private firestore: Firestore
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    // Subscribe to auth state changes
    this.auth.onAuthStateChanged(async (user) => {
      if (user) {
        // User is signed in, get their profile from Firestore
        const userDoc = await getDoc(doc(this.firestore, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = this.convertToUserProfile(
            userDoc.data() as UserProfileData,
            user.uid
          );
          this.currentUser.next(userData);
        } else {
          // Create new user profile if it doesn't exist
          const newUserData: UserProfileData = {
            username: user.displayName || 'New User',
            bio: 'Welcome to MealFlow!',
            avatarUrl: user.photoURL || this.defaultAvatarUrl,
            followers: [],
            following: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            socialMedia: [],
          };

          // Create the full user profile with ID
          const newUser: UserProfile = {
            ...newUserData,
            id: user.uid,
          };

          // Store in Firestore (without the id field)
          await setDoc(doc(this.firestore, 'users', user.uid), newUserData);
          this.currentUser.next(newUser);
        }
      } else {
        // User is signed out
        this.currentUser.next(null);
      }
    });
  }

  getCurrentUser(): Observable<UserProfile | null> {
    return this.currentUser.asObservable();
  }

  getUserProfile(userId: string): Observable<UserProfile | null> {
    return new Observable<UserProfile | null>((observer) => {
      getDoc(doc(this.firestore, 'users', userId))
        .then((docSnap) => {
          if (docSnap.exists()) {
            observer.next(
              this.convertToUserProfile(
                docSnap.data() as UserProfileData,
                userId
              )
            );
          } else {
            observer.next(null);
          }
          observer.complete();
        })
        .catch((error) => {
          console.error('Error fetching user profile:', error);
          observer.error(error);
        });
    });
  }

  getAvatarUrl(): Observable<string> {
    return this.currentUser.pipe(
      map((user) => user?.avatarUrl || this.defaultAvatarUrl)
    );
  }

  async updateProfile(updates: Partial<UserProfileData>): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    const current = this.currentUser.value;
    if (!current) throw new Error('No current user data');

    // Create a plain object for Firestore update
    const updateData: Partial<UserProfileData> = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(doc(this.firestore, 'users', user.uid), updateData);

    // Update local state with full profile data
    const updatedProfile: UserProfile = {
      ...current,
      ...updateData,
    };
    this.currentUser.next(updatedProfile);
  }

  private convertToUserProfile(
    data: UserProfileData,
    userId: string
  ): UserProfile {
    return {
      ...data,
      id: userId,
      username: data.username || '',
      bio: data.bio || '',
      followers: data.followers || [],
      following: data.following || [],
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      socialMedia: data.socialMedia || [],
    };
  }

  async updateAvatar(file: File): Promise<void> {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async (e) => {
        try {
          const avatarUrl = e.target?.result as string;
          await this.updateProfile({ avatarUrl });

          // Get current user data
          const current = this.currentUser.value;
          if (!current) throw new Error('No current user data');

          // Update local state
          this.currentUser.next({
            ...current,
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
    if (!current) throw new Error('No current user data');

    const socialMedia = current.socialMedia || [];
    // Remove if already exists
    const filtered = socialMedia.filter((sm) => sm.platform !== platform);

    await this.updateProfile({
      socialMedia: [...filtered, { platform, url }],
    });
  }

  async removeSocialMedia(platform: SocialMedia['platform']): Promise<void> {
    const current = this.currentUser.value;
    if (!current) throw new Error('No current user data');

    const socialMedia = current.socialMedia || [];

    await this.updateProfile({
      socialMedia: socialMedia.filter((sm) => sm.platform !== platform),
    });
  }

  async followUser(userIdToFollow: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    const currentUser = this.currentUser.value;
    if (!currentUser) throw new Error('No current user data');

    if (!currentUser.following.includes(userIdToFollow)) {
      const updatedUser: UserProfile = {
        ...currentUser,
        following: [...currentUser.following, userIdToFollow],
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(this.firestore, 'users', user.uid), {
        following: updatedUser.following,
        updatedAt: updatedUser.updatedAt,
      });

      this.currentUser.next(updatedUser);
    }
  }

  async unfollowUser(userIdToUnfollow: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    const currentUser = this.currentUser.value;
    if (!currentUser) throw new Error('No current user data');

    const updatedUser: UserProfile = {
      ...currentUser,
      following: currentUser.following.filter((id) => id !== userIdToUnfollow),
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(doc(this.firestore, 'users', user.uid), {
      following: updatedUser.following,
      updatedAt: updatedUser.updatedAt,
    });

    this.currentUser.next(updatedUser);
  }

  isFollowing(userId: string): Observable<boolean> {
    return this.currentUser.pipe(
      map((user) => user?.following.includes(userId) || false)
    );
  }

  getFollowersCount(userId: string): Observable<number> {
    return this.currentUser.pipe(map((user) => user?.followers.length || 0));
  }

  getFollowingCount(userId: string): Observable<number> {
    return this.currentUser.pipe(map((user) => user?.following.length || 0));
  }
}
