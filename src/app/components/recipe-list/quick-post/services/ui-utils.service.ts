import { Injectable } from '@angular/core';
import { ExtendedPost } from '../models/quick-post.models';

@Injectable({
  providedIn: 'root',
})
export class UiUtilsService {
  formatDate(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return date.toLocaleDateString();
    } else if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  }

  async copyShareLink(url: string | undefined): Promise<void> {
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  getImageCount(post: ExtendedPost): number {
    if (!post.media || post.media.type !== 'image') return 0;
    return Array.isArray(post.media.content) ? post.media.content.length : 0;
  }

  isImageContent(content: any[]): boolean {
    return Array.isArray(content);
  }

  isVideoContent(content: any): boolean {
    return !Array.isArray(content) && content.hasOwnProperty('duration');
  }
}
