import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../services/auth.service';
import { firstValueFrom, Subscription } from 'rxjs';

interface UserProfile {
  name: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  joinDate: Date;
  posts: number;
  followers: number;
  following: number;
}

@Component({
  selector: 'app-profile',
  template: `
    <div class="profile-container" *ngIf="userProfile">
      <div class="profile-header">
        <div class="profile-avatar">
          <img
            [src]="
              userProfile.avatarUrl ||
              'https://static-00.iconduck.com/assets.00/avatar-default-icon-2048x2048-h6w375ur.png'
            "
            [alt]="userProfile.name"
          />
        </div>
        <div class="profile-info">
          <div class="profile-header-top">
            <div class="profile-details">
              <h1>{{ userProfile.name }}</h1>
              <p class="bio" *ngIf="userProfile.bio">{{ userProfile.bio }}</p>
              <p class="location" *ngIf="userProfile.location">
                <i class="fas fa-map-marker-alt"></i> {{ userProfile.location }}
              </p>
              <p class="join-date">
                <i class="fas fa-calendar"></i> Joined
                {{ userProfile.joinDate | date : 'mediumDate' }}
              </p>
            </div>
          </div>
          <div class="profile-stats">
            <div class="stat">
              <span class="count">{{ userProfile.posts }}</span>
              <span class="label">Posts</span>
            </div>
            <div class="stat">
              <span class="count">{{ userProfile.followers }}</span>
              <span class="label">Followers</span>
            </div>
            <div class="stat">
              <span class="count">{{ userProfile.following }}</span>
              <span class="label">Following</span>
            </div>
          </div>
        </div>
      </div>

      <mat-tab-group>
        <mat-tab label="Posts">
          <div class="posts-grid">
            <!-- Posts content will go here -->
          </div>
        </mat-tab>
        <mat-tab label="Likes">
          <div class="likes-grid">
            <!-- Liked posts will go here -->
          </div>
        </mat-tab>
        <mat-tab label="Media">
          <div class="media-grid">
            <!-- Media content will go here -->
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      .profile-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }

      .profile-header {
        display: flex;
        gap: 40px;
        margin-bottom: 40px;
      }

      .profile-avatar img {
        width: 150px;
        height: 150px;
        border-radius: 50%;
        object-fit: cover;
      }

      .profile-info {
        flex: 1;
      }

      .profile-header-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
      }

      .profile-details {
        flex: 1;
      }

      .profile-actions {
        display: flex;
        gap: 10px;
      }

      .settings-button {
        margin-right: 10px;
      }

      .profile-info h1 {
        margin: 0 0 8px 0;
        font-size: 24px;
      }

      .bio {
        margin-bottom: 16px;
        line-height: 1.5;
      }

      .location,
      .join-date {
        color: #666;
        margin-bottom: 8px;
        font-size: 14px;
      }

      .profile-stats {
        display: flex;
        gap: 32px;
        margin-top: 24px;
      }

      .stat {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .count {
        font-size: 20px;
        font-weight: bold;
      }

      .label {
        color: #666;
        font-size: 14px;
      }

      .posts-grid,
      .likes-grid,
      .media-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 20px;
        padding: 20px 0;
      }
    `,
  ],
  standalone: true,
  imports: [CommonModule, RouterModule, MatTabsModule, MatButtonModule],
})
export class ProfileComponent implements OnInit, OnDestroy {
  userProfile: UserProfile | null = null;
  private authSubscription?: Subscription;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authSubscription = this.authService.user$.subscribe((user) => {
      if (user) {
        this.userProfile = {
          name: user.displayName || 'User',
          avatarUrl: user.photoURL || 'assets/default-avatar.png',
          bio: 'Food enthusiast and amateur chef. Sharing my culinary journey!', // Default bio or get from database
          location: 'New York, NY', // Default location or get from database
          joinDate: user.metadata?.creationTime
            ? new Date(user.metadata.creationTime)
            : new Date(),
          posts: 0, // Get from database
          followers: 0, // Get from database
          following: 0, // Get from database
        };
      } else {
        this.router.navigate(['/home']);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  goToSettings(): void {
    this.router.navigate(['/settings']);
  }

  async logout(): Promise<void> {
    try {
      await this.authService.signOut();
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }
}
