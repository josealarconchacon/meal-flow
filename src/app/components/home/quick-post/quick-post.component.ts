import {
  Component,
  OnInit,
  OnDestroy,
  DestroyRef,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { AuthModalComponent } from '../../auth-modal/auth-modal.component';
import { AuthService } from '../../../services/auth.service';
import { PostService } from '../../../services/post.service';
import {
  firstValueFrom,
  Subscription,
  BehaviorSubject,
  takeUntil,
  Subject,
} from 'rxjs';
import { PostListComponent } from './post-list/post-list.component';
import { Post, CreatePostDTO } from './models/post.model';
import { MediaUploadState } from './models/media-upload-state.interface';
import { FILE_UPLOAD_CONSTANTS } from '../../../constants/file-sizes';
import { ObjectURLPipe } from '../../../pipes/object-url.pipe';

@Component({
  selector: 'app-quick-post',
  templateUrl: './quick-post.component.html',
  styleUrls: ['./quick-post.component.css'],
  standalone: true,
  host: { ngSkipHydration: 'true' },
  imports: [CommonModule, FormsModule, PostListComponent, ObjectURLPipe],
})
export class QuickPostComponent implements OnInit, OnDestroy {
  posts: Post[] = [];
  postContent = '';
  newPostContent = '';
  selectedImages: File[] = [];
  selectedVideo: File | null = null;
  showModal = false;
  uploadState: MediaUploadState = {
    isUploading: false,
    error: null,
    progress: 0,
  };

  // User data
  currentUser: any = null;
  error: string | null = null;
  isLoading = false;

  // File upload constraints
  readonly maxImageSize = FILE_UPLOAD_CONSTANTS.MAX_IMAGE_SIZE;
  readonly maxVideoSize = FILE_UPLOAD_CONSTANTS.MAX_VIDEO_SIZE;
  readonly allowedImageTypes = FILE_UPLOAD_CONSTANTS.ALLOWED_IMAGE_TYPES;
  readonly allowedVideoTypes = FILE_UPLOAD_CONSTANTS.ALLOWED_VIDEO_TYPES;

  // State management with improved performance
  private readonly destroy$ = new Subject<void>();
  private readonly postsSubject = new BehaviorSubject<Post[]>([]);
  posts$ = this.postsSubject.asObservable();
  user$;

  constructor(
    private dialog: MatDialog,
    private authService: AuthService,
    private postService: PostService,
    private destroyRef: DestroyRef
  ) {
    this.user$ = this.authService.user$;
    this.destroyRef.onDestroy(() => {
      this.destroy$.next();
      this.destroy$.complete();
      this.postsSubject.complete();
    });
  }

  ngOnInit(): void {
    // Subscribe to user changes with optimized subscription
    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      if (this.currentUser?.uid !== user?.uid) {
        this.currentUser = user;
      }
    });

    // Load initial posts
    this.loadPosts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.postsSubject.complete();
  }

  async loadPosts(): Promise<void> {
    if (this.isLoading) return;

    try {
      this.isLoading = true;
      this.error = null;

      // Optimized post loading with error handling
      this.postService
        .getPosts()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (posts) => {
            if (JSON.stringify(this.posts) !== JSON.stringify(posts)) {
              this.posts = posts;
              this.postsSubject.next(posts);
            }
            this.isLoading = false;
          },
          error: (error: any) => {
            console.error('Error loading posts:', error);
            this.handleLoadError(error);
            this.isLoading = false;
          },
        });
    } catch (error: any) {
      console.error('Error in loadPosts:', error);
      this.error = 'An unexpected error occurred. Please try again later.';
      this.isLoading = false;
    }
  }

  private handleLoadError(error: any): void {
    if (
      error.code === 'failed-precondition' &&
      error.message.includes('requires an index')
    ) {
      this.error =
        'Setting up the database. Please wait a moment and refresh the page.';
    } else if (error.code === 'permission-denied') {
      this.error = 'You do not have permission to view these posts.';
    } else {
      this.error = 'Failed to load posts. Please try again later.';
    }
  }

  handleUploadKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      const element = event.target as HTMLElement;
      const input = element.querySelector('input');
      input?.click();
    }
  }

  async openPostModal(): Promise<void> {
    const user = await firstValueFrom(this.user$);
    if (!user) {
      this.openAuthModal();
      return;
    }

    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }

  closePostModal(event?: Event): void {
    if (event) {
      const target = event.target as HTMLElement;
      if (
        target.classList.contains('modal-overlay') ||
        target.closest('.btn-close')
      ) {
        this.resetModal();
      }
    } else {
      this.resetModal();
    }
  }

  private resetModal(): void {
    this.showModal = false;
    this.postContent = '';
    this.selectedImages = [];
    this.selectedVideo = null;
    this.uploadState = {
      isUploading: false,
      error: null,
      progress: 0,
    };
    document.body.style.overflow = '';
  }

  async checkAuth(): Promise<boolean> {
    const isAuthenticated = await firstValueFrom(
      this.authService.isAuthenticated()
    );
    if (!isAuthenticated) {
      const dialogRef = this.dialog.open(AuthModalComponent);
      const result = await dialogRef.afterClosed().toPromise();
      return !!result;
    }
    return true;
  }

  private validateFile(
    file: File,
    maxSize: number,
    allowedTypes: string[]
  ): string | null {
    if (!allowedTypes.includes(file.type)) {
      const typeLabel = file.type.startsWith('image/') ? 'image' : 'video';
      const allowedExtensions = allowedTypes
        .map((type) => type.split('/')[1])
        .join(', ');
      return `Invalid ${typeLabel} format. Allowed formats: ${allowedExtensions}`;
    }

    const sizeMB = Math.round(file.size / (1024 * 1024));
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    if (file.size > maxSize) {
      return `File size (${sizeMB}MB) exceeds the ${maxSizeMB}MB limit`;
    }
    return null;
  }

  onImagesSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;

    this.uploadState = {
      isUploading: true,
      error: null,
      progress: 0,
    };

    const fileArray = Array.from(files);
    const errors: string[] = [];

    fileArray.forEach((file) => {
      if (file.type.startsWith('video/')) {
        if (this.selectedVideo) {
          errors.push('Only one video can be uploaded at a time');
          return;
        }
        const error = this.validateFile(
          file,
          this.maxVideoSize,
          this.allowedVideoTypes
        );
        if (error) {
          errors.push(error);
          return;
        }
        this.selectedVideo = file;
      } else if (file.type.startsWith('image/')) {
        if (this.selectedImages.length >= 3) {
          errors.push('Maximum of 3 images allowed');
          return;
        }
        const error = this.validateFile(
          file,
          this.maxImageSize,
          this.allowedImageTypes
        );
        if (error) {
          errors.push(error);
          return;
        }
        this.selectedImages.push(file);
      }
    });

    if (errors.length > 0) {
      this.uploadState.error = errors.join('\n');
    }

    this.uploadState.isUploading = false;
    this.uploadState.progress = 100;
    (event.target as HTMLInputElement).value = '';
  }

  removeImage(index: number): void {
    this.selectedImages.splice(index, 1);
  }

  removeVideo(): void {
    this.selectedVideo = null;
  }

  async createPost() {
    if (!this.currentUser) {
      this.openAuthModal();
      return;
    }

    const content = this.showModal ? this.postContent : this.newPostContent;
    if (
      !content.trim() &&
      this.selectedImages.length === 0 &&
      !this.selectedVideo
    ) {
      this.uploadState.error =
        'Please add some content, images, or a video to your post';
      return;
    }

    try {
      this.uploadState = {
        isUploading: true,
        error: null,
        progress: 0,
      };

      // Create initial post data with only required fields
      const postData: CreatePostDTO = {
        content: content.trim(),
        author: {
          uid: this.currentUser.uid,
          displayName: this.currentUser.displayName || 'Anonymous',
          photoURL:
            this.currentUser.photoURL ||
            'https://static-00.iconduck.com/assets.00/avatar-default-icon-2048x2048-h6w375ur.png',
        },
      };

      // Only add media field if there are images or video
      if (this.selectedImages.length > 0 || this.selectedVideo) {
        postData.media = {};

        // Handle images if present
        if (this.selectedImages.length > 0) {
          const totalImages = this.selectedImages.length;
          const uploadedImages = [];

          for (let i = 0; i < totalImages; i++) {
            const image = this.selectedImages[i];
            try {
              const uploadResult = await this.postService.uploadImage(image);
              uploadedImages.push({
                url: uploadResult.url,
                path: uploadResult.path,
                type: image.type,
              });
              this.uploadState.progress =
                ((i + 1) / (totalImages + (this.selectedVideo ? 1 : 0))) * 100;
            } catch (error) {
              console.error('Error uploading image:', error);
              throw new Error('Failed to upload image');
            }
          }

          if (uploadedImages.length > 0) {
            postData.media.images = uploadedImages;
          }
        }

        // Handle video if present
        if (this.selectedVideo) {
          try {
            const uploadResult = await this.postService.uploadVideo(
              this.selectedVideo
            );
            postData.media.video = {
              url: uploadResult.url,
              path: uploadResult.path,
              type: this.selectedVideo.type,
              ...(uploadResult.thumbnail && {
                thumbnail: uploadResult.thumbnail,
              }),
            };
          } catch (error) {
            console.error('Error uploading video:', error);
            throw new Error('Failed to upload video');
          }
          this.uploadState.progress = 100;
        }
      }

      // Create the post
      await this.postService.createPost(postData);

      // Reset the form
      this.resetModal();
      this.showModal = false;
      this.newPostContent = '';
    } catch (error) {
      console.error('Error creating post:', error);
      this.uploadState.error =
        error instanceof Error
          ? error.message
          : 'Failed to create post. Please try again.';
    } finally {
      this.uploadState.isUploading = false;
    }
  }

  openAuthModal(): void {
    this.dialog.open(AuthModalComponent, {
      width: '400px',
      disableClose: true,
    });
  }
}
