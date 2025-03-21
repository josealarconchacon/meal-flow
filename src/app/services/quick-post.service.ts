import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map, from } from 'rxjs';
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
  getDocs,
  getDoc,
} from '@angular/fire/firestore';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
} from '@angular/fire/storage';
import { AuthService } from './auth.service';
import { PostValidators } from '../models/post.model';

export interface ShareOption {
  id: string;
  label: string;
  icon: string;
  action: 'share' | 'copy';
}

export interface Post {
  id: string;
  text: string;
  userId: string;
  username: string;
  timestamp: Date;
  likes: number;
  likedBy: string[];
  comments: Comment[];
  shares: number;
  tags?: string[];
  media?: {
    type: 'image' | 'video';
    content: any;
  };
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

export interface Reply extends Comment {
  parentCommentId: string;
}

@Injectable({
  providedIn: 'root',
})
export class QuickPostService {
  private posts = new BehaviorSubject<Post[]>([]);
  private readonly POSTS_COLLECTION = 'posts';

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
    const postsRef = collection(this.firestore, this.POSTS_COLLECTION);
    const q = query(postsRef, orderBy('timestamp', 'desc'));

    return from(getDocs(q)).pipe(
      map((snapshot) =>
        snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Post)
        )
      )
    );
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

  async createPost(post: Post): Promise<string> {
    if (!PostValidators.validatePost(post)) {
      throw new Error('Invalid post data');
    }

    const postsRef = collection(this.firestore, this.POSTS_COLLECTION);
    const docRef = await addDoc(postsRef, post);
    return docRef.id;
  }

  async deletePost(postId: string): Promise<void> {
    const postRef = doc(this.firestore, this.POSTS_COLLECTION, postId);
    await deleteDoc(postRef);
  }

  async likePost(postId: string, userId: string): Promise<void> {
    const postRef = doc(this.firestore, this.POSTS_COLLECTION, postId);
    const post = (
      await getDocs(query(collection(this.firestore, this.POSTS_COLLECTION)))
    ).docs.find((doc) => doc.id === postId);

    if (!post) {
      throw new Error('Post not found');
    }

    const postData = post.data() as Post;
    const likedBy = postData.likedBy || [];
    const isLiked = likedBy.includes(userId);

    await updateDoc(postRef, {
      likes: isLiked ? postData.likes - 1 : postData.likes + 1,
      likedBy: isLiked
        ? likedBy.filter((id) => id !== userId)
        : [...likedBy, userId],
    });
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

  async addComment(postId: string, comment: Comment): Promise<void> {
    if (!PostValidators.validateComment(comment)) {
      throw new Error('Invalid comment data');
    }

    const postRef = doc(this.firestore, this.POSTS_COLLECTION, postId);
    const post = (
      await getDocs(query(collection(this.firestore, this.POSTS_COLLECTION)))
    ).docs.find((doc) => doc.id === postId);

    if (!post) {
      throw new Error('Post not found');
    }

    const postData = post.data() as Post;
    const comments = postData.comments || [];

    await updateDoc(postRef, {
      comments: [...comments, comment],
    });
  }

  async addReply(
    postId: string,
    commentId: string,
    reply: Reply
  ): Promise<void> {
    if (!PostValidators.validateReply(reply)) {
      throw new Error('Invalid reply data');
    }

    const postRef = doc(this.firestore, this.POSTS_COLLECTION, postId);
    const post = (
      await getDocs(query(collection(this.firestore, this.POSTS_COLLECTION)))
    ).docs.find((doc) => doc.id === postId);

    if (!post) {
      throw new Error('Post not found');
    }

    const postData = post.data() as Post;
    const comments = postData.comments || [];
    const commentIndex = comments.findIndex((c) => c.id === commentId);

    if (commentIndex === -1) {
      throw new Error('Comment not found');
    }

    const comment = comments[commentIndex];
    const replies = comment.replies || [];

    // Initialize likes and likedBy for the new reply
    const replyWithLikes: Reply = {
      ...reply,
      likes: 0,
      likedBy: [],
    };

    comments[commentIndex] = {
      ...comment,
      replies: [...replies, replyWithLikes],
    };

    await updateDoc(postRef, { comments });
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

  async likeComment(postId: string, commentId: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    const postRef = doc(this.firestore, this.POSTS_COLLECTION, postId);
    const post = await getDoc(postRef);
    if (!post.exists()) throw new Error('Post not found');

    const postData = post.data() as Post;
    const comments = postData.comments || [];
    const commentIndex = comments.findIndex((c) => c.id === commentId);
    if (commentIndex === -1) throw new Error('Comment not found');

    const comment = comments[commentIndex];
    const userLiked = comment.likedBy.includes(user.uid);

    comments[commentIndex] = {
      ...comment,
      likes: userLiked ? comment.likes - 1 : comment.likes + 1,
      likedBy: userLiked
        ? comment.likedBy.filter((id) => id !== user.uid)
        : [...comment.likedBy, user.uid],
    };

    await updateDoc(postRef, { comments });
  }

  async likeReply(
    postId: string,
    commentId: string,
    replyId: string
  ): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    const postRef = doc(this.firestore, this.POSTS_COLLECTION, postId);
    const post = await getDoc(postRef);
    if (!post.exists()) throw new Error('Post not found');

    const postData = post.data() as Post;
    const comments = postData.comments || [];
    const commentIndex = comments.findIndex((c) => c.id === commentId);
    if (commentIndex === -1) throw new Error('Comment not found');

    const comment = comments[commentIndex];
    const replies = comment.replies || [];
    const replyIndex = replies.findIndex((r) => r.id === replyId);
    if (replyIndex === -1) throw new Error('Reply not found');

    const reply = replies[replyIndex];
    if (!reply.likedBy) reply.likedBy = [];
    if (typeof reply.likes !== 'number') reply.likes = 0;

    const userLiked = reply.likedBy.includes(user.uid);

    replies[replyIndex] = {
      ...reply,
      likes: userLiked ? reply.likes - 1 : reply.likes + 1,
      likedBy: userLiked
        ? reply.likedBy.filter((id) => id !== user.uid)
        : [...reply.likedBy, user.uid],
    };

    comments[commentIndex] = {
      ...comment,
      replies,
    };

    await updateDoc(postRef, { comments });
  }
}
