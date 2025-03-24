import { Component, Input, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AuthModalComponent } from '../../../auth-modal/auth-modal.component';
import { AuthService } from '../../../../services/auth.service';
import { PostService } from '../../../../services/post.service';
import { Post, Comment, CommentsResponse } from '../models/post.model';
import { firstValueFrom } from 'rxjs';
import { FirestoreDatePipe } from '../../../../pipes/firestore-date.pipe';

@Component({
  selector: 'app-post-interactions',
  standalone: true,
  imports: [CommonModule, FormsModule, FirestoreDatePipe],
  providers: [DatePipe],
  template: `
    <div class="post-interactions">
      <!-- Like Button -->
      <button
        class="btn btn-link text-decoration-none"
        [class.liked]="isLikedByCurrentUser"
        (click)="handleLike()"
        [disabled]="isLiking"
      >
        <i
          class="bi"
          [class.bi-heart-fill]="isLikedByCurrentUser"
          [class.bi-heart]="!isLikedByCurrentUser"
        ></i>
        {{ post.stats.likes || 0 }}
      </button>

      <!-- Comment Button -->
      <button
        class="btn btn-link text-decoration-none"
        (click)="toggleComments()"
      >
        <i class="bi bi-chat"></i>
        {{ post.stats.comments || 0 }}
      </button>

      <!-- Comments Section -->
      <div class="comments-section" *ngIf="showComments">
        <!-- Comment Input -->
        <div class="comment-input d-flex gap-2 align-items-start mb-3">
          <img
            [src]="
              (authService.user$ | async)?.photoURL ||
              '/assets/default-avatar.png'
            "
            [alt]="
              ((authService.user$ | async)?.displayName || 'User') +
              '\\'s avatar'
            "
            class="avatar-image"
            width="32"
            height="32"
          />
          <div class="flex-grow-1 position-relative">
            <div class="input-group">
              <textarea
                class="form-control"
                rows="1"
                placeholder="Write a comment..."
                [(ngModel)]="newComment"
                (keydown)="handleKeyDown($event)"
                [disabled]="isCommenting"
              ></textarea>
              <button
                class="btn btn-primary"
                (click)="handleComment()"
                [disabled]="!newComment.trim() || isCommenting"
              >
                <span
                  class="spinner-border spinner-border-sm me-1"
                  *ngIf="isCommenting"
                ></span>
                {{ isCommenting ? 'Posting...' : 'Post' }}
              </button>
            </div>
            <small class="text-muted d-block mt-1"
              >Press Enter to submit or Shift+Enter for a new line</small
            >
            <div
              class="alert alert-danger mt-2 mb-0 py-2 small"
              *ngIf="commentError"
            >
              {{ commentError }}
            </div>
          </div>
        </div>

        <!-- Loading Indicator -->
        <div class="text-center" *ngIf="isLoadingComments">
          <div
            class="spinner-border spinner-border-sm text-primary"
            role="status"
          >
            <span class="visually-hidden">Loading comments...</span>
          </div>
        </div>

        <!-- Comments List -->
        <div
          class="comments-list"
          *ngIf="post.comments && post.comments.length > 0"
        >
          <div class="comment mb-3" *ngFor="let comment of post.comments">
            <div class="d-flex gap-2">
              <img
                [src]="comment.author.photoURL || '/assets/default-avatar.png'"
                [alt]="comment.author.displayName + '\\'s avatar'"
                class="avatar-image"
                width="32"
                height="32"
              />
              <div class="comment-content flex-grow-1">
                <div class="comment-author">
                  {{ comment.author.displayName }}
                </div>
                <div class="comment-text">{{ comment.content }}</div>
                <div class="comment-actions">
                  <button
                    class="btn btn-link btn-sm p-0 text-muted me-2"
                    (click)="toggleReplyForm(comment)"
                  >
                    Reply
                  </button>
                  <span class="text-muted small">
                    {{ comment.createdAt | firestoreDate }}
                  </span>
                </div>

                <!-- Reply Form -->
                <div class="reply-form mt-2" *ngIf="comment.showReplyForm">
                  <div class="d-flex gap-2 align-items-start">
                    <img
                      [src]="
                        (authService.user$ | async)?.photoURL ||
                        '/assets/default-avatar.png'
                      "
                      [alt]="
                        ((authService.user$ | async)?.displayName || 'User') +
                        '\\'s avatar'
                      "
                      class="avatar-image"
                      width="24"
                      height="24"
                    />
                    <div class="flex-grow-1">
                      <div class="input-group">
                        <textarea
                          class="form-control form-control-sm"
                          rows="1"
                          placeholder="Write a reply..."
                          [(ngModel)]="comment.replyContent"
                          (keydown)="handleReplyKeyDown($event, comment)"
                          [disabled]="isReplying"
                        ></textarea>
                        <button
                          class="btn btn-primary btn-sm"
                          (click)="handleReply(comment)"
                          [disabled]="
                            !comment.replyContent?.trim() || isReplying
                          "
                        >
                          <span
                            class="spinner-border spinner-border-sm me-1"
                            *ngIf="isReplying"
                          ></span>
                          {{ isReplying ? 'Posting...' : 'Reply' }}
                        </button>
                      </div>
                      <small class="text-muted d-block mt-1"
                        >Press Enter to submit or Shift+Enter for a new
                        line</small
                      >
                    </div>
                  </div>
                </div>

                <!-- Replies List -->
                <div
                  class="replies-section mt-2"
                  *ngIf="comment.replies?.length"
                >
                  <div
                    class="reply d-flex gap-2 mb-2"
                    *ngFor="let reply of comment.replies"
                  >
                    <img
                      [src]="
                        reply.author.photoURL || '/assets/default-avatar.png'
                      "
                      [alt]="reply.author.displayName + '\\'s avatar'"
                      class="avatar-image"
                      width="24"
                      height="24"
                    />
                    <div class="reply-content">
                      <div class="reply-author small">
                        {{ reply.author.displayName }}
                      </div>
                      <div class="reply-text">{{ reply.content }}</div>
                      <div class="reply-timestamp text-muted small">
                        {{ reply.createdAt | firestoreDate }}
                      </div>
                    </div>
                  </div>

                  <!-- View More Replies -->
                  <button
                    *ngIf="comment.hasMoreReplies"
                    class="btn btn-link btn-sm text-muted p-0"
                    (click)="loadMoreReplies(comment)"
                    [disabled]="isLoadingMoreReplies[comment.id]"
                  >
                    <span
                      class="spinner-border spinner-border-sm me-1"
                      *ngIf="isLoadingMoreReplies[comment.id]"
                    ></span>
                    View more replies
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Load More Comments -->
        <div class="text-center mt-3" *ngIf="hasMoreComments">
          <button
            class="btn btn-link text-muted"
            (click)="loadMoreComments()"
            [disabled]="isLoadingMoreComments"
          >
            <span
              class="spinner-border spinner-border-sm me-1"
              *ngIf="isLoadingMoreComments"
            ></span>
            View more comments
          </button>
        </div>

        <!-- No Comments Message -->
        <div
          class="no-comments text-center text-muted"
          *ngIf="showComments && (!post.comments || post.comments.length === 0)"
        >
          No comments yet. Be the first to comment!
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .post-interactions {
        padding: 0.5rem 0;
      }

      .btn-link {
        color: var(--bs-gray-700);
        padding: 0.25rem 0.5rem;
        margin-right: 1rem;
      }

      .btn-link:hover {
        color: var(--bs-primary);
      }

      .btn-link.liked {
        color: var(--bs-danger);
      }

      .avatar-image {
        border-radius: 50%;
        object-fit: cover;
      }

      .comments-section {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--bs-gray-200);
      }

      .comment {
        margin-bottom: 1rem;
      }

      .comment-content {
        background: var(--bs-gray-100);
        padding: 0.75rem;
        border-radius: 0.75rem;
      }

      .comment-author {
        font-weight: 500;
        margin-bottom: 0.25rem;
      }

      .comment-actions {
        margin-top: 0.25rem;
      }

      .reply-content {
        background: var(--bs-gray-200);
        padding: 0.5rem;
        border-radius: 0.5rem;
        flex: 1;
      }

      .reply-author {
        font-weight: 500;
        margin-bottom: 0.25rem;
      }

      textarea {
        resize: none;
        overflow: hidden;
      }

      .replies-list {
        margin-left: 2rem;
      }
    `,
  ],
})
export class PostInteractionsComponent implements OnInit {
  @Input() post!: Post;

  showComments = false;
  newComment = '';
  isLiking = false;
  isCommenting = false;
  isReplying = false;
  isLoadingComments = false;
  isLoadingMoreComments = false;
  isLoadingMoreReplies: { [key: string]: boolean } = {};
  isLikedByCurrentUser = false;
  commentError = '';
  hasMoreComments = false;
  lastComment: any = null;

  constructor(
    private dialog: MatDialog,
    public authService: AuthService,
    private postService: PostService
  ) {}

  ngOnInit() {
    this.checkLikeStatus();
  }

  private async checkLikeStatus() {
    const user = await firstValueFrom(this.authService.user$);
    if (!user) return;

    this.isLikedByCurrentUser =
      this.post.likes?.some((like) => like.userId === user.uid) || false;
  }

  async handleLike() {
    const user = await firstValueFrom(this.authService.user$);
    if (!user) {
      this.openAuthModal();
      return;
    }

    try {
      this.isLiking = true;
      await this.postService.toggleLike(this.post.id, user.uid);
      this.isLikedByCurrentUser = !this.isLikedByCurrentUser;

      if (!this.post.stats) {
        this.post.stats = { likes: 0, comments: 0 };
      }

      if (this.isLikedByCurrentUser) {
        this.post.stats.likes = (this.post.stats.likes || 0) + 1;
      } else {
        this.post.stats.likes = Math.max((this.post.stats.likes || 0) - 1, 0);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      this.isLiking = false;
    }
  }

  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.handleComment();
    }
  }

  async handleComment() {
    this.commentError = '';
    if (!this.newComment.trim() || this.isCommenting) return;

    const user = await firstValueFrom(this.authService.user$);
    if (!user) {
      this.openAuthModal();
      return;
    }

    try {
      this.isCommenting = true;
      await this.postService.addComment(this.post.id, {
        content: this.newComment.trim(),
        author: {
          uid: user.uid,
          displayName: user.displayName || 'Anonymous',
          photoURL: user.photoURL || '/assets/default-avatar.png',
        },
      });

      this.newComment = '';
      if (!this.post.stats) {
        this.post.stats = { likes: 0, comments: 0 };
      }
      this.post.stats.comments = (this.post.stats.comments || 0) + 1;

      // Reset pagination when adding a new comment
      this.lastComment = null;
      await this.loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      this.commentError = 'Failed to post comment. Please try again.';
    } finally {
      this.isCommenting = false;
    }
  }

  async handleReply(comment: any) {
    if (!comment.replyContent?.trim() || this.isReplying) return;

    const user = await firstValueFrom(this.authService.user$);
    if (!user) {
      this.openAuthModal();
      return;
    }

    try {
      this.isReplying = true;
      await this.postService.addReply(this.post.id, comment.id, {
        content: comment.replyContent.trim(),
        author: {
          uid: user.uid,
          displayName: user.displayName || 'Anonymous',
          photoURL: user.photoURL || '/assets/default-avatar.png',
        },
      });

      comment.replyContent = '';
      comment.showReplyForm = false;
      await this.loadComments();
    } catch (error) {
      console.error('Error adding reply:', error);
    } finally {
      this.isReplying = false;
    }
  }

  toggleComments() {
    this.showComments = !this.showComments;
    if (this.showComments) {
      this.loadComments();
    }
  }

  toggleReplyForm(comment: any) {
    comment.showReplyForm = !comment.showReplyForm;
    if (!comment.showReplyForm) {
      comment.replyContent = '';
    }
  }

  async loadMoreComments() {
    if (this.isLoadingMoreComments) return;

    try {
      this.isLoadingMoreComments = true;
      const result = await this.postService.getComments(
        this.post.id,
        3,
        this.lastComment
      );

      if (result.comments.length > 0) {
        this.lastComment = result.comments[result.comments.length - 1];
        this.post.comments = [
          ...(this.post.comments || []),
          ...result.comments,
        ];
      }

      this.hasMoreComments = result.hasMore;
    } catch (error) {
      console.error('Error loading more comments:', error);
    } finally {
      this.isLoadingMoreComments = false;
    }
  }

  async loadMoreReplies(comment: Comment) {
    if (this.isLoadingMoreReplies[comment.id]) return;

    try {
      this.isLoadingMoreReplies[comment.id] = true;
      const lastReply = comment.replies?.[comment.replies.length - 1];
      const newReplies = await this.postService.getReplies(
        this.post.id,
        comment.id,
        2,
        lastReply
      );

      if (newReplies.length > 0) {
        comment.replies = [...(comment.replies || []), ...newReplies];
        comment.hasMoreReplies = comment.totalReplies! > comment.replies.length;
      }
    } catch (error) {
      console.error('Error loading more replies:', error);
    } finally {
      this.isLoadingMoreReplies[comment.id] = false;
    }
  }

  private async loadComments() {
    try {
      this.isLoadingComments = true;
      const result = await this.postService.getComments(this.post.id, 3);

      if (result.comments.length > 0) {
        this.lastComment = result.comments[result.comments.length - 1];
        this.post.comments = result.comments;
      }

      this.hasMoreComments = result.hasMore;
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      this.isLoadingComments = false;
    }
  }

  private openAuthModal() {
    this.dialog.open(AuthModalComponent, {
      width: '400px',
      disableClose: true,
    });
  }

  handleReplyKeyDown(event: KeyboardEvent, comment: any) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.handleReply(comment);
    }
  }
}
