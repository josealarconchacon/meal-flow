import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Reply {
  id: number;
  content: string;
  author: string;
  timestamp: Date;
  likes: number;
  isLiked: boolean;
  parentId?: number;
}

@Component({
  selector: 'app-reply',
  templateUrl: './reply.component.html',
  styleUrls: ['./reply.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class ReplyComponent {
  @Input() postId!: number;
  @Input() commentId?: number;

  showReplyInput = false;
  replyText = '';
  replies: Reply[] = [];

  toggleReplyInput(): void {
    this.showReplyInput = !this.showReplyInput;
    if (this.showReplyInput) {
      setTimeout(() => {
        const input = document.querySelector(
          '.reply-input'
        ) as HTMLInputElement;
        input?.focus();
      }, 0);
    }
  }

  addReply(): void {
    if (this.replyText.trim()) {
      const newReply: Reply = {
        id: Date.now(),
        content: this.replyText,
        author: 'Jose',
        timestamp: new Date(),
        likes: 0,
        isLiked: false,
        parentId: this.commentId,
      };
      this.replies.unshift(newReply);
      this.replyText = '';
      this.showReplyInput = false;
    }
  }

  toggleLike(reply: Reply): void {
    reply.isLiked = !reply.isLiked;
    reply.likes += reply.isLiked ? 1 : -1;
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
}
