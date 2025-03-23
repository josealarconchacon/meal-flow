import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AuthModalComponent } from '../../../auth-modal/auth-modal.component';
import { AuthService } from '../../../../services/auth.service';
import { firstValueFrom } from 'rxjs';

interface Reply {
  id: number;
  content: string;
  author: string;
  timestamp: Date;
  likes: number;
  isLiked: boolean;
}

interface Comment {
  id: number;
  content: string;
  author: string;
  timestamp: Date;
  likes: number;
  isLiked: boolean;
  replies: Reply[];
  showReplyInput?: boolean;
}

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class CommentComponent {
  @Input() postId!: string;
  showComments = false;
  newCommentText = '';
  comments: Comment[] = [];
  replyText: { [key: number]: string } = {};

  // Constants for limiting display
  readonly INITIAL_COMMENTS_SHOWN = 3;
  readonly INITIAL_REPLIES_SHOWN = 2;
  showAllComments = false;

  // Track expanded comments for better performance
  expandedComments = new Set<number>();
  expandedReplies = new Map<number, boolean>();

  constructor(private dialog: MatDialog, private authService: AuthService) {}

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

  toggleComments(): void {
    this.showComments = !this.showComments;
    if (!this.showComments) {
      this.showAllComments = false;
    }
  }

  async addComment(): Promise<void> {
    if (!this.newCommentText.trim()) return;

    if (!(await this.checkAuth())) return;

    const newComment: Comment = {
      id: Date.now(),
      content: this.newCommentText,
      author: 'Jose',
      timestamp: new Date(),
      likes: 0,
      isLiked: false,
      replies: [],
    };
    this.comments.unshift(newComment);
    this.newCommentText = '';
  }

  async toggleLike(comment: Comment): Promise<void> {
    if (!(await this.checkAuth())) return;

    comment.isLiked = !comment.isLiked;
    comment.likes += comment.isLiked ? 1 : -1;
  }

  async toggleLikeReply(reply: Reply): Promise<void> {
    if (!(await this.checkAuth())) return;

    reply.isLiked = !reply.isLiked;
    reply.likes += reply.isLiked ? 1 : -1;
  }

  toggleReplyInput(comment: Comment): void {
    comment.showReplyInput = !comment.showReplyInput;
    if (comment.showReplyInput) {
      setTimeout(() => {
        const input = document.querySelector(
          `#reply-input-${comment.id}`
        ) as HTMLInputElement;
        if (input) {
          input.focus();
        }
      });
    }
  }

  async addReply(comment: Comment): Promise<void> {
    const replyContent = this.replyText[comment.id]?.trim();
    if (!replyContent) return;

    if (!(await this.checkAuth())) return;

    const newReply: Reply = {
      id: Date.now(),
      content: replyContent,
      author: 'Jose',
      timestamp: new Date(),
      likes: 0,
      isLiked: false,
    };
    comment.replies.unshift(newReply);
    this.expandedComments.add(comment.id);
    this.replyText[comment.id] = '';
    comment.showReplyInput = false;
  }

  toggleReplies(commentId: number): void {
    if (this.expandedComments.has(commentId)) {
      this.expandedComments.delete(commentId);
    } else {
      this.expandedComments.add(commentId);
    }
  }

  isCommentExpanded(commentId: number): boolean {
    return this.expandedComments.has(commentId);
  }

  getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  }

  // New methods for handling limited display
  getVisibleComments(): Comment[] {
    if (this.showAllComments) {
      return this.comments;
    }
    return this.comments.slice(0, this.INITIAL_COMMENTS_SHOWN);
  }

  getVisibleReplies(comment: Comment): Reply[] {
    if (this.expandedReplies.get(comment.id)) {
      return comment.replies;
    }
    return comment.replies.slice(0, this.INITIAL_REPLIES_SHOWN);
  }

  toggleAllComments(): void {
    this.showAllComments = !this.showAllComments;
  }

  toggleAllReplies(commentId: number): void {
    this.expandedReplies.set(commentId, !this.expandedReplies.get(commentId));
  }

  getRemainingCommentsCount(): number {
    return Math.max(0, this.comments.length - this.INITIAL_COMMENTS_SHOWN);
  }

  getRemainingRepliesCount(comment: Comment): number {
    return Math.max(0, comment.replies.length - this.INITIAL_REPLIES_SHOWN);
  }
}
