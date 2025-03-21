import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject, Observable, of, from } from 'rxjs';
import { Post } from './quick-post.service';
import { map, switchMap, catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from '@angular/fire/firestore';
import { ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Storage } from '@angular/fire/storage';
import {
  UserProfile,
  UserProfileData,
  SocialMedia,
} from '../models/user.model';

export type { UserProfile, UserProfileData, SocialMedia };

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly DEFAULT_AVATAR_URL = 'assets/images/default-avatar.png';
  private currentUser = new BehaviorSubject<UserProfile | null>(null);
  private avatarUrl = new BehaviorSubject<string>(this.DEFAULT_AVATAR_URL);
  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private auth: Auth,
    private firestore: Firestore,
    private storage: Storage
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      this.initializeUser();
    }
  }

  private async initializeUser(): Promise<void> {
    this.auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(this.firestore, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const userData: UserProfile = {
            ...data,
            id: user.uid,
            username: data['username'],
            email: data['email'],
            bio: data['bio'] || '',
            avatarUrl: data['avatarUrl'] || this.DEFAULT_AVATAR_URL,
            followers: data['followers'] || [],
            following: data['following'] || [],
            createdAt:
              data['createdAt'] instanceof Timestamp
                ? data['createdAt'].toDate()
                : new Date(data['createdAt']),
            updatedAt:
              data['updatedAt'] instanceof Timestamp
                ? data['updatedAt'].toDate()
                : new Date(data['updatedAt']),
          };
          this.currentUser.next(userData);
          this.avatarUrl.next(userData.avatarUrl || this.DEFAULT_AVATAR_URL);
        } else {
          // Create new user profile if it doesn't exist
          const now = new Date();
          const newUserData: UserProfile = {
            id: user.uid,
            username: user.displayName || 'New User',
            email: user.email || '',
            bio: 'Welcome to MealFlow!',
            avatarUrl: user.photoURL || this.DEFAULT_AVATAR_URL,
            followers: [],
            following: [],
            createdAt: now,
            updatedAt: now,
          };
          const { id, ...dataForFirestore } = newUserData;
          await setDoc(doc(this.firestore, 'users', user.uid), {
            ...dataForFirestore,
            createdAt: Timestamp.fromDate(now),
            updatedAt: Timestamp.fromDate(now),
          });
          this.currentUser.next(newUserData);
          this.avatarUrl.next(newUserData.avatarUrl || this.DEFAULT_AVATAR_URL);
        }
      } else {
        this.currentUser.next(null);
        this.avatarUrl.next(this.DEFAULT_AVATAR_URL);
      }
    });
  }

  getCurrentUser(): Observable<UserProfile | null> {
    return this.currentUser.asObservable();
  }

  getUserProfile(userId: string): Observable<UserProfile | null> {
    return from(getDoc(doc(this.firestore, 'users', userId))).pipe(
      map((userDoc) => {
        if (userDoc.exists()) {
          const data = userDoc.data();
          return {
            id: userId,
            username: data['username'],
            email: data['email'],
            bio: data['bio'] || '',
            avatarUrl: data['avatarUrl'] || this.DEFAULT_AVATAR_URL,
            followers: data['followers'] || [],
            following: data['following'] || [],
            createdAt:
              data['createdAt'] instanceof Timestamp
                ? data['createdAt'].toDate()
                : new Date(data['createdAt']),
            updatedAt:
              data['updatedAt'] instanceof Timestamp
                ? data['updatedAt'].toDate()
                : new Date(data['updatedAt']),
          };
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  getAvatarUrl(): Observable<string> {
    return this.avatarUrl.asObservable();
  }

  getAvatarUrlForUser(userId: string): Observable<string> {
    return from(getDoc(doc(this.firestore, 'users', userId))).pipe(
      map((userDoc) => {
        if (userDoc.exists()) {
          const data = userDoc.data();
          return data['avatarUrl'] || this.DEFAULT_AVATAR_URL;
        }
        return this.DEFAULT_AVATAR_URL;
      }),
      catchError(() => of(this.DEFAULT_AVATAR_URL))
    );
  }

  async updateProfile(updates: Partial<UserProfileData>): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    const userRef = doc(this.firestore, 'users', user.uid);
    const updateData = {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date()),
    };

    await updateDoc(userRef, updateData);

    // Update local state
    const updatedDoc = await getDoc(userRef);
    if (updatedDoc.exists()) {
      const data = updatedDoc.data();
      const userData: UserProfile = {
        id: user.uid,
        username: data['username'],
        email: data['email'],
        bio: data['bio'] || '',
        avatarUrl: data['avatarUrl'] || this.DEFAULT_AVATAR_URL,
        followers: data['followers'] || [],
        following: data['following'] || [],
        createdAt:
          data['createdAt'] instanceof Timestamp
            ? data['createdAt'].toDate()
            : new Date(data['createdAt']),
        updatedAt:
          data['updatedAt'] instanceof Timestamp
            ? data['updatedAt'].toDate()
            : new Date(data['updatedAt']),
      };
      this.currentUser.next(userData);
      if (updates.avatarUrl) {
        this.avatarUrl.next(updates.avatarUrl);
      }
    }
  }

  async updateAvatar(file: File): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    // Create a reference to the avatar storage location
    const storageRef = ref(this.storage, `avatars/${user.uid}/${file.name}`);

    try {
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);

      // Get the download URL
      const avatarUrl = await getDownloadURL(snapshot.ref);

      // Update the user profile with the new avatar URL
      await this.updateProfile({ avatarUrl });

      // Get current user data
      const current = this.currentUser.value;
      if (!current) throw new Error('No current user data');

      // Update local state
      this.currentUser.next({
        ...current,
        avatarUrl,
      });
    } catch (error) {
      console.error('Error updating avatar:', error);
      throw error;
    }
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
      const now = new Date();
      const updatedUser: UserProfile = {
        ...currentUser,
        following: [...currentUser.following, userIdToFollow],
        updatedAt: now,
      };

      await updateDoc(doc(this.firestore, 'users', user.uid), {
        following: updatedUser.following,
        updatedAt: Timestamp.fromDate(now),
      });

      this.currentUser.next(updatedUser);
    }
  }

  async unfollowUser(userIdToUnfollow: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    const currentUser = this.currentUser.value;
    if (!currentUser) throw new Error('No current user data');

    const now = new Date();
    const updatedUser: UserProfile = {
      ...currentUser,
      following: currentUser.following.filter((id) => id !== userIdToUnfollow),
      updatedAt: now,
    };

    await updateDoc(doc(this.firestore, 'users', user.uid), {
      following: updatedUser.following,
      updatedAt: Timestamp.fromDate(now),
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
