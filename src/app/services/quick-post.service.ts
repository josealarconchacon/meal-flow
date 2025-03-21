import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { UserService } from './user.service';
import {
  FirebaseService,
  FirebasePost,
  FirebaseComment,
} from './firebase.service';
import { Auth, User } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';
import {
  Firestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  query,
  orderBy,
  onSnapshot,
} from '@angular/fire/firestore';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
} from '@angular/fire/storage';
import { AuthService } from './auth.service';

export interface Reply {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: string;
  likes: number;
  likedBy: string[];
}

export interface Comment extends FirebaseComment {}

export interface Post {
  id?: string;
  text: string;
  tags: string[];
  timestamp: string;
  likes: number;
  likedBy: string[];
  comments: FirebaseComment[];
  shares: number;
  media?: {
    type: 'image' | 'video';
    content:
      | {
          url: string;
          preview: string;
          duration?: number;
        }[]
      | {
          url: string;
          preview: string;
          duration: number;
        };
  };
  userId?: string;
  username?: string;
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
  private posts = new BehaviorSubject<Post[]>([]);

  private shareOptions: ShareOption[] = [
    {
      id: 'twitter',
      label: 'Twitter',
      icon: 'fab fa-twitter',
      action: 'share',
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: 'fab fa-facebook',
      action: 'share',
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: 'fab fa-whatsapp',
      action: 'share',
    },
    {
      id: 'copy',
      label: 'Copy Link',
      icon: 'fas fa-link',
      action: 'copy',
    },
  ];

  constructor(
    private userService: UserService,
    private firebaseService: FirebaseService,
    private auth: Auth,
    private firestore: Firestore,
    private storage: Storage,
    private authService: AuthService
  ) {}

  getPosts(): Observable<Post[]> {
    return this.firebaseService.getPosts();
  }

  getUserPosts(): Observable<Post[]> {
    return combineLatest([
      this.getPosts(),
      this.userService.getCurrentUser(),
    ]).pipe(
      map(([posts, user]) =>
        user ? posts.filter((post) => post.userId === user.id) : []
      )
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
        user ? posts.filter((post) => post.likedBy?.includes(user.id)) : []
      )
    );
  }

  getLikedPostsByUserId(userId: string): Observable<Post[]> {
    return this.getPosts().pipe(
      map((posts) => posts.filter((post) => post.likedBy?.includes(userId)))
    );
  }

  getCurrentUserId(): string | null {
    return this.auth.currentUser?.uid || null;
  }

  async addPost(post: Partial<Post>): Promise<string> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    const currentUser = await firstValueFrom(this.userService.getCurrentUser());
    if (!currentUser) throw new Error('No user profile found');

    const postData: Partial<Post> = {
      ...post,
      userId: user.uid,
      username: currentUser.username,
      timestamp: new Date().toISOString(),
      likes: 0,
      likedBy: [],
      comments: [],
    };

    return await this.firebaseService.createPost(postData);
  }

  async deletePost(postId: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No authenticated user');
    await this.firebaseService.deletePost(postId);
  }

  async likePost(postId: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No authenticated user');
    await this.firebaseService.likePost(postId);
  }

  hasUserLikedPost(postId: string): boolean {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    const post = this.posts.value.find((p) => p.id === postId);
    return post ? post.likedBy?.includes(userId) || false : false;
  }

  async sharePost(postId: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No authenticated user');
    await this.firebaseService.sharePost(postId);
  }

  async addComment(postId: string, text: string): Promise<string> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No authenticated user');
    return await this.firebaseService.addComment(postId, text);
  }

  async addReply(
    postId: string,
    commentId: string,
    text: string
  ): Promise<string> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No authenticated user');
    return await this.firebaseService.addReply(postId, commentId, text);
  }

  async likeComment(postId: string, commentId: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No authenticated user');
    await this.firebaseService.likeComment(postId, commentId);
  }

  async likeReply(
    postId: string,
    commentId: string,
    replyId: string
  ): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No authenticated user');
    await this.firebaseService.likeReply(postId, commentId, replyId);
  }

  async deleteComment(postId: string, commentId: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No authenticated user');
    await this.firebaseService.deleteComment(postId, commentId);
  }

  async deleteReply(
    postId: string,
    commentId: string,
    replyId: string
  ): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No authenticated user');
    await this.firebaseService.deleteReply(postId, commentId, replyId);
  }

  hasUserLikedComment(postId: string, commentId: string): boolean {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    const post = this.posts.value.find((p) => p.id === postId);
    const comment = post?.comments?.find((c) => c.id === commentId);
    return comment ? comment.likedBy?.includes(userId) || false : false;
  }

  hasUserLikedReply(
    postId: string,
    commentId: string,
    replyId: string
  ): boolean {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    const post = this.posts.value.find((p) => p.id === postId);
    const comment = post?.comments?.find((c) => c.id === commentId);
    const reply = comment?.replies?.find((r) => r.id === replyId);
    return reply ? reply.likedBy?.includes(userId) || false : false;
  }

  getShareOptions(): ShareOption[] {
    return this.shareOptions;
  }

  async uploadMedia(file: File, folder: 'images' | 'videos'): Promise<string> {
    try {
      // Get current user and ensure they are authenticated
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated to upload media');
      }

      // Create metadata for the file
      const metadata = {
        contentType: file.type,
        customMetadata: {
          'uploaded-by': user.uid,
          'original-name': file.name,
        },
      };

      const timestamp = new Date().getTime();
      const filePath = `${folder}/${user.uid}/${timestamp}_${file.name}`;
      const storageRef = ref(this.storage, filePath);

      // Upload the file with metadata
      const snapshot = await uploadBytes(storageRef, file, metadata);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (error: any) {
      console.error('Error uploading media:', error);
      if (error.code === 'storage/unauthorized') {
        throw new Error('You must be authenticated to upload media');
      } else if (error.code === 'storage/canceled') {
        throw new Error('Upload was cancelled');
      } else if (error.code === 'storage/unknown') {
        throw new Error('An unknown error occurred during upload');
      }
      throw error;
    }
  }
}
