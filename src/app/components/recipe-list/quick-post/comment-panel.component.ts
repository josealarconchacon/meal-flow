import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Post,
  Comment,
  QuickPostService,
} from '../../../services/quick-post.service';
import { UserService, UserProfile } from '../../../services/user.service';
import { FirebaseService } from '../../../services/firebase.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subject, takeUntil, Observable, firstValueFrom } from 'rxjs';

interface ExtendedUserProfile extends UserProfile {
  uid: string;
}

interface ExtendedPost extends Post {
  id: string;
  comments: ExtendedComment[];
  username: string;
}

interface ExtendedComment extends Comment {
  id: string;
  replies?: ExtendedComment[];
  username: string;
  likedBy: string[];
}

@Component({
  selector: 'app-comment-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comment-panel.component.html',
  styles: [
    `
      :host {
        display: block;
      }

      /* Custom scrollbar for Webkit browsers */
      ::-webkit-scrollbar {
        width: 8px;
      }

      ::-webkit-scrollbar-track {
        background: transparent;
      }

      ::-webkit-scrollbar-thumb {
        background-color: rgba(156, 163, 175, 0.5);
        border-radius: 20px;
        border: 2px solid transparent;
        background-clip: content-box;
      }

      ::-webkit-scrollbar-thumb:hover {
        background-color: rgba(156, 163, 175, 0.8);
      }

      /* Hide scrollbar for Firefox */
      * {
        scrollbar-width: thin;
        scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
      }
    `,
  ],
  animations: [
    trigger('overlayAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('150ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('150ms ease-in', style({ opacity: 0 }))]),
    ]),
    trigger('panelAnimation', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('300ms ease-out', style({ transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(100%)' })),
      ]),
    ]),
    trigger('commentAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate(
          '200ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('150ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('150ms ease-in', style({ opacity: 0 }))]),
    ]),
  ],
})
export class CommentPanelComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Input() post!: ExtendedPost;
  @Output() close = new EventEmitter<void>();

  currentUser$!: Observable<ExtendedUserProfile | null>;
  currentUser: ExtendedUserProfile | null = null;
  avatarUrl$!: Observable<string>;
  private destroy$ = new Subject<void>();
  newComment = '';
  replyText = '';
  replyingToId: string | null = null;
  isSubmitting = false;

  constructor(
    private quickPostService: QuickPostService,
    private userService: UserService,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit(): void {
    this.currentUser$ =
      this.userService.getCurrentUser() as Observable<ExtendedUserProfile | null>;
    this.avatarUrl$ = this.userService.getAvatarUrl();

    this.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.currentUser = user;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  closePanel(): void {
    this.close.emit();
  }

  formatDate(timestamp: string): string {
    const date = new Date(timestamp);
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

  getTotalCommentsCount(): number {
    return this.post.comments.reduce((total, comment) => {
      return total + 1 + (comment.replies?.length || 0);
    }, 0);
  }

  private isValidId(id: string | undefined): id is string {
    return typeof id === 'string' && id.length > 0;
  }

  private findComment(commentId: string): ExtendedComment | undefined {
    return this.post.comments.find((comment) => comment.id === commentId);
  }

  private findReply(
    commentId: string,
    replyId: string
  ): ExtendedComment | undefined {
    const comment = this.findComment(commentId);
    return comment?.replies?.find((reply) => reply.id === replyId);
  }

  hasUserLikedComment(commentId: string): boolean {
    if (!this.currentUser) return false;
    const comment = this.findComment(commentId);
    return comment ? comment.likedBy.includes(this.currentUser.uid) : false;
  }

  hasUserLikedReply(commentId: string, replyId: string): boolean {
    if (!this.currentUser) return false;
    const reply = this.findReply(commentId, replyId);
    return reply ? reply.likedBy.includes(this.currentUser.uid) : false;
  }

  canDeleteComment(comment: ExtendedComment): boolean {
    return this.currentUser?.uid === comment.userId;
  }

  canDeleteReply(reply: ExtendedComment): boolean {
    return this.currentUser?.uid === reply.userId;
  }

  toggleReplyInput(commentId: string): void {
    if (this.replyingToId === commentId) {
      this.cancelReply();
    } else {
      this.replyingToId = commentId;
      this.replyText = '';
    }
  }

  cancelReply(): void {
    this.replyingToId = null;
    this.replyText = '';
  }

  async submitComment(): Promise<void> {
    if (!this.newComment.trim() || this.isSubmitting) return;
    this.isSubmitting = true;

    try {
      await this.quickPostService.addComment(
        this.post.id,
        this.newComment.trim()
      );
      this.newComment = '';
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      this.isSubmitting = false;
    }
  }

  async submitReply(commentId: string): Promise<void> {
    if (!this.replyText.trim() || this.isSubmitting) return;
    this.isSubmitting = true;

    try {
      await this.quickPostService.addReply(
        this.post.id,
        commentId,
        this.replyText.trim()
      );
      this.cancelReply();
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      this.isSubmitting = false;
    }
  }

  async likeComment(commentId: string): Promise<void> {
    try {
      await this.quickPostService.likeComment(this.post.id, commentId);
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  }

  async likeReply(commentId: string, replyId: string): Promise<void> {
    try {
      await this.quickPostService.likeReply(this.post.id, commentId, replyId);
    } catch (error) {
      console.error('Error liking reply:', error);
    }
  }

  async deleteComment(commentId: string): Promise<void> {
    try {
      await this.quickPostService.deleteComment(this.post.id, commentId);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  }

  async deleteReply(commentId: string, replyId: string): Promise<void> {
    try {
      await this.quickPostService.deleteReply(this.post.id, commentId, replyId);
    } catch (error) {
      console.error('Error deleting reply:', error);
    }
  }
}
