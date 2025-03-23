export interface PostUser {
  uid?: string;
  displayName: string;
  photoURL: string;
}

export interface PostMedia {
  url: string;
  type: string;
  thumbnailUrl?: string;
}

export interface Post {
  id: string;
  content: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  updatedAt?: {
    seconds: number;
    nanoseconds: number;
  };
  author: {
    uid: string;
    displayName: string;
    photoURL: string;
  };
  media?: {
    images?: {
      url: string;
      path: string;
      type: string;
    }[];
    video?: {
      url: string;
      path: string;
      type: string;
      thumbnail?: string;
    };
  };
  stats?: {
    likes: number;
    comments: number;
  };
  status: 'active' | 'deleted' | 'hidden';
  tags?: string[];
}

// Helper type for creating a new post
export type CreatePostDTO = Omit<
  Post,
  'id' | 'createdAt' | 'stats' | 'status'
> & {
  content: string;
  author: {
    uid: string;
    displayName: string;
    photoURL: string;
  };
};

// Firebase collection structure
export const FIREBASE_COLLECTIONS = {
  POSTS: 'posts',
  COMMENTS: 'comments',
  LIKES: 'likes',
  POST_MEDIA: 'post-media',
} as const;

// Firebase Storage structure
export const STORAGE_PATHS = {
  POST_IMAGES: 'posts/images',
  POST_VIDEOS: 'posts/videos',
  POST_THUMBNAILS: 'posts/thumbnails',
} as const;
