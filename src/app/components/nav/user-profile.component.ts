import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  UserService,
  UserProfile,
  SocialMedia,
} from '../../services/user.service';
import { QuickPostService, Post } from '../../services/quick-post.service';
import { Observable, map, take, switchMap } from 'rxjs';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <!-- Main Container -->
    <div class="min-h-screen bg-white">
      <!-- Hero Section -->
      <div
        class="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200"
      >
        <div class="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div class="max-w-3xl mx-auto text-center">
            <!-- Avatar -->
            <div class="relative inline-block group mb-8">
              <div
                class="h-32 w-32 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-0.5"
              >
                <div
                  class="h-full w-full rounded-full bg-white overflow-hidden"
                >
                  <img
                    *ngIf="(currentUser$ | async)?.avatarUrl"
                    [src]="(currentUser$ | async)?.avatarUrl"
                    [alt]="(currentUser$ | async)?.username"
                    class="h-full w-full object-cover"
                  />
                  <div
                    *ngIf="!(currentUser$ | async)?.avatarUrl"
                    class="h-full w-full flex items-center justify-center"
                  >
                    <i class="fas fa-user text-4xl text-indigo-600"></i>
                  </div>
                </div>
              </div>
              <!-- Edit Avatar Button -->
              <button
                (click)="avatarInput.click()"
                class="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <i class="fas fa-camera text-white text-xl"></i>
              </button>
              <input
                #avatarInput
                type="file"
                accept="image/*"
                class="hidden"
                (change)="onAvatarSelected($event)"
              />
            </div>

            <!-- User Info -->
            <h1 class="text-4xl font-serif font-bold text-gray-900 mb-4">
              {{ (currentUser$ | async)?.username }}
            </h1>
            <p
              *ngIf="(currentUser$ | async)?.bio"
              class="text-xl text-gray-600 max-w-2xl mx-auto mb-8 font-serif"
            >
              {{ (currentUser$ | async)?.bio }}
            </p>

            <!-- Social Links -->
            <ng-container *ngIf="(currentUser$ | async)?.socialMedia?.length">
              <div class="flex items-center justify-center gap-6 mb-8">
                <ng-container
                  *ngFor="
                    let social of (currentUser$ | async)?.socialMedia || []
                  "
                >
                  <a
                    [href]="social.url"
                    target="_blank"
                    class="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <i [class]="'fab fa-' + social.platform + ' text-2xl'"></i>
                  </a>
                </ng-container>
              </div>
            </ng-container>

            <!-- Edit Profile Button -->
            <button
              (click)="isEditing = true"
              class="inline-flex items-center px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-full hover:bg-gray-50 hover:border-gray-400 transition-all group"
            >
              <i
                class="fas fa-edit mr-2 group-hover:scale-110 transition-transform"
              ></i>
              {{
                (currentUser$ | async)?.socialMedia?.length
                  ? 'Edit Profile'
                  : 'Add Social Links & Edit Profile'
              }}
            </button>
          </div>
        </div>
      </div>

      <!-- Content Section -->
      <div class="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="max-w-3xl mx-auto">
          <!-- Tabs -->
          <div
            class="flex border-b border-gray-200 mb-12 gap-12 justify-center"
          >
            <button
              *ngFor="let tab of tabs"
              (click)="currentTab = tab.id"
              class="pb-4 relative font-serif"
              [class.text-gray-900]="currentTab === tab.id"
              [class.text-gray-400]="currentTab !== tab.id"
            >
              <span class="text-lg">{{ tab.label }}</span>
              <div
                class="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 transform origin-left transition-transform duration-200"
                [class.scale-x-100]="currentTab === tab.id"
                [class.scale-x-0]="currentTab !== tab.id"
              ></div>
            </button>
          </div>

          <!-- Edit Profile Form -->
          <div
            *ngIf="isEditing"
            class="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm mb-12"
          >
            <h2 class="text-2xl font-serif font-bold text-gray-900 mb-6">
              Edit Profile
            </h2>
            <form (ngSubmit)="saveProfile()" class="space-y-6">
              <!-- Username -->
              <div>
                <label
                  for="username"
                  class="block text-sm font-medium text-gray-700 mb-2"
                  >Username</label
                >
                <input
                  id="username"
                  type="text"
                  [(ngModel)]="editForm.username"
                  name="username"
                  required
                  class="w-full px-4 py-3 text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all text-lg"
                />
              </div>

              <!-- Bio -->
              <div>
                <label
                  for="bio"
                  class="block text-sm font-medium text-gray-700 mb-2"
                  >Bio</label
                >
                <textarea
                  id="bio"
                  [(ngModel)]="editForm.bio"
                  name="bio"
                  rows="4"
                  class="w-full px-4 py-3 text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all text-lg font-serif"
                  placeholder="Tell your story..."
                ></textarea>
              </div>

              <!-- Social Media Links -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-4"
                  >Social Media Links</label
                >
                <div class="space-y-4">
                  <!-- Existing Social Links -->
                  <div
                    *ngFor="let social of editForm.socialMedia || []"
                    class="flex items-center gap-3"
                  >
                    <i
                      [class]="
                        'fab fa-' +
                        social.platform +
                        ' text-xl text-gray-400 w-8'
                      "
                    ></i>
                    <input
                      type="text"
                      [(ngModel)]="social.url"
                      [name]="'social-' + social.platform"
                      class="flex-1 px-4 py-2 text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all"
                      [placeholder]="social.platform + ' profile URL'"
                    />
                    <button
                      type="button"
                      (click)="removeSocialMedia(social.platform)"
                      class="text-red-500 hover:text-red-600 transition-colors p-2"
                      title="Remove link"
                    >
                      <i class="fas fa-times"></i>
                    </button>
                  </div>

                  <!-- Add New Social Link -->
                  <div *ngIf="availablePlatforms.length > 0" class="mt-4">
                    <button
                      type="button"
                      (click)="showAddSocialModal = true"
                      class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                    >
                      <i class="fas fa-plus mr-2"></i>
                      Add Social Link
                    </button>
                  </div>
                </div>
              </div>

              <!-- Form Actions -->
              <div class="flex justify-end gap-4 pt-6">
                <button
                  type="button"
                  (click)="isEditing = false"
                  class="px-6 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-6 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          <!-- Activity Tab -->
          <div
            *ngIf="currentTab === 'activity' && !isEditing"
            class="space-y-12"
          >
            <article
              *ngFor="let post of userPosts$ | async"
              class="border-b border-gray-100 pb-12 last:border-0"
            >
              <div class="mb-6">
                <time class="text-sm text-gray-500">{{
                  formatDate(post.timestamp)
                }}</time>
                <h2
                  class="text-2xl font-serif font-bold text-gray-900 mt-2 mb-4"
                >
                  {{ post.text }}
                </h2>
              </div>

              <!-- Post Media -->
              <ng-container *ngIf="post.images?.length || post.video">
                <div class="mb-6 rounded-xl overflow-hidden bg-gray-100">
                  <ng-container *ngIf="post.images && post.images.length > 0">
                    <img
                      [src]="post.images[0] || ''"
                      [alt]="'Post image'"
                      class="w-full h-[400px] object-cover"
                    />
                  </ng-container>
                  <ng-container
                    *ngIf="post.video?.url && post.video?.thumbnail"
                  >
                    <video
                      [poster]="post.video?.thumbnail || ''"
                      controls
                      class="w-full"
                    >
                      <source [src]="post.video?.url || ''" type="video/mp4" />
                    </video>
                  </ng-container>
                </div>
              </ng-container>

              <!-- Engagement Stats -->
              <div class="flex items-center gap-8 text-sm text-gray-500">
                <div class="flex items-center gap-2">
                  <i
                    class="fas fa-heart"
                    [class.text-red-500]="
                      post.likedBy.includes((currentUser$ | async)?.id || '')
                    "
                  ></i>
                  <span>{{ post.likes }} likes</span>
                </div>
                <div class="flex items-center gap-2">
                  <i class="fas fa-comment"></i>
                  <span>{{ post.comments.length }} comments</span>
                </div>
                <div class="flex items-center gap-2">
                  <i class="fas fa-share"></i>
                  <span>{{ post.shares }} shares</span>
                </div>
              </div>
            </article>

            <!-- Empty State -->
            <div
              *ngIf="(userPosts$ | async)?.length === 0"
              class="text-center py-12"
            >
              <div class="h-24 w-24 mx-auto text-gray-200 mb-6">
                <i class="fas fa-feather text-6xl"></i>
              </div>
              <h3 class="text-xl font-serif font-medium text-gray-900 mb-2">
                No posts yet
              </h3>
              <p class="text-gray-500">
                Share your first recipe with the community!
              </p>
            </div>
          </div>

          <!-- Likes Tab -->
          <div *ngIf="currentTab === 'likes' && !isEditing" class="space-y-12">
            <article
              *ngFor="let post of likedPosts$ | async"
              class="border-b border-gray-100 pb-12 last:border-0"
            >
              <!-- Author Info -->
              <div class="flex items-center gap-4 mb-6">
                <div
                  class="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-0.5"
                >
                  <div
                    class="h-full w-full rounded-full bg-white flex items-center justify-center"
                  >
                    <i class="fas fa-user text-indigo-600"></i>
                  </div>
                </div>
                <div>
                  <h3 class="font-medium text-gray-900">{{ post.username }}</h3>
                  <time class="text-sm text-gray-500">{{
                    formatDate(post.timestamp)
                  }}</time>
                </div>
              </div>

              <h2 class="text-2xl font-serif font-bold text-gray-900 mt-2 mb-4">
                {{ post.text }}
              </h2>

              <!-- Post Media -->
              <ng-container *ngIf="post.images?.length || post.video">
                <div class="mb-6 rounded-xl overflow-hidden bg-gray-100">
                  <ng-container *ngIf="post.images && post.images.length > 0">
                    <img
                      [src]="post.images[0] || ''"
                      [alt]="'Post image'"
                      class="w-full h-[400px] object-cover"
                    />
                  </ng-container>
                  <ng-container
                    *ngIf="post.video?.url && post.video?.thumbnail"
                  >
                    <video
                      [poster]="post.video?.thumbnail || ''"
                      controls
                      class="w-full"
                    >
                      <source [src]="post.video?.url || ''" type="video/mp4" />
                    </video>
                  </ng-container>
                </div>
              </ng-container>

              <!-- Engagement Stats -->
              <div class="flex items-center gap-8 text-sm text-gray-500">
                <div class="flex items-center gap-2">
                  <i class="fas fa-heart text-red-500"></i>
                  <span>{{ post.likes }} likes</span>
                </div>
                <div class="flex items-center gap-2">
                  <i class="fas fa-comment"></i>
                  <span>{{ post.comments.length }} comments</span>
                </div>
                <div class="flex items-center gap-2">
                  <i class="fas fa-share"></i>
                  <span>{{ post.shares }} shares</span>
                </div>
              </div>
            </article>

            <!-- Empty State -->
            <div
              *ngIf="(likedPosts$ | async)?.length === 0"
              class="text-center py-12"
            >
              <div class="h-24 w-24 mx-auto text-gray-200 mb-6">
                <i class="fas fa-heart text-6xl"></i>
              </div>
              <h3 class="text-xl font-serif font-medium text-gray-900 mb-2">
                No liked posts
              </h3>
              <p class="text-gray-500">
                Start exploring and liking posts from the community!
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Social Media Modal -->
      <div
        *ngIf="showAddSocialModal"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
        (click)="showAddSocialModal = false"
      >
        <div
          class="w-full max-w-md bg-white rounded-2xl shadow-xl mx-4"
          (click)="$event.stopPropagation()"
        >
          <div class="p-6 border-b border-gray-100">
            <h2 class="text-xl font-serif font-bold text-gray-900">
              Add Social Media Profile
            </h2>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >Platform</label
                >
                <select
                  [(ngModel)]="newSocialMedia.platform"
                  class="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all"
                >
                  <option value="">Select a platform</option>
                  <option
                    *ngFor="let platform of availablePlatforms"
                    [value]="platform"
                  >
                    {{ platform | titlecase }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >Profile URL</label
                >
                <input
                  type="text"
                  [(ngModel)]="newSocialMedia.url"
                  class="w-full px-4 py-3 text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all"
                  [placeholder]="
                    'Enter your ' +
                    (newSocialMedia.platform || 'social media') +
                    ' profile URL'
                  "
                />
              </div>
            </div>
          </div>
          <div
            class="flex justify-end gap-4 p-6 border-t border-gray-100 bg-gray-50"
          >
            <button
              (click)="showAddSocialModal = false"
              class="px-6 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              (click)="addSocialMedia()"
              [disabled]="!newSocialMedia.platform || !newSocialMedia.url"
              class="px-6 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
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

      /* Custom serif font for headings */
      .font-serif {
        font-family: 'Charter', Georgia, Cambria, 'Times New Roman', Times,
          serif;
      }
    `,
  ],
})
export class UserProfileComponent implements OnInit {
  @ViewChild('avatarInput') avatarInput!: ElementRef<HTMLInputElement>;

  currentUser$: Observable<UserProfile>;
  userPosts$: Observable<Post[]>;
  likedPosts$: Observable<Post[]>;

  tabs = [
    { id: 'activity', label: 'Posts' },
    { id: 'likes', label: 'Likes' },
  ];

  currentTab = 'activity';
  isEditing = false;
  editForm: Partial<UserProfile> = {};
  socialMediaPlatforms: SocialMedia['platform'][] = [
    'twitter',
    'facebook',
    'instagram',
    'linkedin',
  ];

  showAddSocialModal = false;
  newSocialMedia: Partial<SocialMedia> = {};

  constructor(
    private userService: UserService,
    private quickPostService: QuickPostService
  ) {
    this.currentUser$ = this.userService.getCurrentUser();

    // Get user's posts
    this.userPosts$ = this.currentUser$.pipe(
      switchMap((user) =>
        this.quickPostService
          .getPosts()
          .pipe(map((posts) => posts.filter((post) => post.userId === user.id)))
      )
    );

    // Get posts liked by user
    this.likedPosts$ = this.currentUser$.pipe(
      switchMap((user) =>
        this.quickPostService
          .getPosts()
          .pipe(
            map((posts) =>
              posts.filter((post) => post.likedBy.includes(user.id))
            )
          )
      )
    );
  }

  ngOnInit(): void {
    // Initialize edit form with current user data
    this.currentUser$.pipe(take(1)).subscribe((user) => {
      this.editForm = { ...user };
    });
  }

  getSocialMediaUrl(
    platform: SocialMedia['platform']
  ): Observable<string | undefined> {
    return this.currentUser$.pipe(
      map(
        (user) => user.socialMedia?.find((sm) => sm.platform === platform)?.url
      )
    );
  }

  async onAvatarSelected(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      await this.userService.updateAvatar(file);
      // Reset input
      this.avatarInput.nativeElement.value = '';
    } catch (error) {
      console.error('Failed to update avatar:', error);
    }
  }

  get availablePlatforms(): SocialMedia['platform'][] {
    const currentPlatforms = new Set(
      this.editForm.socialMedia?.map((s) => s.platform) || []
    );
    return this.socialMediaPlatforms.filter((p) => !currentPlatforms.has(p));
  }

  async addSocialMedia(): Promise<void> {
    if (!this.newSocialMedia.platform || !this.newSocialMedia.url) return;

    if (!this.editForm.socialMedia) {
      this.editForm.socialMedia = [];
    }

    this.editForm.socialMedia.push({
      platform: this.newSocialMedia.platform as SocialMedia['platform'],
      url: this.newSocialMedia.url,
    });

    this.showAddSocialModal = false;
    this.newSocialMedia = {};
  }

  removeSocialMedia(platform: SocialMedia['platform']): void {
    if (this.editForm.socialMedia) {
      this.editForm.socialMedia = this.editForm.socialMedia.filter(
        (s) => s.platform !== platform
      );
    }
  }

  async saveProfile(): Promise<void> {
    try {
      await this.userService.updateProfile(this.editForm);
      this.isEditing = false;
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
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
}
