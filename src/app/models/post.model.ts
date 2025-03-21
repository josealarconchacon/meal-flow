export interface Post {
  id?: string;
  text: string;
  userId: string;
  username: string;
  timestamp: Date;
  imageUrl?: string;
  tags?: string[];
  likes: number;
  likedBy: string[];
  comments: Comment[];
  shares: number;
}

export interface Comment {
  id: string;
  text: string;
  userId: string;
  username: string;
  timestamp: Date;
  likes: number;
  likedBy: string[];
  replies: Reply[];
}

export interface Reply {
  id: string;
  text: string;
  userId: string;
  username: string;
  timestamp: Date;
  likes?: number;
  likedBy?: string[];
}

export class PostValidators {
  static readonly MAX_TEXT_LENGTH = 2000;
  static readonly MAX_TAGS = 10;
  static readonly MAX_COMMENTS = 1000;
  static readonly MAX_COMMENT_LENGTH = 1000;
  static readonly MAX_REPLY_LENGTH = 1000;

  static validatePost(post: Post): boolean {
    return (
      post.text?.length > 0 &&
      post.text?.length <= this.MAX_TEXT_LENGTH &&
      post.userId?.length > 0 &&
      post.username?.length > 0 &&
      post.timestamp instanceof Date &&
      (!post.tags || post.tags.length <= this.MAX_TAGS) &&
      (!post.imageUrl || this.validateImageUrl(post.imageUrl)) &&
      typeof post.likes === 'number' &&
      Array.isArray(post.likedBy) &&
      Array.isArray(post.comments) &&
      post.comments.length <= this.MAX_COMMENTS &&
      post.comments.every(this.validateComment) &&
      typeof post.shares === 'number'
    );
  }

  static validateComment(comment: Comment): boolean {
    return (
      comment.id?.length > 0 &&
      comment.text?.length > 0 &&
      comment.text?.length <= this.MAX_COMMENT_LENGTH &&
      comment.userId?.length > 0 &&
      comment.username?.length > 0 &&
      comment.timestamp instanceof Date &&
      typeof comment.likes === 'number' &&
      Array.isArray(comment.likedBy) &&
      Array.isArray(comment.replies) &&
      comment.replies.every(this.validateReply)
    );
  }

  static validateReply(reply: Reply): boolean {
    return (
      reply.id?.length > 0 &&
      reply.text?.length > 0 &&
      reply.text?.length <= this.MAX_REPLY_LENGTH &&
      reply.userId?.length > 0 &&
      reply.username?.length > 0 &&
      reply.timestamp instanceof Date &&
      (reply.likes === undefined || typeof reply.likes === 'number') &&
      (reply.likedBy === undefined || Array.isArray(reply.likedBy))
    );
  }

  private static validateImageUrl(url: string): boolean {
    return (
      url.length <= 500 && /^https?:\/\/.*\.(png|jpg|jpeg|gif|webp)$/.test(url)
    );
  }
}

// Type guards for runtime type checking
export function isPost(obj: any): obj is Post {
  return (
    obj &&
    typeof obj.text === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.username === 'string' &&
    obj.timestamp instanceof Date &&
    typeof obj.likes === 'number' &&
    Array.isArray(obj.likedBy) &&
    Array.isArray(obj.comments) &&
    typeof obj.shares === 'number'
  );
}

export function isComment(obj: any): obj is Comment {
  return (
    obj &&
    typeof obj.text === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.username === 'string' &&
    obj.timestamp instanceof Date &&
    typeof obj.likes === 'number' &&
    Array.isArray(obj.likedBy) &&
    Array.isArray(obj.replies)
  );
}

export function isReply(obj: any): obj is Reply {
  return (
    obj &&
    typeof obj.text === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.username === 'string' &&
    obj.timestamp instanceof Date &&
    (obj.likes === undefined || typeof obj.likes === 'number') &&
    (obj.likedBy === undefined || Array.isArray(obj.likedBy))
  );
}
