import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-modal',
  template: `
    <div class="auth-modal">
      <h2>Sign In Required</h2>
      <p>Please sign in to continue with this action.</p>
      <button mat-raised-button color="primary" (click)="signInWithGoogle()">
        <img
          src="assets/google-icon.png"
          alt="Google Icon"
          class="google-icon"
        />
        Sign in with Google
      </button>
      <button mat-button (click)="close()">Cancel</button>
    </div>
  `,
  styles: [
    `
      .auth-modal {
        padding: 20px;
        text-align: center;
      }
      .google-icon {
        width: 20px;
        margin-right: 10px;
      }
      button {
        margin: 10px;
      }
    `,
  ],
  standalone: true,
  imports: [MatButtonModule],
})
export class AuthModalComponent {
  constructor(
    private authService: AuthService,
    private dialogRef: MatDialogRef<AuthModalComponent>
  ) {}

  async signInWithGoogle(): Promise<void> {
    try {
      await this.authService.signInWithGoogle();
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error signing in:', error);
    }
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
