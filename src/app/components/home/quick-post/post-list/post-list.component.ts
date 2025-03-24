import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Post } from '../models/post.model';
import { PostInteractionsComponent } from '../post-interactions/post-interactions.component';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [CommonModule, PostInteractionsComponent],
  template: `
    <div
      class="posts-list"
      *ngIf="posts.length > 0"
      role="feed"
      aria-label="Posts"
    >
      <article class="post-item" *ngFor="let post of posts" role="article">
        <div class="post-header">
          <img
            [src]="post.author.photoURL || '/assets/default-avatar.png'"
            [alt]="post.author.displayName + '\\'s avatar'"
            class="avatar-image rounded-circle me-3"
          />
          <div class="post-meta">
            <div class="user-name fw-bold">{{ post.author.displayName }}</div>
            <div class="post-timestamp text-muted small" aria-label="Post time">
              {{ getFormattedDate(post.createdAt) }}
            </div>
          </div>
        </div>

        <p class="post-content">{{ post.content }}</p>

        <!-- Images grid -->
        <ng-container *ngIf="hasImages(post)">
          <div
            class="images-grid"
            [ngClass]="{
              'grid-1': getImagesLength(post) === 1,
              'grid-2': getImagesLength(post) === 2,
              'grid-3': getImagesLength(post) === 3
            }"
          >
            <div
              class="position-relative"
              *ngFor="let image of post.media!.images"
            >
              <img
                [src]="image.url"
                class="post-image"
                [alt]="'Post image by ' + post.author.displayName"
                loading="lazy"
              />
            </div>
          </div>
        </ng-container>

        <!-- Video -->
        <ng-container *ngIf="hasVideo(post)">
          <video
            [src]="getVideoUrl(post)"
            controls
            class="post-video w-100 rounded"
            [attr.aria-label]="'Video posted by ' + post.author.displayName"
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        </ng-container>

        <!-- Post Interactions -->
        <app-post-interactions [post]="post"></app-post-interactions>
      </article>
    </div>

    <div class="no-posts" *ngIf="posts.length === 0">
      <p>No posts yet. Be the first to share something!</p>
    </div>
  `,
  styleUrls: ['./post-list.component.css'],
})
export class PostListComponent {
  @Input() posts: Post[] = [];

  getFormattedDate(timestamp: any): string {
    if (!timestamp) return '';

    const date = timestamp.toDate();
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Helper methods for safe property access
  getImagesLength(post: Post): number {
    return post.media?.images?.length || 0;
  }

  hasImages(post: Post): boolean {
    return !!post.media?.images && post.media.images.length > 0;
  }

  hasVideo(post: Post): boolean {
    return !!post.media?.video;
  }

  getVideoUrl(post: Post): string | null {
    return post.media?.video?.url || null;
  }
}
