import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  Auth,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  GoogleAuthProvider,
  signInWithPopup,
  GithubAuthProvider,
} from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private auth: Auth,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Check if user is already authenticated
    this.auth.onAuthStateChanged((user) => {
      this.isAuthenticatedSubject.next(!!user);
    });
  }

  async sendSignInLink(email: string): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.reject(
        new Error('This operation is only available in browser environment')
      );
    }

    const actionCodeSettings = {
      url: window.location.href,
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(this.auth, email, actionCodeSettings);
      // Save the email locally to complete sign in after user clicks link
      window.localStorage.setItem('emailForSignIn', email);
      return Promise.resolve();
    } catch (error: any) {
      console.error('Error sending sign in link:', error);
      if (error?.code === 'auth/quota-exceeded') {
        throw {
          code: 'auth/quota-exceeded',
          message:
            'Daily email quota exceeded. Please try again tomorrow or use another sign-in method.',
        };
      }
      return Promise.reject(error);
    }
  }

  async completeSignIn(url: string): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.reject(
        new Error('This operation is only available in browser environment')
      );
    }

    if (!isSignInWithEmailLink(this.auth, url)) {
      return Promise.reject(new Error('Invalid sign in link'));
    }

    let email = window.localStorage.getItem('emailForSignIn');
    if (!email) {
      // If email is not found in localStorage, prompt user to provide it
      throw new Error('Email not found. Please provide your email again.');
    }

    try {
      await signInWithEmailLink(this.auth, email, url);
      window.localStorage.removeItem('emailForSignIn'); // Clean up
      return Promise.resolve();
    } catch (error) {
      console.error('Error completing sign in:', error);
      return Promise.reject(error);
    }
  }

  isSignInWithEmailLink(url: string): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    return isSignInWithEmailLink(this.auth, url);
  }

  getCurrentUser() {
    return this.auth.currentUser;
  }

  async signOut(): Promise<void> {
    try {
      await this.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  async signInWithGoogle(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.reject(
        new Error('This operation is only available in browser environment')
      );
    }

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(this.auth, provider);
      return Promise.resolve();
    } catch (error) {
      console.error('Error signing in with Google:', error);
      return Promise.reject(error);
    }
  }

  async signInWithGithub(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.reject(
        new Error('This operation is only available in browser environment')
      );
    }

    try {
      const provider = new GithubAuthProvider();
      await signInWithPopup(this.auth, provider);
      return Promise.resolve();
    } catch (error) {
      console.error('Error signing in with GitHub:', error);
      return Promise.reject(error);
    }
  }
}
