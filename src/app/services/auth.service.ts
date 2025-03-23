import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  AngularFireStorage,
  AngularFireUploadTask,
} from '@angular/fire/compat/storage';
import { GoogleAuthProvider } from 'firebase/auth';
import {
  BehaviorSubject,
  Observable,
  from,
  switchMap,
  lastValueFrom,
  firstValueFrom,
} from 'rxjs';
import { map, finalize, tap } from 'rxjs/operators';
import { updateProfile } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userSubject = new BehaviorSubject<any>(null);
  private photoLoadingSubject = new BehaviorSubject<boolean>(false);
  private nameLoadingSubject = new BehaviorSubject<boolean>(false);

  user$ = this.userSubject.asObservable();
  photoLoading$ = this.photoLoadingSubject.asObservable();
  nameLoading$ = this.nameLoadingSubject.asObservable();

  constructor(
    private auth: AngularFireAuth,
    private storage: AngularFireStorage
  ) {
    // Subscribe to auth state changes
    this.auth.authState.subscribe((user) => {
      this.userSubject.next(user);
    });
  }

  // Check if user is authenticated
  isAuthenticated(): Observable<boolean> {
    return this.user$.pipe(map((user) => !!user));
  }

  // Sign in with Google
  async signInWithGoogle(): Promise<any> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await this.auth.signInWithPopup(provider);
      return result;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      await this.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser(): Observable<any> {
    return this.user$;
  }

  async sendEmailVerification(): Promise<void> {
    const user = await this.auth.currentUser;
    if (user) {
      await user.sendEmailVerification();
    } else {
      throw new Error('No user is currently signed in');
    }
  }

  async updateProfilePhoto(file: File): Promise<void> {
    const user = await this.auth.currentUser;
    if (!user) throw new Error('No user is currently signed in');

    if (!file.type.startsWith('image/')) {
      throw new Error('Please upload an image file');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size should not exceed 5MB');
    }

    try {
      this.photoLoadingSubject.next(true);

      const timestamp = new Date().getTime();
      const fileName = `${user.uid}_${timestamp}`;
      const filePath = `profile-photos/${fileName}`;
      const storageRef = this.storage.ref(filePath);

      const uploadTask = this.storage.upload(filePath, file);

      await lastValueFrom(uploadTask.snapshotChanges());

      const downloadURL = await lastValueFrom(storageRef.getDownloadURL());

      await updateProfile(user, { photoURL: downloadURL });

      const currentUser = this.userSubject.value;
      this.userSubject.next({ ...currentUser, photoURL: downloadURL });
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      throw new Error('Failed to upload profile photo. Please try again.');
    } finally {
      this.photoLoadingSubject.next(false);
    }
  }

  async updateDisplayName(newName: string): Promise<void> {
    const user = await this.auth.currentUser;
    if (!user) throw new Error('No user is currently signed in');

    if (!newName || newName.trim().length === 0) {
      throw new Error('Display name cannot be empty');
    }

    try {
      this.nameLoadingSubject.next(true);

      // Update Firebase profile
      await updateProfile(user, { displayName: newName.trim() });

      // Update the local user object
      const currentUser = this.userSubject.value;
      this.userSubject.next({ ...currentUser, displayName: newName.trim() });
    } catch (error) {
      console.error('Error updating display name:', error);
      throw new Error('Failed to update display name. Please try again.');
    } finally {
      this.nameLoadingSubject.next(false);
    }
  }

  async deleteAccount(): Promise<void> {
    const user = await this.auth.currentUser;
    if (!user) throw new Error('No user is currently signed in');

    await user.delete();
  }
}
