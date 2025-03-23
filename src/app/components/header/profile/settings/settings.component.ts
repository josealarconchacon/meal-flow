import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../../services/auth.service';
import { Subscription, Observable } from 'rxjs';
import { EditNameDialogComponent } from './edit-name-dialog.component';
import { DeleteAccountDialogComponent } from './delete-account-dialog.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface UserSettings {
  email: string;
  emailVerified: boolean;
  displayName: string;
  photoURL: string | null;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="settings-container">
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-card-title>Account Settings</mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <div class="settings-section">
            <h3>Email Settings</h3>
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">Email Address</span>
                <span class="setting-value">{{ userSettings?.email }}</span>
                <span
                  class="verification-status"
                  [class.verified]="userSettings?.emailVerified"
                >
                  {{
                    userSettings?.emailVerified ? 'Verified' : 'Not Verified'
                  }}
                </span>
              </div>
              <button
                mat-button
                color="primary"
                *ngIf="!userSettings?.emailVerified"
                (click)="sendVerificationEmail()"
              >
                Verify Email
              </button>
            </div>
          </div>

          <mat-divider></mat-divider>

          <div class="settings-section">
            <h3>Profile Settings</h3>
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">Display Name</span>
                <span class="setting-value">{{
                  userSettings?.displayName || 'Not set'
                }}</span>
              </div>
              <button
                mat-button
                color="primary"
                (click)="openEditNameDialog()"
                [disabled]="nameLoading$ | async"
              >
                <mat-spinner
                  *ngIf="nameLoading$ | async"
                  diameter="20"
                  class="button-spinner"
                ></mat-spinner>
                <span *ngIf="!(nameLoading$ | async)">Edit</span>
              </button>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">Profile Picture</span>
                <div class="profile-picture-container">
                  <img
                    [src]="
                      userSettings?.photoURL || 'assets/default-avatar.png'
                    "
                    alt="Profile picture"
                    class="profile-picture"
                  />
                  <mat-spinner
                    *ngIf="photoLoading$ | async"
                    diameter="50"
                    class="profile-spinner"
                  ></mat-spinner>
                </div>
              </div>
              <div>
                <input
                  type="file"
                  #fileInput
                  hidden
                  (change)="onFileSelected($event)"
                  accept="image/*"
                />
                <button
                  mat-button
                  color="primary"
                  (click)="fileInput.click()"
                  [disabled]="photoLoading$ | async"
                >
                  <mat-spinner
                    *ngIf="photoLoading$ | async"
                    diameter="20"
                    class="button-spinner"
                  ></mat-spinner>
                  <span *ngIf="!(photoLoading$ | async)">Change</span>
                </button>
              </div>
            </div>
          </div>

          <mat-divider></mat-divider>

          <div class="settings-section">
            <h3>Security</h3>
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">Password</span>
                <span class="setting-value">••••••••</span>
              </div>
              <button mat-button color="primary">Change Password</button>
            </div>
          </div>

          <mat-divider></mat-divider>

          <div class="settings-section danger-zone">
            <h3>Danger Zone</h3>
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">Delete Account</span>
                <span class="setting-value">This action cannot be undone</span>
              </div>
              <button
                mat-button
                color="warn"
                (click)="openDeleteAccountDialog()"
              >
                Delete Account
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .settings-container {
        max-width: 800px;
        margin: 2rem auto;
        padding: 0 1rem;
      }

      .settings-card {
        margin-bottom: 2rem;
      }

      .settings-section {
        margin: 1.5rem 0;
      }

      .settings-section h3 {
        color: #333;
        margin-bottom: 1rem;
        font-size: 1.2rem;
      }

      .setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding: 0.5rem 0;
      }

      .setting-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .setting-label {
        color: #666;
        font-size: 0.9rem;
      }

      .setting-value {
        font-size: 1rem;
        color: #333;
      }

      .verification-status {
        font-size: 0.8rem;
        color: #f44336;
      }

      .verification-status.verified {
        color: #4caf50;
      }

      .profile-picture-container {
        position: relative;
        display: inline-block;
      }

      .profile-spinner {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }

      .button-spinner {
        display: inline-block;
        margin-right: 8px;
        vertical-align: middle;
      }

      .profile-picture {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        object-fit: cover;
        margin-top: 0.5rem;
        border: 2px solid #e0e0e0;
        transition: all 0.3s ease;
      }

      .profile-picture:hover {
        border-color: #1976d2;
        box-shadow: 0 0 0 4px rgba(25, 118, 210, 0.1);
      }

      mat-divider {
        margin: 1.5rem 0;
      }

      .danger-zone {
        background-color: #fff5f5;
        padding: 1rem;
        border-radius: 4px;
      }

      .danger-zone h3 {
        color: #dc3545;
      }

      .success-snackbar {
        background: #4caf50;
        color: white;
      }

      .error-snackbar {
        background: #f44336;
        color: white;
      }
    `,
  ],
})
export class SettingsComponent implements OnInit, OnDestroy {
  userSettings: UserSettings | null = null;
  private authSubscription?: Subscription;
  photoLoading$: Observable<boolean>;
  nameLoading$: Observable<boolean>;

  constructor(
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.photoLoading$ = this.authService.photoLoading$;
    this.nameLoading$ = this.authService.nameLoading$;
  }

  ngOnInit(): void {
    this.authSubscription = this.authService.user$.subscribe((user) => {
      if (user) {
        this.userSettings = {
          email: user.email || '',
          emailVerified: user.emailVerified || false,
          displayName: user.displayName || '',
          photoURL: user.photoURL,
        };
      }
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  async sendVerificationEmail(): Promise<void> {
    try {
      await this.authService.sendEmailVerification();
      // Add success notification here if needed
    } catch (error) {
      console.error('Error sending verification email:', error);
      // Add error handling here
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      try {
        await this.authService.updateProfilePhoto(file);
        this.snackBar.open('Profile photo updated successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
      } catch (error) {
        this.snackBar.open(
          error instanceof Error
            ? error.message
            : 'Error updating profile photo',
          'Close',
          {
            duration: 3000,
            panelClass: ['error-snackbar'],
          }
        );
      }
      // Clear the input so the same file can be selected again
      (event.target as HTMLInputElement).value = '';
    }
  }

  openEditNameDialog(): void {
    const dialogRef = this.dialog.open(EditNameDialogComponent, {
      width: '400px',
      data: { displayName: this.userSettings?.displayName || '' },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          await this.authService.updateDisplayName(result);
          this.snackBar.open('Display name updated successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
        } catch (error) {
          this.snackBar.open(
            error instanceof Error
              ? error.message
              : 'Error updating display name',
            'Close',
            {
              duration: 3000,
              panelClass: ['error-snackbar'],
            }
          );
        }
      }
    });
  }

  openDeleteAccountDialog(): void {
    const dialogRef = this.dialog.open(DeleteAccountDialogComponent, {
      width: '400px',
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          await this.authService.deleteAccount();
          // User will be automatically redirected by the auth guard
        } catch (error) {
          console.error('Error deleting account:', error);
          // Add error handling here
        }
      }
    });
  }
}
