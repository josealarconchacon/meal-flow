import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthModalComponent } from '../components/auth-modal/auth-modal.component';
import { AuthService } from './auth.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProtectedActionsService {
  constructor(private authService: AuthService, private dialog: MatDialog) {}

  async handleProtectedAction(action: () => Promise<void>): Promise<void> {
    const isAuthenticated = await firstValueFrom(
      this.authService.isAuthenticated()
    );

    if (isAuthenticated) {
      await action();
    } else {
      const dialogRef = this.dialog.open(AuthModalComponent, {
        width: '400px',
        disableClose: true,
      });

      const result = await dialogRef.afterClosed().toPromise();
      if (result) {
        await action();
      }
    }
  }

  // Example protected actions
  async handleLike(postId: string): Promise<void> {
    await this.handleProtectedAction(async () => {
      // Implement like functionality here
      console.log(`Liked post: ${postId}`);
    });
  }

  async handleComment(postId: string, comment: string): Promise<void> {
    await this.handleProtectedAction(async () => {
      // Implement comment functionality here
      console.log(`Commented on post: ${postId}`, comment);
    });
  }
}
