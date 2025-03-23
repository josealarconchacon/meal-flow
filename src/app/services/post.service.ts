import {
  Injectable,
  inject,
  NgZone,
  DestroyRef,
  runInInjectionContext,
  Injector,
} from '@angular/core';
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
  increment,
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
  CreateCommentDTO,
  FIREBASE_COLLECTIONS,
  STORAGE_PATHS,
} from '../components/home/quick-post/models/post.model';
import {
  from,
  Observable,
  map,
  switchMap,
  firstValueFrom,
  takeUntil,
  fromEvent,
} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private readonly storage = inject(Storage);
  private readonly firestore = inject(Firestore);
  private readonly authService = inject(AuthService);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly destroy$ = new Observable<void>((subscriber) => {
    this.destroyRef.onDestroy(() => {
      subscriber.next();
      subscriber.complete();
    });
  });

  constructor() {}

  // Get posts as an Observable
  getPosts(limitCount: number = 10): Observable<Post[]> {
    return new Observable((subscriber) => {
      runInInjectionContext(this.injector, () => {
        const postsRef = collection(this.firestore, FIREBASE_COLLECTIONS.POSTS);

        // Simplified query that only requires a basic index
        const q = query(
          postsRef,
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          firestoreLimit(limitCount)
        );

        // Add error handling and retry logic with caching
        const subscription = collectionData(q, { idField: 'id' })
          .pipe(
            takeUntil(this.destroy$),
            map((posts) => {
              if (!posts) {
                return [];
              }
              return posts as Post[];
            })
          )
          .subscribe({
            next: (posts) => {
              subscriber.next(posts);
            },
            error: (error) => {
              // Handle index creation gracefully
              if (
                error.code === 'failed-precondition' &&
                error.message.includes('index')
              ) {
                console.warn(
                  'Waiting for index to be created. This may take a few minutes.'
                );
                // Fall back to a simpler query while index is being built
                const simpleQuery = query(
                  postsRef,
                  where('status', '==', 'active'),
                  firestoreLimit(limitCount)
                );

                collectionData(simpleQuery, { idField: 'id' })
                  .pipe(
                    takeUntil(this.destroy$),
                    map((posts) => posts as Post[])
                  )
                  .subscribe({
                    next: (posts) => subscriber.next(posts),
                    error: (fallbackError) => {
                      console.error(
                        'Error with fallback query:',
                        fallbackError
                      );
                      subscriber.error(
                        new Error(
                          'Unable to load posts. Please try again later.'
                        )
                      );
                    },
                  });
              } else {
                console.error('Error fetching posts:', error);
                subscriber.error(error);
              }
            },
            complete: () => subscriber.complete(),
          });

        return () => {
          subscription.unsubscribe();
        };
      });
    });
  }

  // Get posts with pagination - optimized version
  getPostsWithPagination(lastPost?: Post): Observable<Post[]> {
    return new Observable((subscriber) => {
      runInInjectionContext(this.injector, () => {
        const postsRef = collection(this.firestore, FIREBASE_COLLECTIONS.POSTS);

        // Simplified query constraints
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

        const subscription = collectionData(q, { idField: 'id' })
          .pipe(
            takeUntil(this.destroy$),
            map((posts) => {
              if (!posts) {
                return [];
              }
              return posts as Post[];
            })
          )
          .subscribe({
            next: (posts) => subscriber.next(posts),
            error: (error) => {
              // Check if we need to create an index
              if (
                error.code === 'failed-precondition' &&
                error.message.includes('index')
              ) {
                console.error(
                  'Please create the required index:',
                  error.message
                );
                subscriber.error(
                  new Error(
                    'Database index setup required. Please contact the administrator.'
                  )
                );
              } else {
                console.error('Error fetching posts:', error);
                subscriber.error(error);
              }
            },
            complete: () => subscriber.complete(),
          });

        return () => {
          subscription.unsubscribe();
        };
      });
    });
  }

  // Create a new post
  async createPost(postData: CreatePostDTO): Promise<string> {
    return this.ngZone.run(async () => {
      const user = await firstValueFrom(this.authService.user$);
      if (!user) {
        throw new Error('User must be authenticated to create a post');
      }

      try {
        const postRef = collection(this.firestore, FIREBASE_COLLECTIONS.POSTS);

        // Clean up the post data to ensure no undefined values
        const cleanPostData: Omit<Post, 'id'> = {
          ...postData,
          createdAt: {
            seconds: Math.floor(Date.now() / 1000),
            nanoseconds: (Date.now() % 1000) * 1000000,
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

        const docRef = await addDoc(postRef, {
          ...cleanPostData,
          createdAt: serverTimestamp(), // Use serverTimestamp when saving to Firestore
        });
        return docRef.id;
      } catch (error) {
        console.error('Error creating post:', error);
        throw error;
      }
    });
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
    return this.ngZone.run(async () => {
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
    });
  }

  // Upload image with progress tracking
  async uploadImage(file: File): Promise<{ url: string; path: string }> {
    return this.ngZone.run(async () => {
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
        const uploadTask = await uploadBytesResumable(storageRef, file);
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
    });
  }

  // Upload video with progress tracking
  async uploadVideo(
    file: File
  ): Promise<{ url: string; path: string; thumbnail?: string }> {
    return this.ngZone.run(async () => {
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
        const uploadTask = await uploadBytesResumable(storageRef, file);
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
    });
  }

  // Add comment to a post
  async addComment(
    postId: string,
    commentData: CreateCommentDTO
  ): Promise<string> {
    return this.ngZone.run(async () => {
      try {
        const postRef = doc(this.firestore, FIREBASE_COLLECTIONS.POSTS, postId);
        const commentsRef = collection(postRef, 'comments');

        const commentDoc = await addDoc(commentsRef, {
          ...commentData,
          createdAt: serverTimestamp(),
        });

        // Update the comments count
        await updateDoc(postRef, {
          'stats.comments': increment(1),
        });

        return commentDoc.id;
      } catch (error) {
        console.error('Error adding comment:', error);
        throw error;
      }
    });
  }

  // Get comments for a post
  async getComments(
    postId: string,
    limit: number = 10
  ): Promise<Post['comments']> {
    return this.ngZone.run(async () => {
      try {
        const commentsRef = collection(
          this.firestore,
          FIREBASE_COLLECTIONS.POSTS,
          postId,
          'comments'
        );

        const q = query(
          commentsRef,
          orderBy('createdAt', 'desc'),
          firestoreLimit(limit)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data()['createdAt'],
        })) as Post['comments'];
      } catch (error) {
        console.error('Error getting comments:', error);
        throw error;
      }
    });
  }

  // Delete a comment
  async deleteComment(postId: string, commentId: string): Promise<void> {
    return this.ngZone.run(async () => {
      try {
        const postRef = doc(this.firestore, FIREBASE_COLLECTIONS.POSTS, postId);
        const commentRef = doc(postRef, 'comments', commentId);

        await deleteDoc(commentRef);

        // Update the comments count
        await updateDoc(postRef, {
          'stats.comments': increment(-1),
        });
      } catch (error) {
        console.error('Error deleting comment:', error);
        throw error;
      }
    });
  }
}
