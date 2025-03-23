import { Injectable, inject, NgZone } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit as firestoreLimit,
  getDocs,
  where,
  serverTimestamp,
  Timestamp,
  DocumentReference,
  DocumentData,
  startAfter,
  collectionData,
  QueryConstraint,
} from '@angular/fire/firestore';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  StorageReference,
  uploadBytesResumable,
  UploadTask,
  UploadTaskSnapshot,
} from '@angular/fire/storage';
import { AuthService } from './auth.service';
import {
  Post,
  CreatePostDTO,
  FIREBASE_COLLECTIONS,
  STORAGE_PATHS,
} from '../components/home/quick-post/models/post.model';
import { from, Observable, map, switchMap, firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private readonly storage = inject(Storage);
  private readonly firestore = inject(Firestore);
  private readonly authService = inject(AuthService);
  private readonly ngZone = inject(NgZone);

  constructor() {}

  // Get posts as an Observable
  getPosts(limitCount: number = 10): Observable<Post[]> {
    const postsRef = collection(this.firestore, FIREBASE_COLLECTIONS.POSTS);

    // Create query with proper ordering for consistent results
    const q = query(
      postsRef,
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      orderBy('__name__'),
      firestoreLimit(limitCount)
    );

    // Add error handling and retry logic
    return collectionData(q, { idField: 'id' }).pipe(
      map((posts) => {
        if (!posts) {
          throw new Error('No posts found');
        }
        return posts as Post[];
      })
    );
  }

  // Get posts with pagination - optimized version
  getPostsWithPagination(lastPost?: Post): Observable<Post[]> {
    const postsRef = collection(this.firestore, FIREBASE_COLLECTIONS.POSTS);

    // Base query parameters with consistent ordering
    const queryConstraints: QueryConstraint[] = [
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
    ];

    // Add cursor for pagination if we have a last post
    if (lastPost) {
      queryConstraints.push(startAfter(lastPost.createdAt));
    }

    // Add limit
    queryConstraints.push(firestoreLimit(10));

    const q = query(postsRef, ...queryConstraints);

    return collectionData(q, { idField: 'id' }).pipe(
      map((posts) => {
        if (!posts) {
          throw new Error('No posts found');
        }
        return posts as Post[];
      })
    );
  }

  // Create a new post
  async createPost(postData: CreatePostDTO): Promise<string> {
    const user = await firstValueFrom(this.authService.user$);
    if (!user) {
      throw new Error('User must be authenticated to create a post');
    }

    try {
      const postRef = collection(this.firestore, FIREBASE_COLLECTIONS.POSTS);
      const timestamp = serverTimestamp();

      // Clean up the post data to ensure no undefined values
      const cleanPostData: Omit<Post, 'id'> = {
        ...postData,
        createdAt: timestamp as unknown as {
          seconds: number;
          nanoseconds: number;
        },
        stats: {
          likes: 0,
          comments: 0,
        },
        status: 'active',
      };

      // Remove undefined values from media object
      if (cleanPostData.media) {
        if (!cleanPostData.media.images?.length) {
          delete cleanPostData.media.images;
        }
        if (!cleanPostData.media.video) {
          delete cleanPostData.media.video;
        }
        if (Object.keys(cleanPostData.media).length === 0) {
          delete (cleanPostData as any).media;
        }
      }

      const docRef = await addDoc(postRef, cleanPostData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  // Upload media files
  async uploadMedia(
    file: File,
    postId: string,
    isVideo: boolean = false
  ): Promise<{ url: string; path: string; type: string }> {
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `${postId}_${Date.now()}.${fileExtension}`;
      const type = isVideo ? 'videos' : 'images';
      const storagePath = `posts/${type}/${postId}/${fileName}`;
      const fileRef = ref(this.storage, storagePath);

      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      return {
        url,
        path: storagePath,
        type: file.type,
      };
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  }

  // Delete a post (soft delete)
  async deletePost(postId: string): Promise<void> {
    try {
      const postRef = doc(this.firestore, FIREBASE_COLLECTIONS.POSTS, postId);
      await updateDoc(postRef, {
        status: 'deleted',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  // Update post content
  async updatePost(postId: string, content: string): Promise<void> {
    try {
      const postRef = doc(this.firestore, FIREBASE_COLLECTIONS.POSTS, postId);
      await updateDoc(postRef, {
        content,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }

  // Handle post likes
  async toggleLike(postId: string, userId: string): Promise<void> {
    try {
      const likeRef = doc(
        this.firestore,
        FIREBASE_COLLECTIONS.POSTS,
        postId,
        FIREBASE_COLLECTIONS.LIKES,
        userId
      );
      const likeDoc = await getDocs(
        query(
          collection(
            this.firestore,
            `${FIREBASE_COLLECTIONS.POSTS}/${postId}/${FIREBASE_COLLECTIONS.LIKES}`
          )
        )
      );

      const postRef = doc(this.firestore, FIREBASE_COLLECTIONS.POSTS, postId);

      if (likeDoc.empty) {
        await addDoc(
          collection(
            this.firestore,
            `${FIREBASE_COLLECTIONS.POSTS}/${postId}/${FIREBASE_COLLECTIONS.LIKES}`
          ),
          {
            userId,
            createdAt: serverTimestamp(),
          }
        );
        await updateDoc(postRef, {
          'stats.likes': (likeDoc.size || 0) + 1,
        });
      } else {
        await deleteDoc(likeRef);
        await updateDoc(postRef, {
          'stats.likes': Math.max((likeDoc.size || 0) - 1, 0),
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  async uploadImage(file: File): Promise<{ url: string; path: string }> {
    const user = await firstValueFrom(this.authService.user$);
    if (!user) {
      throw new Error('User must be authenticated to upload images');
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('Invalid file type. Only images are allowed.');
    }

    const timestamp = Date.now();
    const path = `${STORAGE_PATHS.POST_IMAGES}/${user.uid}/${timestamp}_${file.name}`;
    const storageRef = ref(this.storage, path);

    try {
      // Run the upload inside NgZone to ensure proper change detection
      const uploadTask = await this.ngZone.runOutsideAngular(() => {
        const task = uploadBytesResumable(storageRef, file);
        return new Promise<UploadTaskSnapshot>((resolve, reject) => {
          task.on(
            'state_changed',
            (snapshot) => {
              // Progress updates are handled in the component
            },
            (error) => {
              console.error('Upload error:', error);
              reject(error);
            },
            async () => {
              try {
                const snapshot = await task.snapshot;
                resolve(snapshot);
              } catch (error) {
                reject(error);
              }
            }
          );
        });
      });

      // Get the download URL
      const url = await getDownloadURL(uploadTask.ref);

      return { url, path };
    } catch (error: any) {
      console.error('Error uploading image:', error);
      if (error.code === 'storage/unauthorized') {
        throw new Error(
          'You do not have permission to upload images. Please check your authentication status.'
        );
      }
      throw new Error('Failed to upload image to storage. Please try again.');
    }
  }

  async uploadVideo(
    file: File
  ): Promise<{ url: string; path: string; thumbnail?: string }> {
    const user = await firstValueFrom(this.authService.user$);
    if (!user) {
      throw new Error('User must be authenticated to upload videos');
    }

    if (!file.type.startsWith('video/')) {
      throw new Error('Invalid file type. Only videos are allowed.');
    }

    const timestamp = Date.now();
    const path = `${STORAGE_PATHS.POST_VIDEOS}/${user.uid}/${timestamp}_${file.name}`;
    const storageRef = ref(this.storage, path);

    try {
      // Run the upload inside NgZone to ensure proper change detection
      const uploadTask = await this.ngZone.runOutsideAngular(() => {
        const task = uploadBytesResumable(storageRef, file);
        return new Promise<UploadTaskSnapshot>((resolve, reject) => {
          task.on(
            'state_changed',
            (snapshot) => {
              // Progress updates are handled in the component
            },
            (error) => {
              console.error('Upload error:', error);
              reject(error);
            },
            async () => {
              try {
                const snapshot = await task.snapshot;
                resolve(snapshot);
              } catch (error) {
                reject(error);
              }
            }
          );
        });
      });

      // Get the download URL
      const url = await getDownloadURL(uploadTask.ref);

      return { url, path };
    } catch (error: any) {
      console.error('Error uploading video:', error);
      if (error.code === 'storage/unauthorized') {
        throw new Error(
          'You do not have permission to upload videos. Please check your authentication status.'
        );
      }
      throw new Error('Failed to upload video to storage. Please try again.');
    }
  }
}
