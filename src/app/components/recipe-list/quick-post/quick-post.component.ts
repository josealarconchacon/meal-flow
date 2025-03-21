import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import {
  Subject,
  takeUntil,
  BehaviorSubject,
  firstValueFrom,
  Observable,
  map,
} from 'rxjs';
import {
  Post,
  Comment,
  Reply,
  QuickPostService,
} from '../../../services/quick-post.service';
import { PostValidators } from '../../../models/post.model';
import { UserService } from '../../../services/user.service';
import { UserProfile } from '../../../models/user.model';
import { AuthService } from '../../../services/auth.service';
import { CommentPanelComponent } from './comment-panel.component';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner.component';
import { ErrorMessageComponent } from '../../shared/error-message.component';
import { EmailLinkSigninComponent } from '../../auth/email-link-signin.component';

interface PostWithMedia extends Omit<Post, 'comments'> {
  id: string;
  comments: Comment[];
  media?: {
    type: 'image' | 'video';
    content: any;
  };
}

@Component({
  selector: 'app-quick-post',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    CommentPanelComponent,
    LoadingSpinnerComponent,
    EmailLinkSigninComponent,
  ],
  templateUrl: './quick-post.component.html',
})
export class QuickPostComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('videoInput') videoInput!: ElementRef;
  @ViewChild('cropCanvas') cropCanvas!: ElementRef;

  private destroy$ = new Subject<void>();
  private loading$ = new BehaviorSubject<boolean>(false);
  private error$ = new BehaviorSubject<string | null>(null);

  postForm!: FormGroup;
  posts: PostWithMedia[] = [];
  currentUser: UserProfile | null = null;
  selectedPostId: string | null = null;
  avatarUrl$: Observable<string>;
  currentUser$: Observable<UserProfile | null>;
  posts$: Observable<PostWithMedia[]>;
  showModal = false;
  showAuthModal = false;
  showCropModal = false;
  selectedPostForComments: PostWithMedia | null = null;
  selectedPostForShare: PostWithMedia | null = null;
  selectedMedia: { type: 'image' | 'video'; content: any } | null = null;
  currentImageIndex: { [key: string]: number } = {};
  commonTags = [
    'breakfast',
    'lunch',
    'dinner',
    'dessert',
    'vegan',
    'healthy',
    'quick',
  ];
  selectedTags: string[] = [];
  isAuthenticated$: Observable<boolean>;

  readonly MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
  readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  PostValidators = PostValidators;
  shareOptions = [
    { label: 'Copy Link', icon: 'fas fa-link' },
    { label: 'Share on Facebook', icon: 'fab fa-facebook' },
    { label: 'Share on Twitter', icon: 'fab fa-twitter' },
    { label: 'Share on WhatsApp', icon: 'fab fa-whatsapp' },
  ];

  constructor(
    private fb: FormBuilder,
    private quickPostService: QuickPostService,
    private userService: UserService,
    public authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {
    this.initForm();
    this.setupSubscriptions();
    this.avatarUrl$ = this.userService.getAvatarUrl();
    this.currentUser$ = this.userService.getCurrentUser();
    this.posts$ = this.quickPostService
      .getPosts()
      .pipe(map((posts) => posts as PostWithMedia[]));
    this.isAuthenticated$ = this.authService.isAuthenticated$;
  }

  private initForm(): void {
    this.postForm = this.fb.group({
      text: [
        '',
        [
          Validators.required,
          Validators.maxLength(PostValidators.MAX_TEXT_LENGTH),
        ],
      ],
      tags: [[]],
      imageUrl: [
        '',
        [Validators.pattern('^https?://.*\\.(png|jpg|jpeg|gif|webp)$')],
      ],
    });
  }

  private setupSubscriptions(): void {
    // Subscribe to user changes
    this.userService
      .getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser = user;
      });

    // Subscribe to posts
    this.quickPostService
      .getPosts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (posts) => {
          this.posts = posts;
          this.loading$.next(false);
        },
        error: (error) => {
          console.error('Error fetching posts:', error);
          this.error$.next('Failed to load posts. Please try again.');
          this.loading$.next(false);
        },
      });
  }

  async onSubmit(): Promise<void> {
    if (this.postForm.invalid) return;

    try {
      this.loading$.next(true);
      this.error$.next(null);

      if (!this.currentUser) {
        throw new Error('User must be authenticated to create a post');
      }

      const postData: Post = {
        ...this.postForm.value,
        userId: this.currentUser.id,
        username: this.currentUser.username,
        timestamp: new Date(),
        likes: 0,
        likedBy: [],
        comments: [],
        shares: 0,
      };

      if (!PostValidators.validatePost(postData)) {
        throw new Error('Invalid post data');
      }

      await this.quickPostService.createPost(postData);
      this.postForm.reset();
      this.loading$.next(false);
    } catch (error) {
      console.error('Error creating post:', error);
      this.error$.next('Failed to create post. Please try again.');
      this.loading$.next(false);
    }
  }

  async onLikePost(postId: string): Promise<void> {
    if (!this.currentUser) {
      this.router.navigate(['/auth/signin']);
      return;
    }

    try {
      this.loading$.next(true);
      await this.quickPostService.likePost(postId, this.currentUser.id);
      this.loading$.next(false);
    } catch (error) {
      console.error('Error liking post:', error);
      this.error$.next('Failed to like post. Please try again.');
      this.loading$.next(false);
    }
  }

  async onAddComment(postId: string, text: string): Promise<void> {
    if (!this.currentUser) {
      this.router.navigate(['/auth/signin']);
      return;
    }

    try {
      this.loading$.next(true);

      const comment: Comment = {
        id: crypto.randomUUID(),
        text,
        userId: this.currentUser.id,
        username: this.currentUser.username,
        timestamp: new Date(),
        likes: 0,
        likedBy: [],
        replies: [],
      };

      if (!PostValidators.validateComment(comment)) {
        throw new Error('Invalid comment data');
      }

      await this.quickPostService.addComment(postId, comment);
      this.loading$.next(false);
    } catch (error) {
      console.error('Error adding comment:', error);
      this.error$.next('Failed to add comment. Please try again.');
      this.loading$.next(false);
    }
  }

  async onAddReply(
    postId: string,
    commentId: string,
    text: string
  ): Promise<void> {
    if (!this.currentUser) {
      this.router.navigate(['/auth/signin']);
      return;
    }

    try {
      this.loading$.next(true);

      const reply: Reply = {
        id: crypto.randomUUID(),
        text,
        userId: this.currentUser.id,
        username: this.currentUser.username,
        timestamp: new Date(),
        likes: 0,
        likedBy: [],
        replies: [],
        parentCommentId: commentId,
      };

      if (!PostValidators.validateReply(reply)) {
        throw new Error('Invalid reply data');
      }

      await this.quickPostService.addReply(postId, commentId, reply);
      this.loading$.next(false);
    } catch (error) {
      console.error('Error adding reply:', error);
      this.error$.next('Failed to add reply. Please try again.');
      this.loading$.next(false);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];

    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.error$.next('Invalid file type. Please upload a valid image.');
      return;
    }

    if (file.size > this.MAX_IMAGE_SIZE) {
      this.error$.next('File too large. Maximum size is 5MB.');
      return;
    }

    // Handle file upload logic here
  }

  get isLoading(): boolean {
    return this.loading$.value;
  }

  get error(): string | null {
    return this.error$.value;
  }

  ngOnInit(): void {
    // Additional initialization if needed
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleCreatePost(): void {
    if (!this.currentUser) {
      this.showAuthModal = true;
      return;
    }
    this.showModal = true;
  }

  handleLikePost(postId: string | undefined): void {
    if (!postId) return;
    if (!this.currentUser) {
      this.showAuthModal = true;
      return;
    }
    this.onLikePost(postId);
  }

  handleOpenComments(post: PostWithMedia): void {
    this.selectedPostForComments = post;
  }

  handleSharePost(post: PostWithMedia): void {
    this.selectedPostForShare = post;
  }

  closeComments(): void {
    this.selectedPostForComments = null;
  }

  closeShareModal(): void {
    this.selectedPostForShare = null;
  }

  resetForm(): void {
    this.postForm.reset();
    this.selectedMedia = null;
    this.showModal = false;
  }

  formatDate(timestamp: Date | string): string {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return date.toLocaleDateString();
    } else if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  }

  hasUserLikedPost(postId: string | undefined): boolean {
    if (!postId || !this.currentUser) return false;
    return this.quickPostService.hasUserLikedPost(postId);
  }

  getVideoContent(content: any): { preview: string } | null {
    if (!content || typeof content !== 'object' || !('preview' in content)) {
      return null;
    }
    return content as { preview: string };
  }

  sanitizeVideoUrl(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  isImageArray(content: any): content is Array<{ preview: string }> {
    return (
      Array.isArray(content) &&
      content.every(
        (item) =>
          typeof item === 'object' &&
          'preview' in item &&
          typeof item.preview === 'string'
      )
    );
  }

  previousImage(post: PostWithMedia): void {
    if (!post.id) return;
    const currentIndex = this.currentImageIndex[post.id] || 0;
    if (currentIndex > 0) {
      this.currentImageIndex[post.id] = currentIndex - 1;
    }
  }

  nextImage(post: PostWithMedia): void {
    if (
      !post.id ||
      !post.media?.content ||
      !this.isImageArray(post.media.content)
    )
      return;
    const currentIndex = this.currentImageIndex[post.id] || 0;
    if (currentIndex < post.media.content.length - 1) {
      this.currentImageIndex[post.id] = currentIndex + 1;
    }
  }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    // Handle image selection logic
  }

  onVideoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    // Handle video selection logic
  }

  getUserAvatar(userId: string): Observable<string> {
    return this.userService.getAvatarUrlForUser(userId);
  }

  getUserProfile(userId: string): Observable<UserProfile | null> {
    return this.userService.getUserProfile(userId);
  }

  toggleTag(tag: string): void {
    const currentTags = this.postForm.get('tags')?.value || [];
    const tagIndex = currentTags.indexOf(tag);

    if (tagIndex === -1) {
      this.postForm.patchValue({
        tags: [...currentTags, tag],
      });
    } else {
      currentTags.splice(tagIndex, 1);
      this.postForm.patchValue({
        tags: currentTags,
      });
    }
  }

  getImagePreview(): string {
    // Implementation
    return '';
  }

  getVideoThumbnail(): string {
    // Implementation
    return '';
  }

  getVideoDuration(): string {
    // Implementation
    return '0:00';
  }

  removeMedia(): void {
    // Implementation
  }

  handleShare(option: any, post: any): void {
    // Implementation
  }

  applyCrop(): void {
    // Implementation
  }
}
