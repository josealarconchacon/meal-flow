import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import {
  QuickPostService,
  Post,
  ShareOption,
} from '../../../services/quick-post.service';
import { UserService, UserProfile } from '../../../services/user.service';
import { Observable, map } from 'rxjs';
import { CommentPanelComponent } from './comment-panel.component';

interface ImageItem {
  file: File;
  preview: string;
  croppedPreview?: string;
}

interface VideoItem {
  file: File;
  preview: string;
  duration: number;
}

interface MediaItem {
  type: 'image' | 'video';
  content: ImageItem[] | VideoItem;
  id?: string;
}

@Component({
  selector: 'app-quick-post',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CommentPanelComponent],
  template: `
    <!-- Main Container with subtle gradient background -->
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <!-- Main Content Area -->
      <div class="max-w-xl mx-auto px-4 pb-8">
        <!-- Create Post Card -->
        <div
          class="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 hover:shadow-md hover:border-gray-200 transition-all duration-200"
        >
          <div class="p-4">
            <div class="flex items-center gap-4">
              <div
                class="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-0.5"
              >
                <div
                  class="h-full w-full rounded-full bg-white overflow-hidden"
                >
                  <img
                    [src]="avatarUrl$ | async"
                    [alt]="(currentUser$ | async)?.username"
                    class="h-full w-full object-cover"
                  />
                </div>
              </div>
              <button
                (click)="showModal = true"
                class="flex-1 text-left px-6 py-3.5 bg-gray-50 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-600 transition-all duration-200"
              >
                <span class="text-sm">Share a recipe idea...</span>
              </button>
            </div>
            <div
              class="flex items-center justify-between mt-4 pt-4 border-t border-gray-50"
            >
              <button
                (click)="showModal = true"
                class="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-xl transition-all group"
              >
                <i
                  class="fas fa-camera text-indigo-600 group-hover:scale-110 transition-transform"
                ></i>
                <span class="text-sm text-gray-600">Photo</span>
              </button>
              <button
                (click)="showModal = true"
                class="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-xl transition-all group"
              >
                <i
                  class="fas fa-hashtag text-indigo-600 group-hover:scale-110 transition-transform"
                ></i>
                <span class="text-sm text-gray-600">Tags</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Posts Feed -->
        <div class="space-y-6">
          <ng-container *ngIf="posts$ | async as posts">
            <!-- Empty State -->
            <div
              *ngIf="posts.length === 0"
              class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center"
            >
              <div class="mx-auto h-24 w-24 text-indigo-100 mb-6 animate-pulse">
                <i class="fas fa-utensils text-6xl"></i>
              </div>
              <h3 class="text-xl font-semibold text-gray-800 mb-3">
                No recipes yet
              </h3>
              <p class="text-gray-500 mb-8 max-w-sm mx-auto">
                Be the first to share a delicious recipe idea with the
                community!
              </p>
              <button
                (click)="showModal = true"
                class="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <i class="fas fa-plus mr-2"></i>
                Share Recipe
              </button>
            </div>

            <!-- Posts List -->
            <div
              *ngFor="let post of posts"
              class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all duration-200"
            >
              <!-- Post Header -->
              <div class="p-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <div
                      class="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-0.5"
                    >
                      <div
                        class="h-full w-full rounded-full bg-white overflow-hidden"
                      >
                        <img
                          [src]="avatarUrl$ | async"
                          [alt]="(currentUser$ | async)?.username"
                          class="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                    <div>
                      <p class="font-medium text-gray-900">
                        {{ (currentUser$ | async)?.username }}
                      </p>
                      <p class="text-xs text-gray-500 mt-0.5">
                        {{ formatDate(post.timestamp) }}
                      </p>
                    </div>
                  </div>
                  <div class="relative group">
                    <button
                      class="p-2 hover:bg-gray-50 rounded-xl transition-all"
                    >
                      <i
                        class="fas fa-ellipsis-h text-gray-400 group-hover:text-gray-600"
                      ></i>
                    </button>
                    <div
                      class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 hidden group-hover:block transform transition-all scale-95 group-hover:scale-100 opacity-0 group-hover:opacity-100"
                    >
                      <button
                        (click)="deletePost(post.id)"
                        class="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-xl transition-colors"
                      >
                        <i class="fas fa-trash-alt"></i>
                        <span>Delete post</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Post Content -->
              <div class="px-4 pb-3">
                <p
                  class="text-gray-900 whitespace-pre-line break-words leading-relaxed mb-3"
                >
                  {{ post.text }}
                </p>

                <!-- Tags -->
                <div
                  *ngIf="post.tags.length > 0"
                  class="flex flex-wrap gap-2 mb-4"
                >
                  <span
                    *ngFor="let tag of post.tags"
                    class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors cursor-pointer transform hover:scale-105"
                  >
                    #{{ tag }}
                  </span>
                </div>

                <!-- Media Content -->
                <ng-container *ngIf="post.video || post.images">
                  <!-- Video Post -->
                  <div *ngIf="post.video" class="-mx-4 sm:-mx-6">
                    <div class="relative bg-gray-50">
                      <div class="aspect-video">
                        <video
                          #videoPlayer
                          class="w-full h-full object-cover"
                          [poster]="post.video.thumbnail"
                          controls
                          preload="metadata"
                          controlsList="nodownload"
                          playsinline
                        >
                          <source
                            [src]="sanitizeVideoUrl(post.video.url)"
                            type="video/mp4"
                          />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                      <div
                        class="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded-md backdrop-blur-sm"
                      >
                        {{ post.video.duration.toFixed(1) }}s
                      </div>
                    </div>
                  </div>

                  <!-- Image Post -->
                  <div *ngIf="post.images" class="-mx-4 sm:-mx-6">
                    <div class="relative bg-gray-50">
                      <!-- Images Container -->
                      <div class="w-full">
                        <div class="relative aspect-[16/9]">
                          <img
                            [src]="post.images[currentImageIndex[post.id] || 0]"
                            [alt]="
                              'Post image ' +
                              ((currentImageIndex[post.id] || 0) + 1)
                            "
                            class="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      </div>

                      <!-- Navigation Arrows -->
                      <div
                        *ngIf="post.images.length > 1"
                        class="absolute inset-y-0 inset-x-2 sm:inset-x-4 flex items-center justify-between pointer-events-none"
                      >
                        <button
                          (click)="
                            $event.stopPropagation(); previousImage(post)
                          "
                          class="p-2 sm:p-2.5 rounded-full bg-black/50 text-white hover:bg-black/75 transition-all pointer-events-auto transform hover:scale-110 backdrop-blur-sm"
                          [class.opacity-0]="currentImageIndex[post.id] === 0"
                        >
                          <i
                            class="fas fa-chevron-left text-sm sm:text-base"
                          ></i>
                        </button>
                        <button
                          (click)="$event.stopPropagation(); nextImage(post)"
                          class="p-2 sm:p-2.5 rounded-full bg-black/50 text-white hover:bg-black/75 transition-all pointer-events-auto transform hover:scale-110 backdrop-blur-sm"
                          [class.opacity-0]="
                            currentImageIndex[post.id] ===
                            post.images.length - 1
                          "
                        >
                          <i
                            class="fas fa-chevron-right text-sm sm:text-base"
                          ></i>
                        </button>
                      </div>

                      <!-- Image Counter -->
                      <div
                        *ngIf="post.images.length > 1"
                        class="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-black/50 text-white text-xs font-medium backdrop-blur-sm"
                      >
                        {{ (currentImageIndex[post.id] || 0) + 1 }} /
                        {{ post.images.length }}
                      </div>

                      <!-- Image Dots -->
                      <div
                        *ngIf="post.images.length > 1"
                        class="absolute bottom-3 sm:bottom-4 left-0 right-0 flex justify-center gap-1.5 sm:gap-2"
                      >
                        <ng-container
                          *ngFor="let image of post.images; let i = index"
                        >
                          <button
                            type="button"
                            (click)="
                              $event.stopPropagation();
                              setCurrentImage(post.id, i)
                            "
                            [ngClass]="{
                              'w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all transform hover:scale-125': true,
                              'bg-white opacity-100':
                                currentImageIndex[post.id] === i,
                              'bg-white/50 opacity-60':
                                currentImageIndex[post.id] !== i
                            }"
                          ></button>
                        </ng-container>
                      </div>
                    </div>
                  </div>
                </ng-container>

                <!-- Engagement Stats -->
                <div
                  class="flex items-center justify-between text-sm text-gray-500 mb-4"
                >
                  <div class="flex items-center gap-4">
                    <!-- Likes -->
                    <div class="group relative">
                      <button
                        class="flex items-center gap-1.5 hover:text-gray-700"
                      >
                        <i
                          class="fas fa-heart"
                          [class.text-red-500]="hasUserLikedPost(post.id)"
                        ></i>
                        <span>{{ post.likes }}</span>
                      </button>
                      <!-- Likes tooltip -->
                      <div
                        class="absolute left-0 bottom-full mb-2 w-48 bg-black/75 backdrop-blur-sm text-white text-xs rounded-lg py-2 px-3 hidden group-hover:block z-10"
                      >
                        <div *ngIf="post.likedBy.length === 0">
                          No likes yet
                        </div>
                        <div *ngIf="post.likedBy.length === 1">
                          Liked by {{ post.username }}
                        </div>
                        <div *ngIf="post.likedBy.length > 1">
                          Liked by {{ post.username }} and
                          {{ post.likedBy.length - 1 }} others
                        </div>
                      </div>
                    </div>

                    <!-- Comments -->
                    <button
                      class="flex items-center gap-1.5 hover:text-gray-700"
                      (click)="openComments(post)"
                    >
                      <i class="fas fa-comment"></i>
                      <span>{{ post.comments?.length || 0 }}</span>
                    </button>

                    <!-- Shares -->
                    <button
                      class="flex items-center gap-1.5 hover:text-gray-700"
                    >
                      <i class="fas fa-share"></i>
                      <span>{{ post.shares }}</span>
                    </button>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div
                  class="flex items-center justify-between pt-3 border-t border-gray-100"
                >
                  <!-- Like Button -->
                  <button
                    (click)="likePost(post.id)"
                    (dblclick)="likePost(post.id)"
                    class="flex-1 flex items-center justify-center gap-2 py-2.5 hover:bg-gray-50 rounded-xl transition-all group relative"
                    [class.text-red-500]="hasUserLikedPost(post.id)"
                    [class.text-gray-600]="!hasUserLikedPost(post.id)"
                  >
                    <i
                      class="fas fa-heart group-hover:scale-125 transition-transform"
                    ></i>
                    <span class="font-medium">Like</span>
                    <!-- Like animation -->
                    <div
                      *ngIf="showLikeAnimation[post.id]"
                      class="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <i
                        class="fas fa-heart text-6xl text-red-500 animate-like-pop"
                      ></i>
                    </div>
                  </button>

                  <!-- Comment Button -->
                  <button
                    (click)="openComments(post)"
                    class="flex-1 flex items-center justify-center gap-2 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl transition-all group"
                  >
                    <i
                      class="fas fa-comment group-hover:scale-125 transition-transform"
                    ></i>
                    <span class="font-medium">Comment</span>
                  </button>

                  <!-- Share Button -->
                  <button
                    (click)="openShareModal(post)"
                    class="flex-1 flex items-center justify-center gap-2 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl transition-all group"
                  >
                    <i
                      class="fas fa-share group-hover:scale-125 transition-transform"
                    ></i>
                    <span class="font-medium">Share</span>
                  </button>
                </div>
              </div>
            </div>
          </ng-container>
        </div>
      </div>

      <!-- Create Post Modal -->
      <div
        *ngIf="showModal"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
        (click)="showModal = false"
      >
        <div
          class="w-full max-w-lg bg-white rounded-2xl shadow-xl mx-4"
          (click)="$event.stopPropagation()"
        >
          <div class="p-4 border-b border-gray-100">
            <h2 class="text-lg font-semibold text-gray-900">Create Post</h2>
          </div>

          <!-- Post Content -->
          <div class="p-4">
            <textarea
              [(ngModel)]="postText"
              rows="4"
              class="w-full px-4 py-3 text-gray-900 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
              placeholder="Share your recipe idea..."
            ></textarea>

            <!-- Media Preview -->
            <div *ngIf="selectedMedia" class="mt-4">
              <!-- Image Preview -->
              <div
                *ngIf="selectedMedia.type === 'image'"
                class="grid grid-cols-2 sm:grid-cols-4 gap-2"
              >
                <ng-container *ngIf="isImageContent(selectedMedia.content)">
                  <div
                    *ngFor="let image of selectedMedia.content; let i = index"
                    class="relative aspect-square group"
                  >
                    <img
                      [src]="image.croppedPreview || image.preview"
                      class="w-full h-full object-cover rounded-lg"
                      [alt]="'Image ' + (i + 1)"
                    />
                    <div
                      class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2"
                    >
                      <button
                        (click)="removeImage(i)"
                        class="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <i class="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>

                  <!-- Add More Images Button -->
                  <div
                    *ngIf="selectedMedia.content.length < 4"
                    class="relative aspect-square"
                  >
                    <button
                      (click)="fileInput.click()"
                      class="w-full h-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                    >
                      <i
                        class="fas fa-plus text-gray-400 group-hover:text-indigo-500"
                      ></i>
                      <span
                        class="text-xs text-gray-500 group-hover:text-indigo-600"
                        >Add Image</span
                      >
                    </button>
                  </div>
                </ng-container>
              </div>

              <!-- Video Preview -->
              <div
                *ngIf="selectedMedia.type === 'video'"
                class="relative bg-gray-50 rounded-xl overflow-hidden"
              >
                <ng-container *ngIf="isVideoContent(selectedMedia.content)">
                  <div class="aspect-video">
                    <video
                      #videoPlayer
                      class="w-full h-full object-cover"
                      [poster]="selectedMedia.content.preview"
                      controls
                      preload="metadata"
                    >
                      <source
                        [src]="sanitizeVideoUrl(selectedMedia.content.preview)"
                        type="video/mp4"
                      />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  <button
                    (click)="removeMedia()"
                    class="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </ng-container>
              </div>
            </div>

            <!-- Media Upload Buttons -->
            <div class="flex items-center gap-4 mt-4">
              <input
                #fileInput
                type="file"
                accept="image/*"
                multiple
                class="hidden"
                (change)="onImagesSelected($event)"
              />
              <input
                #videoInput
                type="file"
                accept="video/*"
                class="hidden"
                (change)="onVideoSelected($event)"
              />
              <button
                (click)="fileInput.click()"
                [class.opacity-50]="selectedMedia?.type === 'video'"
                [disabled]="selectedMedia?.type === 'video'"
                class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors disabled:cursor-not-allowed"
              >
                <i class="fas fa-camera text-indigo-600"></i>
                <span>Photo</span>
                <span
                  *ngIf="selectedMedia?.type === 'image'"
                  class="text-xs text-gray-500"
                >
                  ({{ getImageCount() }}/4)
                </span>
              </button>
              <button
                (click)="videoInput.click()"
                [class.opacity-50]="selectedMedia?.type === 'image'"
                [disabled]="selectedMedia?.type === 'image'"
                class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors disabled:cursor-not-allowed"
              >
                <i class="fas fa-video text-indigo-600"></i>
                <span>Video</span>
              </button>
            </div>

            <!-- Tags -->
            <div class="mt-4">
              <div class="flex flex-wrap gap-2">
                <button
                  *ngFor="let tag of commonTags"
                  (click)="toggleTag(tag)"
                  class="px-3 py-1 text-sm rounded-full transition-all"
                  [class.bg-indigo-100]="selectedTags.includes(tag)"
                  [class.text-indigo-700]="selectedTags.includes(tag)"
                  [class.bg-gray-100]="!selectedTags.includes(tag)"
                  [class.text-gray-600]="!selectedTags.includes(tag)"
                  [class.hover:bg-indigo-50]="!selectedTags.includes(tag)"
                >
                  #{{ tag }}
                </button>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 p-4 border-t border-gray-100">
            <button
              (click)="showModal = false"
              class="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              (click)="submitPost()"
              [disabled]="!isValidPost"
              class="px-6 py-2 text-sm text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Post
            </button>
          </div>
        </div>
      </div>

      <!-- Image Cropping Modal -->
      <div
        *ngIf="showCropModal"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        (click)="showCropModal = false"
      >
        <div
          class="w-full max-w-2xl bg-white rounded-2xl shadow-xl"
          (click)="$event.stopPropagation()"
        >
          <div class="flex justify-between items-center p-4 border-b">
            <h3 class="text-lg font-semibold text-gray-900">Crop Image</h3>
            <button
              class="p-2 text-gray-400 hover:text-gray-600 rounded-xl transition-colors"
              (click)="showCropModal = false"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="p-4">
            <canvas
              #cropCanvas
              class="max-w-full mx-auto border rounded-xl"
            ></canvas>

            <div class="flex justify-center gap-6 mt-6">
              <button
                (click)="rotateCrop(-90)"
                class="p-2.5 text-gray-600 hover:text-indigo-600 transition-colors transform hover:scale-110"
                title="Rotate left"
              >
                <i class="fas fa-undo text-xl"></i>
              </button>
              <button
                (click)="rotateCrop(90)"
                class="p-2.5 text-gray-600 hover:text-indigo-600 transition-colors transform hover:scale-110"
                title="Rotate right"
              >
                <i class="fas fa-redo text-xl"></i>
              </button>
              <button
                (click)="resetCrop()"
                class="p-2.5 text-gray-600 hover:text-indigo-600 transition-colors transform hover:scale-110"
                title="Reset crop"
              >
                <i class="fas fa-sync text-xl"></i>
              </button>
            </div>
          </div>

          <div
            class="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-2xl"
          >
            <button
              (click)="showCropModal = false"
              class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              Cancel
            </button>
            <button
              (click)="applyCrop()"
              class="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full hover:from-indigo-700 hover:to-purple-700 shadow-sm hover:shadow transition-all"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      <!-- Share Modal -->
      <div
        *ngIf="selectedPostForShare"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        (click)="closeShareModal()"
      >
        <div
          class="w-full max-w-md bg-white rounded-2xl shadow-xl"
          (click)="$event.stopPropagation()"
        >
          <div class="flex justify-between items-center p-4 border-b">
            <h3 class="text-lg font-semibold text-gray-900">Share Post</h3>
            <button
              class="p-2 text-gray-400 hover:text-gray-600 rounded-xl transition-colors"
              (click)="closeShareModal()"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="p-4 space-y-4">
            <!-- Share Options -->
            <div class="grid grid-cols-2 gap-4">
              <button
                *ngFor="let option of shareOptions"
                (click)="handleShare(option, selectedPostForShare)"
                class="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
              >
                <i
                  [class]="
                    option.icon +
                    ' text-xl text-indigo-600 group-hover:scale-125 transition-transform'
                  "
                ></i>
                <span class="text-sm font-medium text-gray-700">{{
                  option.label
                }}</span>
              </button>
            </div>

            <!-- Share URL -->
            <div class="mt-6 relative">
              <input
                type="text"
                [value]="selectedPostForShare.shareUrl"
                readonly
                class="w-full px-4 py-3 text-gray-600 bg-gray-50 rounded-xl pr-24"
              />
              <button
                (click)="copyShareLink(selectedPostForShare.shareUrl)"
                class="absolute right-2 top-2 px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {{ linkCopied ? 'Copied!' : 'Copy Link' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Comment Panel -->
      <app-comment-panel
        [isOpen]="selectedPostForComments !== null"
        [post]="selectedPostForComments!"
        (close)="closeComments()"
        *ngIf="selectedPostForComments"
      ></app-comment-panel>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .min-h-screen {
        margin-top: 100px;
      }

      @keyframes like-pop {
        0% {
          transform: scale(0);
          opacity: 0;
        }
        50% {
          transform: scale(1.5);
          opacity: 1;
        }
        100% {
          transform: scale(1);
          opacity: 0;
        }
      }

      .animate-like-pop {
        animation: like-pop 0.5s ease-out forwards;
      }
    `,
  ],
})
export class QuickPostComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('videoInput') videoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('cropCanvas') cropCanvas!: ElementRef<HTMLCanvasElement>;

  showModal = false;
  showCropModal = false;
  postText = '';
  selectedTags: string[] = [];
  posts$: Observable<Post[]>;
  selectedMedia: MediaItem | null = null;
  currentCropIndex: number = -1;
  currentImageIndex: { [postId: string]: number } = {};
  selectedPostForShare: Post | null = null;
  shareOptions: ShareOption[] = [];
  showLikeAnimation: { [key: string]: boolean } = {};
  linkCopied = false;
  likeDebounce: { [key: string]: any } = {};
  selectedPostForComments: Post | null = null;

  commonTags: string[] = [
    'Breakfast',
    'Lunch',
    'Dinner',
    'Snacks',
    'Vegetarian',
    'Vegan',
    'Quick',
    'Easy',
  ];

  currentUser$: Observable<UserProfile>;
  avatarUrl$: Observable<string>;

  constructor(
    private quickPostService: QuickPostService,
    private userService: UserService,
    private sanitizer: DomSanitizer
  ) {
    this.posts$ = this.quickPostService.getPosts();
    this.shareOptions = this.quickPostService.getShareOptions();
    this.currentUser$ = this.userService.getCurrentUser();
    this.avatarUrl$ = this.userService.getAvatarUrl();
  }

  ngOnInit(): void {}

  async compressImage(file: File): Promise<Blob> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;

          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          const maxDimension = 1200;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height * maxDimension) / width;
              width = maxDimension;
            } else {
              width = (width * maxDimension) / height;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              resolve(blob!);
            },
            'image/jpeg',
            0.8
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  async validateVideo(
    file: File
  ): Promise<{ valid: boolean; duration?: number }> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration;
        resolve({
          valid: duration >= 1 && duration <= 15,
          duration: duration,
        });
      };

      video.onerror = () => {
        resolve({ valid: false });
      };

      video.src = URL.createObjectURL(file);
    });
  }

  async onVideoSelected(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Please upload video files only');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('Video size should not exceed 50MB');
      return;
    }

    const validation = await this.validateVideo(file);
    if (!validation.valid) {
      alert('Video duration must be between 1 and 15 seconds');
      return;
    }

    // Create video thumbnail
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);

    // Set current time to 1 second to ensure we get a good thumbnail
    video.currentTime = 1;

    video.addEventListener('loadeddata', () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      const thumbnail = canvas.toDataURL('image/jpeg');

      // Convert video to base64 immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        this.selectedMedia = {
          type: 'video',
          content: {
            file: file,
            preview: thumbnail,
            duration: validation.duration!,
          },
        };
      };
      reader.readAsDataURL(file);

      URL.revokeObjectURL(video.src);
    });
  }

  async onImagesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const files = Array.from(input.files);
    const currentImages =
      this.selectedMedia?.type === 'image'
        ? (this.selectedMedia.content as ImageItem[])
        : [];

    // Check if adding new files would exceed the 4 image limit
    if (currentImages.length + files.length > 4) {
      alert('You can only upload up to 4 images');
      input.value = '';
      return;
    }

    // Process each image
    const newImages: ImageItem[] = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;

      try {
        const compressedBlob = await this.compressImage(file);
        const compressedFile = new File([compressedBlob], file.name, {
          type: file.type,
        });

        newImages.push({
          file: compressedFile,
          preview: URL.createObjectURL(compressedFile),
        });
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }

    // Combine with existing images if any
    const allImages = [...currentImages, ...newImages].slice(0, 4);

    this.selectedMedia = {
      type: 'image',
      content: allImages,
      id: Date.now().toString(),
    };

    // Reset input
    input.value = '';
  }

  removeMedia(): void {
    this.selectedMedia = null;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
    if (this.videoInput) this.videoInput.nativeElement.value = '';
  }

  openCropModal(): void {
    this.currentCropIndex = 0;
    this.showCropModal = true;
    this.initCropCanvas();
  }

  initCropCanvas(): void {
    const canvas = this.cropCanvas.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };

    if (this.selectedMedia?.type === 'image') {
      img.src = (this.selectedMedia.content as ImageItem[])[
        this.currentCropIndex
      ].preview;
    }
  }

  rotateCrop(degrees: number): void {
    const canvas = this.cropCanvas.nativeElement;
    const ctx = canvas.getContext('2d')!;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;

    tempCanvas.width = canvas.height;
    tempCanvas.height = canvas.width;

    tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
    tempCtx.rotate((degrees * Math.PI) / 180);
    tempCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

    canvas.width = tempCanvas.width;
    canvas.height = tempCanvas.height;
    ctx.drawImage(tempCanvas, 0, 0);
  }

  resetCrop(): void {
    this.initCropCanvas();
  }

  applyCrop(): void {
    if (!this.selectedMedia || this.selectedMedia.type !== 'image') return;

    const canvas = this.cropCanvas.nativeElement;
    const images = this.selectedMedia.content as ImageItem[];
    images[this.currentCropIndex].croppedPreview = canvas.toDataURL(
      'image/jpeg',
      0.8
    );
    this.showCropModal = false;
  }

  get isValidPost(): boolean {
    return (
      this.postText.trim().length > 0 ||
      (this.selectedMedia?.type === 'image' &&
        (this.selectedMedia.content as ImageItem[]).length > 0) ||
      (this.selectedMedia?.type === 'video' && !!this.selectedMedia.content)
    );
  }

  async submitPost(): Promise<void> {
    if (!this.isValidPost) return;

    const post: Partial<Post> = {
      text: this.postText.trim(),
      tags: this.selectedTags,
    };

    if (this.selectedMedia) {
      if (this.selectedMedia.type === 'image') {
        const images = this.selectedMedia.content as ImageItem[];
        post.images = images.map((img) => img.croppedPreview || img.preview);
      } else if (this.selectedMedia.type === 'video') {
        const video = this.selectedMedia.content as VideoItem;
        post.video = {
          url: URL.createObjectURL(video.file),
          thumbnail: video.preview,
          duration: video.duration,
        };
      }
    }

    this.quickPostService.addPost(post);
    this.resetForm();
    this.showModal = false;
  }

  resetForm(): void {
    this.postText = '';
    this.selectedTags = [];
    this.selectedMedia = null;
    this.showModal = false;
  }

  deletePost(postId: string): void {
    this.quickPostService.deletePost(postId);
  }

  likePost(postId: string): void {
    // Prevent multiple rapid likes
    if (this.likeDebounce[postId]) {
      clearTimeout(this.likeDebounce[postId]);
    }

    this.likeDebounce[postId] = setTimeout(() => {
      this.quickPostService.likePost(postId);
      this.showLikeAnimation[postId] = true;

      // Remove animation after it completes
      setTimeout(() => {
        this.showLikeAnimation[postId] = false;
      }, 500);
    }, 300);
  }

  formatDate(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  toggleTag(tag: string): void {
    const index = this.selectedTags.indexOf(tag);
    if (index === -1) {
      this.selectedTags.push(tag);
    } else {
      this.selectedTags.splice(index, 1);
    }
  }

  previousImage(post: Post): void {
    const currentIndex = this.currentImageIndex[post.id] || 0;
    if (post.images && currentIndex > 0) {
      this.currentImageIndex[post.id] = currentIndex - 1;
    }
  }

  nextImage(post: Post): void {
    const currentIndex = this.currentImageIndex[post.id] || 0;
    if (post.images && currentIndex < post.images.length - 1) {
      this.currentImageIndex[post.id] = currentIndex + 1;
    }
  }

  setCurrentImage(postId: string, index: number): void {
    this.currentImageIndex[postId] = index;
  }

  getImagePreview(): string {
    if (!this.selectedMedia || this.selectedMedia.type !== 'image') return '';
    const images = this.selectedMedia.content as ImageItem[];
    const index = this.selectedMedia.id
      ? this.currentImageIndex[this.selectedMedia.id] || 0
      : 0;
    return images[index].croppedPreview || images[index].preview;
  }

  getVideoThumbnail(): string {
    if (!this.selectedMedia || this.selectedMedia.type !== 'video') return '';
    return (this.selectedMedia.content as VideoItem).preview;
  }

  getVideoDuration(): string {
    if (!this.selectedMedia || this.selectedMedia.type !== 'video') return '0';
    return (this.selectedMedia.content as VideoItem).duration.toFixed(1);
  }

  sanitizeVideoUrl(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  openShareModal(post: Post): void {
    this.selectedPostForShare = post;
    this.linkCopied = false;
  }

  closeShareModal(): void {
    this.selectedPostForShare = null;
  }

  async handleShare(option: ShareOption, post: Post): Promise<void> {
    if (option.action === 'copy') {
      await this.copyShareLink(post.shareUrl || '');
      return;
    }

    let shareUrl = '';
    const text = encodeURIComponent(`Check out this recipe: ${post.text}`);
    const url = encodeURIComponent(post.shareUrl || window.location.href);

    switch (option.id) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${text}%20${url}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      this.quickPostService.sharePost(post.id);
      this.closeShareModal();
    }
  }

  async copyShareLink(url: string | undefined): Promise<void> {
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      this.linkCopied = true;
      setTimeout(() => {
        this.linkCopied = false;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  }

  hasUserLikedPost(postId: string): boolean {
    return this.quickPostService.hasUserLikedPost(postId);
  }

  openComments(post: Post): void {
    this.selectedPostForComments = post;
  }

  closeComments(): void {
    this.selectedPostForComments = null;
  }

  removeImage(index: number): void {
    if (
      !this.selectedMedia ||
      this.selectedMedia.type !== 'image' ||
      !this.isImageContent(this.selectedMedia.content)
    )
      return;

    const newImages = this.selectedMedia.content.filter((_, i) => i !== index);

    if (newImages.length === 0) {
      this.selectedMedia = null;
    } else {
      this.selectedMedia = {
        type: 'image',
        content: newImages,
        id: this.selectedMedia.id,
      };
    }
  }

  getImageCount(): number {
    if (
      !this.selectedMedia ||
      this.selectedMedia.type !== 'image' ||
      !this.isImageContent(this.selectedMedia.content)
    )
      return 0;
    return this.selectedMedia.content.length;
  }

  getVideoPreview(): string {
    if (
      !this.selectedMedia ||
      this.selectedMedia.type !== 'video' ||
      !this.isVideoContent(this.selectedMedia.content)
    )
      return '';
    return URL.createObjectURL(this.selectedMedia.content.file);
  }

  isImageContent(content: ImageItem[] | VideoItem): content is ImageItem[] {
    return Array.isArray(content);
  }

  isVideoContent(content: ImageItem[] | VideoItem): content is VideoItem {
    return !Array.isArray(content);
  }
}
