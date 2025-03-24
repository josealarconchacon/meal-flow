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

export interface Reply {
  id: string;
  content: string;
  author: {
    uid: string;
    displayName: string;
    photoURL: string;
  };
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
}

export interface Comment {
  id: string;
  content: string;
  author: {
    uid: string;
    displayName: string;
    photoURL: string;
  };
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  replies?: Reply[];
  showReplyForm?: boolean;
  replyContent?: string;
  hasMoreReplies?: boolean;
  totalReplies?: number;
}

export interface CommentsResponse {
  comments: Comment[];
  totalComments: number;
  hasMore: boolean;
}

export interface Post {
  id: string;
  content: string;
  author: {
    uid: string;
    displayName: string;
    photoURL: string;
  };
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  media?: {
    images?: Array<{
      url: string;
      path: string;
      type: string;
    }>;
    video?: {
      url: string;
      path: string;
      type: string;
      thumbnail?: string;
    };
  };
  stats: {
    likes: number;
    comments: number;
  };
  comments?: Comment[];
  likes?: Array<{
    userId: string;
    createdAt: {
      seconds: number;
      nanoseconds: number;
    };
  }>;
  updatedAt?: {
    seconds: number;
    nanoseconds: number;
  };
  status: 'active' | 'deleted' | 'hidden';
  tags?: string[];
  showComments?: boolean;
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
  media?: {
    images?: Array<{
      url: string;
      path: string;
      type: string;
    }>;
    video?: {
      url: string;
      path: string;
      type: string;
      thumbnail?: string;
    };
  };
};

export interface CreateCommentDTO {
  content: string;
  author: {
    uid: string;
    displayName: string;
    photoURL: string;
  };
}

// Firebase collection structure
export const FIREBASE_COLLECTIONS = {
  POSTS: 'posts',
  COMMENTS: 'comments',
  LIKES: 'likes',
  POST_MEDIA: 'post-media',
  REPLIES: 'replies',
} as const;

// Firebase Storage structure
export const STORAGE_PATHS = {
  POST_IMAGES: 'posts/images',
  POST_VIDEOS: 'posts/videos',
  POST_THUMBNAILS: 'posts/thumbnails',
} as const;
