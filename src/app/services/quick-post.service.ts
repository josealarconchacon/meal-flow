import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { UserService } from './user.service';

export interface Reply {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: string;
  likes: number;
  likedBy: string[];
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: string;
  likes: number;
  likedBy: string[];
  replies?: Reply[];
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: string;
  likes: number;
  likedBy: string[];
  comments: Comment[];
  tags: string[];
  images?: string[];
  video?: {
    url: string;
    thumbnail: string;
    duration: number;
  };
  shareUrl?: string;
  shares: number;
}

export interface ShareOption {
  id: string;
  label: string;
  icon: string;
  action: 'share' | 'copy';
}

@Injectable({
  providedIn: 'root',
})
export class QuickPostService {
  private currentUser = {
    id: 'user1',
    username: 'Recipe Enthusiast',
  };

  private posts = new BehaviorSubject<Post[]>([]);

  constructor(private userService: UserService) {
    // Initialize with some sample data if needed
  }

  getPosts(): Observable<Post[]> {
    return this.posts.asObservable();
  }

  getUserPosts(): Observable<Post[]> {
    return combineLatest([
      this.getPosts(),
      this.userService.getCurrentUser(),
    ]).pipe(
      map(([posts, user]) => posts.filter((post) => post.userId === user.id))
    );
  }

  getUserPostsByUserId(userId: string): Observable<Post[]> {
    return this.getPosts().pipe(
      map((posts) => posts.filter((post) => post.userId === userId))
    );
  }

  getLikedPosts(): Observable<Post[]> {
    return combineLatest([
      this.getPosts(),
      this.userService.getCurrentUser(),
    ]).pipe(
      map(([posts, user]) =>
        posts.filter((post) => post.likedBy?.includes(user.id))
      )
    );
  }

  getLikedPostsByUserId(userId: string): Observable<Post[]> {
    return this.getPosts().pipe(
      map((posts) => posts.filter((post) => post.likedBy?.includes(userId)))
    );
  }

  getCurrentUserId(): string {
    return this.currentUser.id;
  }

  addPost(post: Partial<Post>): void {
    const newPost: Post = {
      id: Date.now().toString(),
      userId: this.currentUser.id,
      username: this.currentUser.username,
      text: post.text || '',
      timestamp: new Date().toISOString(),
      likes: 0,
      likedBy: [],
      comments: [],
      tags: post.tags || [],
      images: post.images,
      video: post.video,
      shareUrl: `https://example.com/post/${Date.now()}`,
      shares: 0,
    };

    this.posts.next([newPost, ...this.posts.value]);
  }

  deletePost(postId: string): void {
    this.posts.next(this.posts.value.filter((post) => post.id !== postId));
  }

  likePost(postId: string): void {
    const updatedPosts = this.posts.value.map((post) => {
      if (post.id === postId) {
        const hasLiked = post.likedBy.includes(this.currentUser.id);
        return {
          ...post,
          likes: hasLiked ? post.likes - 1 : post.likes + 1,
          likedBy: hasLiked
            ? post.likedBy.filter((id) => id !== this.currentUser.id)
            : [...post.likedBy, this.currentUser.id],
        };
      }
      return post;
    });

    this.posts.next(updatedPosts);
  }

  hasUserLikedPost(postId: string): boolean {
    const post = this.posts.value.find((p) => p.id === postId);
    return post ? post.likedBy.includes(this.currentUser.id) : false;
  }

  sharePost(postId: string): void {
    const updatedPosts = this.posts.value.map((post) => {
      if (post.id === postId) {
        return {
          ...post,
          shares: post.shares + 1,
        };
      }
      return post;
    });

    this.posts.next(updatedPosts);
  }

  addComment(postId: string, text: string): void {
    const newComment: Comment = {
      id: Date.now().toString(),
      userId: this.currentUser.id,
      username: this.currentUser.username,
      text,
      timestamp: new Date().toISOString(),
      likes: 0,
      likedBy: [],
      replies: [],
    };

    const updatedPosts = this.posts.value.map((post) => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [newComment, ...post.comments],
        };
      }
      return post;
    });

    this.posts.next(updatedPosts);
  }

  addReply(postId: string, commentId: string, text: string): void {
    const newReply: Reply = {
      id: Date.now().toString(),
      userId: this.currentUser.id,
      username: this.currentUser.username,
      text,
      timestamp: new Date().toISOString(),
      likes: 0,
      likedBy: [],
    };

    const updatedPosts = this.posts.value.map((post) => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments.map((comment) => {
            if (comment.id === commentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newReply],
              };
            }
            return comment;
          }),
        };
      }
      return post;
    });

    this.posts.next(updatedPosts);
  }

  likeComment(postId: string, commentId: string): void {
    const updatedPosts = this.posts.value.map((post) => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments.map((comment) => {
            if (comment.id === commentId) {
              const hasLiked = comment.likedBy.includes(this.currentUser.id);
              return {
                ...comment,
                likes: hasLiked ? comment.likes - 1 : comment.likes + 1,
                likedBy: hasLiked
                  ? comment.likedBy.filter((id) => id !== this.currentUser.id)
                  : [...comment.likedBy, this.currentUser.id],
              };
            }
            return comment;
          }),
        };
      }
      return post;
    });

    this.posts.next(updatedPosts);
  }

  likeReply(postId: string, commentId: string, replyId: string): void {
    const updatedPosts = this.posts.value.map((post) => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments.map((comment) => {
            if (comment.id === commentId) {
              return {
                ...comment,
                replies: (comment.replies || []).map((reply) => {
                  if (reply.id === replyId) {
                    const hasLiked = reply.likedBy.includes(
                      this.currentUser.id
                    );
                    return {
                      ...reply,
                      likes: hasLiked ? reply.likes - 1 : reply.likes + 1,
                      likedBy: hasLiked
                        ? reply.likedBy.filter(
                            (id) => id !== this.currentUser.id
                          )
                        : [...reply.likedBy, this.currentUser.id],
                    };
                  }
                  return reply;
                }),
              };
            }
            return comment;
          }),
        };
      }
      return post;
    });

    this.posts.next(updatedPosts);
  }

  deleteComment(postId: string, commentId: string): void {
    const updatedPosts = this.posts.value.map((post) => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments.filter((comment) => comment.id !== commentId),
        };
      }
      return post;
    });

    this.posts.next(updatedPosts);
  }

  deleteReply(postId: string, commentId: string, replyId: string): void {
    const updatedPosts = this.posts.value.map((post) => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments.map((comment) => {
            if (comment.id === commentId) {
              return {
                ...comment,
                replies: (comment.replies || []).filter(
                  (reply) => reply.id !== replyId
                ),
              };
            }
            return comment;
          }),
        };
      }
      return post;
    });

    this.posts.next(updatedPosts);
  }

  hasUserLikedComment(postId: string, commentId: string): boolean {
    const post = this.posts.value.find((p) => p.id === postId);
    const comment = post?.comments.find((c) => c.id === commentId);
    return comment ? comment.likedBy.includes(this.currentUser.id) : false;
  }

  hasUserLikedReply(
    postId: string,
    commentId: string,
    replyId: string
  ): boolean {
    const post = this.posts.value.find((p) => p.id === postId);
    const comment = post?.comments.find((c) => c.id === commentId);
    const reply = comment?.replies?.find((r) => r.id === replyId);
    return reply ? reply.likedBy.includes(this.currentUser.id) : false;
  }

  getShareOptions(): ShareOption[] {
    return [
      {
        id: 'copy',
        label: 'Copy Link',
        icon: 'fas fa-link',
        action: 'copy',
      },
      {
        id: 'facebook',
        label: 'Share on Facebook',
        icon: 'fab fa-facebook',
        action: 'share',
      },
      {
        id: 'twitter',
        label: 'Share on Twitter',
        icon: 'fab fa-twitter',
        action: 'share',
      },
      {
        id: 'whatsapp',
        label: 'Share on WhatsApp',
        icon: 'fab fa-whatsapp',
        action: 'share',
      },
    ];
  }
}
