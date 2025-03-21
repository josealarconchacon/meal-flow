import { Injectable } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ImageItem, VideoItem } from '../models/quick-post.models';

@Injectable({
  providedIn: 'root',
})
export class MediaHandlerService {
  constructor(private sanitizer: DomSanitizer) {}

  async compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Could not compress image'));
            }
          },
          'image/jpeg',
          0.8
        );
      };
      img.onerror = () => reject(new Error('Could not load image'));
    });
  }

  async validateVideo(
    file: File
  ): Promise<{ valid: boolean; duration?: number }> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration;
        const valid = duration <= 300; // 5 minutes max
        resolve({ valid, duration });
      };

      video.onerror = () => {
        resolve({ valid: false });
      };

      video.src = URL.createObjectURL(file);
    });
  }

  async getDataUrlFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  sanitizeVideoUrl(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  getVideoThumbnail(videoItem: VideoItem): string {
    return videoItem.preview;
  }

  getVideoDuration(videoItem: VideoItem): string {
    const minutes = Math.floor(videoItem.duration / 60);
    const seconds = Math.floor(videoItem.duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
