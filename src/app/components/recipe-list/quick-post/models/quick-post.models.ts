import { Post, Comment, Reply } from '../../../../services/quick-post.service';

export interface ExtendedComment extends Comment {
  timestamp: Date;
  replies: ExtendedReply[];
}

export interface ExtendedReply extends Reply {
  timestamp: Date;
}

export interface ExtendedPost extends Post {
  timestamp: Date;
  comments: ExtendedComment[];
  username: string;
  shareUrl?: string;
}

export interface MediaItem {
  type: 'image' | 'video';
  content: ImageItem[] | VideoItem;
}

export interface StoredMediaItem {
  type: 'image' | 'video';
  content: StoredImageItem[] | StoredVideoItem;
}

export interface ImageItem {
  file: File;
  preview: string;
}

export interface VideoItem {
  file: File;
  preview: string;
  duration: number;
}

export interface StoredImageItem {
  url: string;
  preview: string;
}

export interface StoredVideoItem {
  url: string;
  preview: string;
  duration: number;
}
