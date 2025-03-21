import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import {
  QuickPostService,
  Post,
  ShareOption,
} from '../../../services/quick-post.service';
import { UserService, UserProfile } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { Observable, map, take, firstValueFrom } from 'rxjs';
import { EmailLinkSigninComponent } from '../../auth/email-link-signin.component';
import { MediaHandlerService } from './services/media-handler.service';
import { UiUtilsService } from './services/ui-utils.service';
import { CommentPanelComponent } from './comment-panel.component';
import {
  ExtendedPost,
  MediaItem,
  StoredMediaItem,
  ImageItem,
  VideoItem,
  StoredImageItem,
  StoredVideoItem,
} from './models/quick-post.models';

@Component({
  selector: 'app-quick-post',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    EmailLinkSigninComponent,
    CommentPanelComponent,
  ],
  templateUrl: './quick-post.component.html',
})
export class QuickPostComponent implements OnInit, AfterViewInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('videoInput') videoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('cropCanvas') cropCanvas!: ElementRef<HTMLCanvasElement>;

  showModal = false;
  showCropModal = false;
  postText = '';
  selectedTags: string[] = [];
  posts$: Observable<ExtendedPost[]>;
  selectedMedia: MediaItem | null = null;
  currentCropIndex: number = -1;
  currentImageIndex: Record<string, number> = {};
  selectedPostForShare: ExtendedPost | null = null;
  shareOptions: ShareOption[] = [];
  showLikeAnimation: Record<string, boolean> = {};
  linkCopied = false;
  likeDebounce: Record<string, NodeJS.Timeout> = {};
  selectedPostForComments: ExtendedPost | null = null;
  showAuthModal = false;

  commonTags: string[] = [
    'breakfast',
    'lunch',
    'dinner',
    'dessert',
    'vegan',
    'vegetarian',
    'glutenfree',
    'healthy',
    'quickmeals',
    'mealprep',
  ];

  currentUser$: Observable<UserProfile | null>;
  avatarUrl$: Observable<string>;

  constructor(
    private quickPostService: QuickPostService,
    private userService: UserService,
    private sanitizer: DomSanitizer,
    public authService: AuthService,
    private router: Router,
    private mediaHandler: MediaHandlerService,
    private uiUtils: UiUtilsService,
    private cdr: ChangeDetectorRef
  ) {
    // Add debug logging for authentication state
    this.authService.isAuthenticated$.subscribe((isAuth) => {
      console.log('Authentication state:', isAuth);
      console.log('Current user:', this.authService.getCurrentUser());
    });

    this.posts$ = this.quickPostService.getPosts().pipe(
      map((posts) => {
        console.log('Received posts:', posts); // Debug log for posts
        return posts.map((post) => {
          const transformedComments = (post.comments || []).map((comment) => {
            const transformedReplies = (comment.replies || []).map((reply) => ({
              ...reply,
              id: reply.id || '',
              text: reply.text || '',
              userId: reply.userId || '',
              username: reply.username || '',
              timestamp: reply.timestamp,
              likes: reply.likes || 0,
              likedBy: reply.likedBy || [],
              parentId: reply.parentId,
              replies: [],
            }));

            return {
              ...comment,
              id: comment.id || '',
              text: comment.text || '',
              userId: comment.userId || '',
              username: comment.username || '',
              timestamp: comment.timestamp,
              likes: comment.likes || 0,
              likedBy: comment.likedBy || [],
              parentId: comment.parentId,
              replies: transformedReplies,
            };
          });

          return {
            ...post,
            id: post.id || '',
            comments: transformedComments,
          } as ExtendedPost;
        });
      })
    );
    this.currentUser$ = this.userService.getCurrentUser();
    this.avatarUrl$ = this.userService.getAvatarUrl();
    this.shareOptions = this.quickPostService.getShareOptions();
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    // Initialize canvas when view is ready and modal is shown
    this.cdr.detectChanges();
  }

  private async checkAuth(): Promise<boolean> {
    try {
      const isAuthenticated = await firstValueFrom(
        this.authService.isAuthenticated$.pipe(take(1))
      );
      if (!isAuthenticated) {
        this.showAuthModal = true;
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error checking authentication:', error);
      this.showAuthModal = true;
      return false;
    }
  }

  async handleCreatePost(): Promise<void> {
    if (!(await this.checkAuth())) return;
    this.showModal = true;
  }

  async handleLikePost(postId: string): Promise<void> {
    if (!(await this.checkAuth())) return;
    this.likePost(postId);
  }

  async handleOpenComments(post: ExtendedPost): Promise<void> {
    if (!(await this.checkAuth())) return;
    this.selectedPostForComments = post;
  }

  async handleSharePost(post: ExtendedPost): Promise<void> {
    if (!(await this.checkAuth())) return;
    this.selectedPostForShare = post;
  }

  navigateToSignIn(): void {
    this.router.navigate(['/auth/signin']);
  }

  async onVideoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const validation = await this.mediaHandler.validateVideo(file);

    if (!validation.valid) {
      alert('Video must be less than 5 minutes long');
      return;
    }

    const preview = await this.mediaHandler.getDataUrlFromFile(file);
    this.selectedMedia = {
      type: 'video',
      content: {
        file,
        preview,
        duration: validation.duration || 0,
      },
    };
  }

  async onImagesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const files = Array.from(input.files);
    const imageItems: ImageItem[] = [];

    for (const file of files) {
      const preview = await this.mediaHandler.getDataUrlFromFile(file);
      imageItems.push({ file, preview });
    }

    this.selectedMedia = {
      type: 'image',
      content: imageItems,
    };

    if (imageItems.length > 0) {
      this.currentCropIndex = 0; // Initialize to first image
      this.openCropModal();
    }
  }

  removeMedia(): void {
    this.selectedMedia = null;
    this.currentCropIndex = -1;
  }

  openCropModal(): void {
    if (this.selectedMedia?.type === 'image') {
      const imageContent = this.selectedMedia.content as ImageItem[];
      if (!imageContent || imageContent.length === 0) {
        console.error('No images available to crop');
        return;
      }

      // Ensure currentCropIndex is valid
      if (
        this.currentCropIndex < 0 ||
        this.currentCropIndex >= imageContent.length
      ) {
        this.currentCropIndex = 0;
      }

      this.showCropModal = true;
      this.cdr.detectChanges();

      // Wait for the next frame to ensure the canvas is in the DOM
      requestAnimationFrame(() => {
        this.initCropCanvas();
      });
    }
  }

  private initCropCanvas(): void {
    console.log('Initializing canvas...'); // Debug log
    if (!this.cropCanvas?.nativeElement) {
      console.error('Crop canvas element not found');
      return;
    }

    const canvas = this.cropCanvas.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }

    console.log('Canvas element found, setting up image...'); // Debug log
    const img = new Image();

    img.onload = () => {
      console.log('Image loaded, dimensions:', img.width, 'x', img.height); // Debug log
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };

    img.onerror = (error) => {
      console.error('Error loading image:', error); // Debug log for image loading errors
    };

    if (this.selectedMedia?.type === 'image') {
      const imageContent = this.selectedMedia.content as ImageItem[];
      if (imageContent && imageContent[this.currentCropIndex]) {
        console.log('Setting image source...'); // Debug log
        img.src = imageContent[this.currentCropIndex].preview;
      } else {
        console.error(
          'No image content available at index:',
          this.currentCropIndex
        );
      }
    }
  }

  applyCrop(): void {
    if (
      !this.cropCanvas?.nativeElement ||
      this.selectedMedia?.type !== 'image'
    ) {
      return;
    }

    const canvas = this.cropCanvas.nativeElement;
    const croppedDataUrl = canvas.toDataURL('image/jpeg');

    // Update the preview of the current image
    const imageContent = this.selectedMedia.content as ImageItem[];
    if (imageContent && imageContent[this.currentCropIndex]) {
      imageContent[this.currentCropIndex].preview = croppedDataUrl;

      // Convert data URL to File
      fetch(croppedDataUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File(
            [blob],
            imageContent[this.currentCropIndex].file.name,
            {
              type: 'image/jpeg',
            }
          );
          imageContent[this.currentCropIndex].file = file;
        });
    }

    this.showCropModal = false;
  }

  get isValidPost(): boolean {
    return (
      this.postText.trim().length > 0 ||
      (this.selectedMedia !== null && this.selectedTags.length > 0)
    );
  }

  async submitPost(): Promise<void> {
    if (!this.isValidPost) return;

    try {
      // Ensure user is authenticated
      const user = await firstValueFrom(this.authService.isAuthenticated$);
      if (!user) {
        throw new Error('User must be authenticated to upload media');
      }

      let mediaData: Post['media'] | undefined;

      // Only process media if it exists
      if (this.selectedMedia) {
        if (this.selectedMedia.type === 'image') {
          const images = this.selectedMedia.content as ImageItem[];
          const processedImages = [];

          for (const image of images) {
            const compressed = await this.mediaHandler.compressImage(
              image.file
            );
            const compressedFile = new File([compressed], image.file.name, {
              type: 'image/jpeg',
            });

            // Upload image to Firebase Storage with metadata
            const imageUrl = await this.quickPostService.uploadMedia(
              compressedFile,
              'images'
            );

            processedImages.push({
              url: imageUrl,
              preview: image.preview,
            });
          }

          mediaData = {
            type: 'image' as const,
            content: processedImages,
          };
        } else if (this.selectedMedia.type === 'video') {
          const videoContent = this.selectedMedia.content as VideoItem;

          // Upload video to Firebase Storage and get URL
          const videoUrl = await this.quickPostService.uploadMedia(
            videoContent.file,
            'videos'
          );

          mediaData = {
            type: 'video' as const,
            content: {
              url: videoUrl,
              preview: videoContent.preview,
              duration: videoContent.duration,
            },
          };
        }
      }

      const postData: Partial<Post> = {
        text: this.postText.trim(),
        tags: this.selectedTags,
        timestamp: new Date().toISOString(),
        likes: 0,
        likedBy: [],
        comments: [],
        shares: 0,
        ...(mediaData && { media: mediaData }),
      };

      await this.quickPostService.addPost(postData);
      this.resetForm();
      this.showModal = false;
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    }
  }

  resetForm(): void {
    this.postText = '';
    this.selectedTags = [];
    this.selectedMedia = null;
    this.showModal = false;
    this.showCropModal = false;
  }

  async deletePost(postId: string): Promise<void> {
    try {
      await this.quickPostService.deletePost(postId);
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    }
  }

  async likePost(postId: string): Promise<void> {
    if (this.likeDebounce[postId]) {
      clearTimeout(this.likeDebounce[postId]);
    }

    this.showLikeAnimation[postId] = true;
    this.likeDebounce[postId] = setTimeout(() => {
      delete this.showLikeAnimation[postId];
    }, 1000);

    try {
      await this.quickPostService.likePost(postId);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  }

  formatDate(timestamp: string): string {
    return this.uiUtils.formatDate(timestamp);
  }

  toggleTag(tag: string): void {
    const index = this.selectedTags.indexOf(tag);
    if (index === -1) {
      this.selectedTags.push(tag);
    } else {
      this.selectedTags.splice(index, 1);
    }
  }

  previousImage(post: ExtendedPost): void {
    if (!post.id) return;
    const currentIndex = this.currentImageIndex[post.id] || 0;
    if (currentIndex > 0) {
      this.setCurrentImage(post.id, currentIndex - 1);
    }
  }

  nextImage(post: ExtendedPost): void {
    if (!post.id) return;
    const currentIndex = this.currentImageIndex[post.id] || 0;
    const maxIndex =
      post.media?.content && Array.isArray(post.media.content)
        ? post.media.content.length - 1
        : 0;
    if (currentIndex < maxIndex) {
      this.setCurrentImage(post.id, currentIndex + 1);
    }
  }

  setCurrentImage(postId: string, index: number): void {
    if (!postId) return;
    this.currentImageIndex[postId] = index;
  }

  getImagePreview(): string {
    if (this.selectedMedia?.type === 'image') {
      const images = this.selectedMedia.content as ImageItem[];
      if (
        images &&
        this.currentCropIndex >= 0 &&
        this.currentCropIndex < images.length
      ) {
        return images[this.currentCropIndex].preview;
      }
    }
    return '';
  }

  getVideoThumbnail(): string {
    if (this.selectedMedia?.type === 'video') {
      const video = this.selectedMedia.content as VideoItem;
      return video?.preview || '';
    }
    return '';
  }

  getVideoDuration(): string {
    if (this.selectedMedia?.type === 'video') {
      const video = this.selectedMedia.content as VideoItem;
      if (video) {
        return this.mediaHandler.getVideoDuration(video);
      }
    }
    return '';
  }

  sanitizeVideoUrl(url: string): SafeUrl {
    return this.mediaHandler.sanitizeVideoUrl(url);
  }

  openShareModal(post: ExtendedPost): void {
    if (!post.id || !post.shareUrl) return;
    this.selectedPostForShare = post;
  }

  closeShareModal(): void {
    this.selectedPostForShare = null;
  }

  async handleShare(option: ShareOption, post: ExtendedPost): Promise<void> {
    if (!post?.id || !post.shareUrl) return;
    const shareUrl = post.shareUrl;

    try {
      const encodedUrl = encodeURIComponent(shareUrl);

      switch (option.id) {
        case 'copy':
          await this.uiUtils.copyShareLink(shareUrl);
          this.linkCopied = true;
          setTimeout(() => {
            this.linkCopied = false;
          }, 2000);
          break;
        case 'facebook':
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
          );
          break;
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}`);
          break;
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodedUrl}`);
          break;
      }
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  }

  openComments(post: ExtendedPost): void {
    if (!post?.id) return;
    this.selectedPostForComments = {
      ...post,
      id: post.id,
      comments: post.comments || [],
      username: post.username || '',
    };
  }

  closeComments(): void {
    this.selectedPostForComments = null;
  }

  hasUserLikedPost(postId: string): boolean {
    return this.quickPostService.hasUserLikedPost(postId);
  }

  isImageArray(
    content:
      | ImageItem[]
      | VideoItem
      | StoredImageItem[]
      | StoredVideoItem
      | undefined
  ): content is ImageItem[] | StoredImageItem[] {
    return Array.isArray(content);
  }

  getVideoContent(
    content:
      | ImageItem[]
      | VideoItem
      | StoredImageItem[]
      | StoredVideoItem
      | undefined
  ): VideoItem | StoredVideoItem | null {
    if (!content || Array.isArray(content)) return null;
    return content;
  }
}
