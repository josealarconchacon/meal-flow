import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-email-link-signin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full">
      <div class="w-full space-y-4">
        <!-- Error Message -->
        <div *ngIf="error" class="rounded-md bg-red-50 p-4">
          <div class="flex">
            <div class="flex-1">
              <h3 class="text-sm font-medium text-red-800">
                {{ error }}
              </h3>
              <!-- Show alternative options when quota exceeded -->
              <div *ngIf="isQuotaExceeded" class="mt-4">
                <p class="text-sm text-gray-700 mb-3">
                  You can try these alternatives:
                </p>
                <div class="space-y-2">
                  <button
                    (click)="signInWithGoogle()"
                    class="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                  >
                    <img
                      src="assets/google-logo.png"
                      alt="Google"
                      class="h-5 w-5"
                    />
                    Sign in with Google
                  </button>
                  <button
                    (click)="signInWithGithub()"
                    class="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                  >
                    <i class="fab fa-github text-xl"></i>
                    Sign in with GitHub
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Success Message -->
        <div *ngIf="emailSent" class="rounded-md bg-green-50 p-3">
          <div class="flex">
            <div class="flex-1">
              <h3 class="text-sm font-medium text-green-800">
                Check your email for the sign-in link!
              </h3>
            </div>
          </div>
        </div>

        <!-- Email Form -->
        <form
          *ngIf="!isQuotaExceeded"
          class="space-y-4"
          (ngSubmit)="sendSignInLink()"
          #signInForm="ngForm"
        >
          <div>
            <label for="email-address" class="sr-only">Email address</label>
            <input
              id="email-address"
              name="email"
              type="email"
              required
              [(ngModel)]="email"
              class="appearance-none rounded-lg w-full px-4 py-2.5 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter your email address"
              [disabled]="isLoading"
            />
          </div>

          <div>
            <button
              type="submit"
              [disabled]="isLoading || !email"
              class="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow"
            >
              <svg
                *ngIf="!isLoading"
                class="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"
                />
                <path
                  d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"
                />
              </svg>
              <svg
                *ngIf="isLoading"
                class="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {{ isLoading ? 'Sending...' : 'Send Sign-in Link' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class EmailLinkSigninComponent implements OnInit {
  email: string = '';
  error: string = '';
  isLoading: boolean = false;
  emailSent: boolean = false;
  isQuotaExceeded: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    // Only check for sign-in link in browser environment
    if (isPlatformBrowser(this.platformId)) {
      // Check if this is a sign-in link
      if (this.authService.isSignInWithEmailLink(window.location.href)) {
        this.completeSignIn();
      }
    }
  }

  async sendSignInLink() {
    if (!this.email || !isPlatformBrowser(this.platformId)) return;

    this.isLoading = true;
    this.error = '';
    this.emailSent = false;
    this.isQuotaExceeded = false;

    try {
      await this.authService.sendSignInLink(this.email);
      this.emailSent = true;
    } catch (error: any) {
      if (error?.code === 'auth/quota-exceeded') {
        this.error =
          error.message ||
          "We've reached our daily email limit. Please try again tomorrow or use another sign-in method.";
        this.isQuotaExceeded = true;
      } else {
        this.error = 'Failed to send sign-in link. Please try again.';
      }
      console.error('Error sending sign-in link:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async completeSignIn() {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      await this.authService.completeSignIn(window.location.href);
      // Redirect to home or previous page
      this.router.navigate(['/']);
    } catch (error) {
      this.error = 'Failed to complete sign-in. Please try again.';
      console.error('Error completing sign-in:', error);
    }
  }

  // Add methods for alternative sign-in options
  async signInWithGoogle() {
    try {
      await this.authService.signInWithGoogle();
      // Close the auth modal by emitting an event
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      this.error = 'Failed to sign in with Google. Please try again.';
    }
  }

  async signInWithGithub() {
    try {
      await this.authService.signInWithGithub();
      // Close the auth modal by emitting an event
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Error signing in with GitHub:', error);
      this.error = 'Failed to sign in with GitHub. Please try again.';
    }
  }
}
