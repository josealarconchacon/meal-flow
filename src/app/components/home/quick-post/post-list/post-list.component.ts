import { Component, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Post } from '../models/post.model';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.css'],
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
})
export class PostListComponent {
  @Input() posts: Post[] = [];

  constructor(private dialog: MatDialog) {}

  getFormattedDate(timestamp: {
    seconds: number;
    nanoseconds: number;
  }): string {
    if (!timestamp || !timestamp.seconds) {
      return 'Just now';
    }

    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // If less than a minute ago
    if (diffInSeconds < 60) {
      return 'Just now';
    }

    // If less than an hour ago
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }

    // If less than a day ago
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }

    // If less than a week ago
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }

    // For older dates, show the full date
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
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

  openMediaViewer(media: { url: string; type: string }) {
    // TODO: Implement media viewer dialog
    console.log('Opening media viewer:', media);
  }
}
