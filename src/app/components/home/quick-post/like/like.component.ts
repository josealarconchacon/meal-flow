import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { AuthModalComponent } from '../../../auth-modal/auth-modal.component';
import { AuthService } from '../../../../services/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-like',
  templateUrl: './like.component.html',
  styleUrls: ['./like.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class LikeComponent {
  @Input() postId!: string;
  liked = false;
  likeCount = 0;
  animating = false;

  constructor(private dialog: MatDialog, private authService: AuthService) {}

  async toggleLike(): Promise<void> {
    if (this.animating) return;

    const isAuthenticated = await firstValueFrom(
      this.authService.isAuthenticated()
    );
    if (!isAuthenticated) {
      const dialogRef = this.dialog.open(AuthModalComponent);
      const result = await dialogRef.afterClosed().toPromise();

      if (!result) return; // User cancelled or failed to sign in
    }

    // User is authenticated, proceed with like
    this.animating = true;
    this.liked = !this.liked;
    this.likeCount += this.liked ? 1 : -1;
    setTimeout(() => {
      this.animating = false;
    }, 300);
  }
}
