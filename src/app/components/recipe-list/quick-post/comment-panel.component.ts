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
import { trigger, transition, style, animate } from '@angular/animations';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-comment-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      *ngIf="isOpen"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end"
      (click)="closePanel()"
      @overlayAnimation
    >
      <!-- Comment Panel -->
      <div
        class="w-full max-w-md bg-white h-full transform transition-transform duration-300 shadow-2xl"
        [class.translate-x-full]="!isOpen"
        [class.translate-x-0]="isOpen"
        (click)="$event.stopPropagation()"
        @panelAnimation
      >
        <!-- Header -->
        <div
          class="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100"
        >
          <div class="flex justify-between items-center p-4">
            <div class="flex items-center gap-3">
              <h3 class="text-lg font-semibold text-gray-900">Comments</h3>
              <span
                class="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full"
              >
                {{ getTotalCommentsCount() }}
              </span>
            </div>
            <button
              class="p-2 text-gray-400 hover:text-gray-600 rounded-xl transition-colors hover:bg-gray-50"
              (click)="closePanel()"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <!-- Original Post Preview -->
        <div class="p-4 border-b bg-gray-50/80 backdrop-blur-sm">
          <div class="flex items-center gap-3 mb-3">
            <div
              class="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-0.5 ring-2 ring-white"
            >
              <div
                class="h-full w-full rounded-full bg-white flex items-center justify-center"
              >
                <i class="fas fa-user text-indigo-600"></i>
              </div>
            </div>
            <div>
              <p class="font-medium text-gray-900">{{ post.username }}</p>
              <p class="text-xs text-gray-500">
                {{ formatDate(post.timestamp) }}
              </p>
            </div>
          </div>
          <p class="text-gray-600 text-sm line-clamp-2 leading-relaxed">
            {{ post.text }}
          </p>
        </div>

        <!-- Comments List -->
        <div class="flex-1 overflow-y-auto h-[calc(100%-13rem)] bg-gray-50/50">
          <div class="divide-y divide-gray-100">
            <ng-container *ngFor="let comment of post.comments">
              <!-- Main Comment -->
              <div
                class="p-4 hover:bg-white transition-colors duration-200"
                @commentAnimation
              >
                <div class="flex items-start gap-3">
                  <div
                    class="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-0.5 ring-2 ring-white flex-shrink-0"
                  >
                    <div
                      class="h-full w-full rounded-full bg-white flex items-center justify-center"
                    >
                      <i class="fas fa-user text-indigo-600 text-xs"></i>
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-2 mb-1">
                      <p class="font-medium text-gray-900 text-sm">
                        {{ comment.username }}
                      </p>
                      <p class="text-xs text-gray-500 whitespace-nowrap">
                        {{ formatDate(comment.timestamp) }}
                      </p>
                    </div>
                    <p
                      class="text-gray-600 text-sm break-words leading-relaxed"
                    >
                      {{ comment.text }}
                    </p>
                    <div class="flex items-center gap-4 mt-2.5">
                      <button
                        (click)="likeComment(comment.id)"
                        class="text-xs flex items-center gap-1.5 hover:text-gray-900 transition-colors group"
                        [class.text-red-500]="hasUserLikedComment(comment.id)"
                        [class.text-gray-500]="!hasUserLikedComment(comment.id)"
                      >
                        <i
                          class="fas fa-heart group-hover:scale-125 transition-transform"
                        ></i>
                        <span>{{ comment.likes || 0 }}</span>
                      </button>
                      <button
                        (click)="toggleReplyInput(comment.id)"
                        class="text-xs text-gray-500 hover:text-indigo-600 transition-colors group"
                      >
                        <i
                          class="fas fa-reply group-hover:scale-125 transition-transform mr-1.5"
                        ></i>
                        <span>Reply</span>
                      </button>
                      <button
                        *ngIf="canDeleteComment(comment)"
                        (click)="deleteComment(comment.id)"
                        class="text-xs text-gray-400 hover:text-red-500 transition-colors group"
                      >
                        <i
                          class="fas fa-trash-alt group-hover:scale-125 transition-transform"
                        ></i>
                      </button>
                    </div>

                    <!-- Reply Input -->
                    <div
                      *ngIf="replyingToId === comment.id"
                      class="mt-3"
                      @fadeAnimation
                    >
                      <div class="flex items-start gap-2">
                        <div
                          class="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-0.5 ring-2 ring-white flex-shrink-0"
                        >
                          <div
                            class="h-full w-full rounded-full bg-white flex items-center justify-center"
                          >
                            <i
                              class="fas fa-user text-indigo-600 text-[10px]"
                            ></i>
                          </div>
                        </div>
                        <div class="flex-1 relative">
                          <textarea
                            [(ngModel)]="replyText"
                            rows="1"
                            class="w-full px-3 py-2 text-sm text-gray-900 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                            placeholder="Write a reply..."
                            (keydown.enter)="
                              $event.preventDefault(); submitReply(comment.id)
                            "
                            [class.pr-9]="replyText.trim().length > 0"
                          ></textarea>
                          <button
                            *ngIf="replyText.trim().length > 0"
                            (click)="submitReply(comment.id)"
                            class="absolute right-2 top-1.5 p-1.5 text-indigo-600 hover:text-indigo-800 transition-colors group"
                            @fadeAnimation
                          >
                            <i
                              class="fas fa-paper-plane group-hover:scale-125 transition-transform"
                            ></i>
                          </button>
                        </div>
                      </div>
                      <div class="flex justify-end gap-2 mt-2">
                        <button
                          (click)="cancelReply()"
                          class="px-3 py-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>

                    <!-- Nested Replies -->
                    <div
                      *ngIf="comment.replies && comment.replies.length > 0"
                      class="mt-3 space-y-3 pl-4 border-l-2 border-gray-100"
                    >
                      <div
                        *ngFor="let reply of comment.replies"
                        class="flex items-start gap-2"
                        @commentAnimation
                      >
                        <div
                          class="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-0.5 ring-2 ring-white flex-shrink-0"
                        >
                          <div
                            class="h-full w-full rounded-full bg-white flex items-center justify-center"
                          >
                            <i
                              class="fas fa-user text-indigo-600 text-[10px]"
                            ></i>
                          </div>
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center justify-between gap-2">
                            <p class="font-medium text-gray-900 text-xs">
                              {{ reply.username }}
                            </p>
                            <p class="text-xs text-gray-500">
                              {{ formatDate(reply.timestamp) }}
                            </p>
                          </div>
                          <p
                            class="text-gray-600 text-xs mt-0.5 break-words leading-relaxed"
                          >
                            {{ reply.text }}
                          </p>
                          <div class="flex items-center gap-3 mt-1.5">
                            <button
                              (click)="likeReply(comment.id, reply.id)"
                              class="text-xs flex items-center gap-1 hover:text-gray-900 transition-colors group"
                              [class.text-red-500]="
                                hasUserLikedReply(comment.id, reply.id)
                              "
                              [class.text-gray-500]="
                                !hasUserLikedReply(comment.id, reply.id)
                              "
                            >
                              <i
                                class="fas fa-heart group-hover:scale-125 transition-transform"
                              ></i>
                              <span>{{ reply.likes || 0 }}</span>
                            </button>
                            <button
                              *ngIf="canDeleteReply(reply)"
                              (click)="deleteReply(comment.id, reply.id)"
                              class="text-xs text-gray-400 hover:text-red-500 transition-colors group"
                            >
                              <i
                                class="fas fa-trash-alt group-hover:scale-125 transition-transform"
                              ></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ng-container>

            <!-- Empty State -->
            <div *ngIf="post.comments.length === 0" class="p-8 text-center">
              <div class="mx-auto h-16 w-16 text-gray-200 mb-4">
                <i class="fas fa-comments text-4xl"></i>
              </div>
              <h4 class="text-gray-900 font-medium mb-1">No comments yet</h4>
              <p class="text-gray-500 text-sm">
                Be the first to share your thoughts!
              </p>
            </div>
          </div>
        </div>

        <!-- Comment Input -->
        <div class="sticky bottom-0 border-t bg-white shadow-lg">
          <div class="p-4">
            <div class="flex items-start gap-3">
              <div
                class="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-0.5 ring-2 ring-white flex-shrink-0"
              >
                <div
                  class="h-full w-full rounded-full bg-white flex items-center justify-center"
                >
                  <i class="fas fa-user text-indigo-600 text-xs"></i>
                </div>
              </div>
              <div class="flex-1 relative">
                <textarea
                  [(ngModel)]="newComment"
                  rows="1"
                  class="w-full px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                  placeholder="Write a comment..."
                  (keydown.enter)="$event.preventDefault(); submitComment()"
                  [class.pr-10]="newComment.trim().length > 0"
                ></textarea>
                <button
                  *ngIf="newComment.trim().length > 0"
                  (click)="submitComment()"
                  class="absolute right-2 top-2 p-1.5 text-indigo-600 hover:text-indigo-800 transition-colors group"
                  @fadeAnimation
                >
                  <i
                    class="fas fa-paper-plane group-hover:scale-125 transition-transform"
                  ></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
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
        animate('200ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('200ms ease-in', style({ opacity: 0 }))]),
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
  @Input() set post(value: Post) {
    this._post = value;
    this.subscribeToPostUpdates();
  }
  get post(): Post {
    return this._post;
  }
  @Output() close = new EventEmitter<void>();

  private _post!: Post;
  private destroy$ = new Subject<void>();
  newComment = '';
  replyText = '';
  replyingToId: string | null = null;

  constructor(private quickPostService: QuickPostService) {}

  ngOnInit(): void {
    this.subscribeToPostUpdates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToPostUpdates(): void {
    if (!this._post) return;

    this.quickPostService
      .getPosts()
      .pipe(takeUntil(this.destroy$))
      .subscribe((posts) => {
        const updatedPost = posts.find((p) => p.id === this._post.id);
        if (updatedPost) {
          this._post = updatedPost;
        }
      });
  }

  closePanel(): void {
    this.close.emit();
  }

  formatDate(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  }

  getTotalCommentsCount(): number {
    let total = this.post.comments.length;
    this.post.comments.forEach((comment) => {
      total += comment.replies?.length || 0;
    });
    return total;
  }

  submitComment(): void {
    if (!this.newComment.trim()) return;
    this.quickPostService.addComment(this.post.id, this.newComment.trim());
    this.newComment = '';
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

  submitReply(commentId: string): void {
    if (!this.replyText.trim()) return;
    this.quickPostService.addReply(
      this.post.id,
      commentId,
      this.replyText.trim()
    );
    this.cancelReply();
  }

  likeComment(commentId: string): void {
    this.quickPostService.likeComment(this.post.id, commentId);
  }

  likeReply(commentId: string, replyId: string): void {
    this.quickPostService.likeReply(this.post.id, commentId, replyId);
  }

  deleteComment(commentId: string): void {
    this.quickPostService.deleteComment(this.post.id, commentId);
  }

  deleteReply(commentId: string, replyId: string): void {
    this.quickPostService.deleteReply(this.post.id, commentId, replyId);
  }

  hasUserLikedComment(commentId: string): boolean {
    return this.quickPostService.hasUserLikedComment(this.post.id, commentId);
  }

  hasUserLikedReply(commentId: string, replyId: string): boolean {
    return this.quickPostService.hasUserLikedReply(
      this.post.id,
      commentId,
      replyId
    );
  }

  canDeleteComment(comment: Comment): boolean {
    return comment.userId === this.quickPostService.getCurrentUserId();
  }

  canDeleteReply(reply: Comment): boolean {
    return reply.userId === this.quickPostService.getCurrentUserId();
  }
}
