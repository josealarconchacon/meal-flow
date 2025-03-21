import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  setDoc,
  writeBatch,
} from '@angular/fire/firestore';
import { Observable, firstValueFrom } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { collectionData } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
} from '@angular/fire/storage';
import { Auth } from '@angular/fire/auth';

export interface FirebasePost {
  id?: string;
  text: string;
  userId: string;
  username: string;
  timestamp: any;
  likes: number;
  likedBy: string[];
  comments: FirebaseComment[];
  shares: number;
  tags: string[];
  images?: string[];
  video?: {
    url: string;
    thumbnail: string;
    duration: number;
  };
}

export interface FirebaseComment {
  id?: string;
  text: string;
  userId: string;
  username: string;
  timestamp: any;
  likes: number;
  likedBy: string[];
  replies?: FirebaseComment[];
  parentId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  constructor(
    private firestore: Firestore,
    private storage: Storage,
    private authService: AuthService,
    private auth: Auth
  ) {}

  private async getCurrentUser() {
    const isAuthenticated = await firstValueFrom(
      this.authService.isAuthenticated$.pipe(take(1))
    );
    if (!isAuthenticated) throw new Error('User must be authenticated');

    const user = this.auth.currentUser;
    if (!user) throw new Error('No authenticated user found');

    return user;
  }

  // Add public method to check ownership
  isCurrentUserOwner(userId: string): boolean {
    return this.auth.currentUser?.uid === userId;
  }

  // Posts Methods
  getPosts(): Observable<FirebasePost[]> {
    const postsRef = collection(this.firestore, 'posts');
    const postsQuery = query(postsRef, orderBy('timestamp', 'desc'));
    return collectionData(postsQuery, { idField: 'id' }) as Observable<
      FirebasePost[]
    >;
  }

  async createPost(post: Partial<FirebasePost>): Promise<string> {
    const user = await this.getCurrentUser();

    const postData = {
      ...post,
      userId: user.uid,
      username: user.displayName || 'Anonymous',
      timestamp: serverTimestamp(),
      likes: 0,
      likedBy: [],
      comments: [],
      shares: 0,
    };

    // Handle media uploads if present
    if (post.images && post.images.length > 0) {
      const uploadedUrls = await Promise.all(
        post.images.map((image) => this.uploadMedia(image, 'images'))
      );
      postData.images = uploadedUrls;
    }

    if (post.video) {
      const videoUrl = await this.uploadMedia(post.video.url, 'videos');
      const thumbnailUrl = await this.uploadMedia(
        post.video.thumbnail,
        'thumbnails'
      );
      postData.video = {
        url: videoUrl,
        thumbnail: thumbnailUrl,
        duration: post.video.duration,
      };
    }

    const docRef = await addDoc(collection(this.firestore, 'posts'), postData);
    return docRef.id;
  }

  async deletePost(postId: string): Promise<void> {
    const user = await this.getCurrentUser();

    const postRef = doc(this.firestore, 'posts', postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) throw new Error('Post not found');
    if (postSnap.data()['userId'] !== user.uid)
      throw new Error('Unauthorized to delete this post');

    await deleteDoc(postRef);
  }

  async likePost(postId: string): Promise<void> {
    const user = await this.getCurrentUser();

    const postRef = doc(this.firestore, 'posts', postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) throw new Error('Post not found');

    const likedBy = postSnap.data()['likedBy'] || [];
    const isLiked = likedBy.includes(user.uid);

    await updateDoc(postRef, {
      likes: isLiked
        ? postSnap.data()['likes'] - 1
        : postSnap.data()['likes'] + 1,
      likedBy: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
    });
  }

  async sharePost(postId: string): Promise<void> {
    const user = await this.getCurrentUser();
    const postRef = doc(this.firestore, 'posts', postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) throw new Error('Post not found');

    await updateDoc(postRef, {
      shares: (postSnap.data()['shares'] || 0) + 1,
    });
  }

  // Comments Methods
  async addComment(postId: string, text: string): Promise<string> {
    const user = await this.getCurrentUser();
    const commentId = crypto.randomUUID();

    const comment: FirebaseComment = {
      id: commentId,
      text,
      userId: user.uid,
      username: user.displayName ?? 'Anonymous',
      timestamp: new Date().toISOString(),
      likes: 0,
      likedBy: [],
      replies: [],
    };

    // Create a reference to the comment document in the subcollection
    const commentRef = doc(
      this.firestore,
      `posts/${postId}/comments`,
      commentId
    );
    await setDoc(commentRef, comment);
    return commentId;
  }

  async getComments(postId: string): Promise<FirebaseComment[]> {
    const commentsRef = collection(this.firestore, `posts/${postId}/comments`);
    const commentsQuery = query(commentsRef, orderBy('timestamp', 'desc'));
    const commentsSnap = await getDocs(commentsQuery);

    // Get comments
    const comments = commentsSnap.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as FirebaseComment[];

    // Get replies for each comment
    for (const comment of comments) {
      if (comment.id) {
        comment.replies = await this.getReplies(postId, comment.id);
      } else {
        comment.replies = [];
      }
    }

    return comments;
  }

  async likeComment(postId: string, commentId: string): Promise<void> {
    const user = await this.getCurrentUser();
    const commentRef = doc(
      this.firestore,
      `posts/${postId}/comments/${commentId}`
    );

    const commentSnap = await getDoc(commentRef);
    if (!commentSnap.exists()) throw new Error('Comment not found');

    const commentData = commentSnap.data() as FirebaseComment;
    const likedBy = commentData['likedBy'] || [];
    const isLiked = likedBy.includes(user.uid);

    await updateDoc(commentRef, {
      ['likes']: isLiked ? commentData['likes'] - 1 : commentData['likes'] + 1,
      ['likedBy']: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
    });
  }

  async deleteComment(postId: string, commentId: string): Promise<void> {
    const user = await this.getCurrentUser();
    const commentRef = doc(
      this.firestore,
      `posts/${postId}/comments/${commentId}`
    );

    const commentSnap = await getDoc(commentRef);
    if (!commentSnap.exists()) throw new Error('Comment not found');

    const commentData = commentSnap.data() as FirebaseComment;
    if (commentData['userId'] !== user.uid) {
      throw new Error('Unauthorized to delete this comment');
    }

    // Delete all replies first
    const repliesRef = collection(
      this.firestore,
      `posts/${postId}/comments/${commentId}/replies`
    );
    const repliesSnap = await getDocs(repliesRef);
    const batch = writeBatch(this.firestore);

    repliesSnap.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete the comment
    batch.delete(commentRef);
    await batch.commit();
  }

  async addReply(
    postId: string,
    commentId: string,
    text: string
  ): Promise<string> {
    try {
      // First check authentication
      const user = await this.getCurrentUser();

      if (!postId?.trim()) {
        throw new Error('Post ID is required');
      }
      if (!commentId?.trim()) {
        throw new Error('Comment ID is required');
      }
      if (!text?.trim()) {
        throw new Error('Reply text is required');
      }

      // Verify that the post exists
      const postRef = doc(this.firestore, 'posts', postId);
      const postSnap = await getDoc(postRef);
      if (!postSnap.exists()) {
        throw new Error('Post not found');
      }

      // Verify that the comment exists
      const commentRef = doc(
        this.firestore,
        `posts/${postId}/comments/${commentId}`
      );
      const commentSnap = await getDoc(commentRef);
      if (!commentSnap.exists()) {
        throw new Error('Comment not found');
      }

      const replyId = crypto.randomUUID();

      const reply = {
        id: replyId,
        text,
        userId: user.uid,
        username: user.displayName || 'Anonymous',
        timestamp: new Date().toISOString(),
        likes: 0,
        likedBy: [],
      };

      // Create a reference to the reply document in the subcollection
      const replyRef = doc(
        this.firestore,
        `posts/${postId}/comments/${commentId}/replies`,
        replyId
      );

      // Add the reply
      await setDoc(replyRef, reply);
      return replyId;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to add reply: ${error.message}`);
      }
      throw new Error('Failed to add reply: Unknown error');
    }
  }

  async getReplies(
    postId: string,
    commentId: string
  ): Promise<FirebaseComment[]> {
    const repliesRef = collection(
      this.firestore,
      `posts/${postId}/comments/${commentId}/replies`
    );
    const repliesSnap = await getDocs(repliesRef);
    return repliesSnap.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as FirebaseComment[];
  }

  async likeReply(
    postId: string,
    commentId: string,
    replyId: string
  ): Promise<void> {
    const user = await this.getCurrentUser();
    const replyRef = doc(
      this.firestore,
      `posts/${postId}/comments/${commentId}/replies/${replyId}`
    );

    const replySnap = await getDoc(replyRef);
    if (!replySnap.exists()) throw new Error('Reply not found');

    const replyData = replySnap.data();
    const likedBy = replyData['likedBy'] || [];
    const isLiked = likedBy.includes(user.uid);

    await updateDoc(replyRef, {
      ['likes']: isLiked ? replyData['likes'] - 1 : replyData['likes'] + 1,
      ['likedBy']: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
    });
  }

  async deleteReply(
    postId: string,
    commentId: string,
    replyId: string
  ): Promise<void> {
    const user = await this.getCurrentUser();
    const replyRef = doc(
      this.firestore,
      `posts/${postId}/comments/${commentId}/replies/${replyId}`
    );

    const replySnap = await getDoc(replyRef);
    if (!replySnap.exists()) throw new Error('Reply not found');

    const replyData = replySnap.data();
    if (replyData['userId'] !== user.uid) {
      throw new Error('Unauthorized to delete this reply');
    }

    await deleteDoc(replyRef);
  }

  private async uploadMedia(dataUrl: string, folder: string): Promise<string> {
    const user = await this.getCurrentUser();
    const timestamp = Date.now();
    const path = `${folder}/${user.uid}/${timestamp}`;
    const storageRef = ref(this.storage, path);

    // Convert data URL to Blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Upload file
    const snapshot = await uploadBytes(storageRef, blob);
    return await getDownloadURL(snapshot.ref);
  }
}
