import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  FirebaseService,
  FirebaseComment,
} from '../../services/firebase.service';

@Component({
  selector: 'app-comment-panel',
  templateUrl: './comment-panel.component.html',
  styleUrls: ['./comment-panel.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class CommentPanelComponent implements OnInit {
  comments: FirebaseComment[] = [];
  newCommentText: string = '';
  replyTexts: { [key: string]: string } = {};
  showReplyInput: { [key: string]: boolean } = {};
  @Input() postId!: string;

  constructor(public firebaseService: FirebaseService) {}

  ngOnInit() {
    this.loadComments();
  }

  async loadComments() {
    try {
      this.comments = await this.firebaseService.getComments(this.postId);
      this.comments.sort((a, b) => {
        return (
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      });
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  }

  async submitComment() {
    if (!this.newCommentText.trim()) return;

    try {
      await this.firebaseService.addComment(
        this.postId,
        this.newCommentText.trim()
      );
      this.newCommentText = '';
      await this.loadComments();
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  }

  async submitReply(commentId: string | undefined) {
    try {
      // Check if we have a valid postId
      if (!this.postId?.trim()) {
        console.error('Cannot reply: Invalid post ID');
        return;
      }

      // Check if we have a valid commentId
      if (!commentId?.trim()) {
        console.error('Cannot reply: Comment ID is required');
        return;
      }

      // Check if the comment exists in our comments array
      const commentExists = this.comments.some(
        (comment) => comment.id === commentId
      );
      if (!commentExists) {
        console.error('Cannot reply: Comment not found');
        return;
      }

      // Check if we have reply text for this comment
      const replyText = this.replyTexts[commentId];
      if (!replyText?.trim()) {
        console.error('Reply text cannot be empty');
        return;
      }

      // Attempt to add the reply
      await this.firebaseService.addReply(
        this.postId,
        commentId,
        replyText.trim()
      );

      // Only clear the input and hide it if the reply was successful
      this.replyTexts[commentId] = '';
      this.showReplyInput[commentId] = false;
      await this.loadComments();
    } catch (error) {
      console.error('Error submitting reply:', error);
      // Rethrow the error to be handled by the caller if needed
      throw error;
    }
  }

  async likeComment(commentId: string) {
    try {
      await this.firebaseService.likeComment(this.postId, commentId);
      await this.loadComments();
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  }

  async likeReply(commentId: string, replyId: string) {
    try {
      await this.firebaseService.likeReply(this.postId, commentId, replyId);
      await this.loadComments();
    } catch (error) {
      console.error('Error liking reply:', error);
    }
  }

  async deleteComment(commentId: string) {
    try {
      await this.firebaseService.deleteComment(this.postId, commentId);
      await this.loadComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  }

  async deleteReply(commentId: string, replyId: string) {
    try {
      await this.firebaseService.deleteReply(this.postId, commentId, replyId);
      await this.loadComments();
    } catch (error) {
      console.error('Error deleting reply:', error);
    }
  }

  toggleReplyInput(commentId: string) {
    if (!commentId) {
      console.error('Cannot toggle reply input: Invalid comment');
      return;
    }

    // Initialize the reply text if it doesn't exist
    if (!this.replyTexts[commentId]) {
      this.replyTexts[commentId] = '';
    }

    this.showReplyInput[commentId] = !this.showReplyInput[commentId];

    // Clear the reply text when hiding the input
    if (!this.showReplyInput[commentId]) {
      this.replyTexts[commentId] = '';
    }
  }
}
