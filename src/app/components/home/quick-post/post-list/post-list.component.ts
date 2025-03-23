import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Post } from '../models/post.model';

@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class PostListComponent {
  @Input() posts: Post[] = [];

  getFormattedDate(timestamp: {
    seconds: number;
    nanoseconds: number;
  }): string {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  getLikesCount(post: Post): number {
    return post.stats?.likes || 0;
  }

  getCommentsCount(post: Post): number {
    return post.stats?.comments || 0;
  }
}
