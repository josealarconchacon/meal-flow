import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  UserService,
  UserProfile,
  SocialMedia,
} from '../../services/user.service';
import { QuickPostService, Post } from '../../services/quick-post.service';
import { Observable, map, take, switchMap, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <!-- Profile Header -->
      <div class="relative">
        <!-- Cover Image -->
        <div
          class="h-64 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
        ></div>

        <!-- Profile Info Container -->
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="relative -mt-32 pb-12">
            <!-- Profile Card -->
            <div class="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
              <div
                class="flex flex-col items-center sm:flex-row sm:items-start gap-6"
              >
                <!-- Avatar Section -->
                <div class="relative group">
                  <div
                    class="h-40 w-40 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1 shadow-lg"
                  >
                    <div
                      class="h-full w-full rounded-2xl bg-white overflow-hidden"
                    >
                      <img
                        *ngIf="(profileUser$ | async)?.avatarUrl"
                        [src]="(profileUser$ | async)?.avatarUrl"
                        [alt]="(profileUser$ | async)?.username"
                        class="h-full w-full object-cover"
                      />
                      <div
                        *ngIf="!(profileUser$ | async)?.avatarUrl"
                        class="h-full w-full flex items-center justify-center bg-gray-50"
                      >
                        <i class="fas fa-user text-4xl text-gray-300"></i>
                      </div>
                    </div>
                  </div>
                  <!-- Edit Avatar Button -->
                  <button
                    *ngIf="!isEditing"
                    (click)="avatarInput.click()"
                    class="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-200"
                  >
                    <i class="fas fa-camera text-white text-2xl"></i>
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
                <div class="flex-1 text-center sm:text-left">
                  <div
                    class="flex flex-col sm:flex-row items-center sm:justify-between gap-4 mb-4"
                  >
                    <div>
                      <h1 class="text-3xl font-bold text-gray-900 mb-2">
                        {{ (profileUser$ | async)?.username }}
                      </h1>
                      <div
                        class="flex items-center gap-6 text-sm text-gray-600"
                      >
                        <div class="flex items-center gap-2">
                          <span class="font-semibold">{{
                            followersCount$ | async
                          }}</span>
                          <span>Followers</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <span class="font-semibold">{{
                            followingCount$ | async
                          }}</span>
                          <span>Following</span>
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center gap-4">
                      <button
                        *ngIf="userId && userId !== (profileUser$ | async)?.id"
                        (click)="toggleFollow()"
                        class="px-6 py-2 rounded-full text-sm font-medium transition-all duration-200"
                        [class.bg-blue-500]="!(isFollowing$ | async)"
                        [class.hover:bg-blue-600]="!(isFollowing$ | async)"
                        [class.bg-gray-200]="isFollowing$ | async"
                        [class.hover:bg-gray-300]="isFollowing$ | async"
                        [class.text-white]="!(isFollowing$ | async)"
                        [class.text-gray-800]="isFollowing$ | async"
                      >
                        {{ (isFollowing$ | async) ? 'Following' : 'Follow' }}
                      </button>
                      <button
                        *ngIf="!userId || userId === (profileUser$ | async)?.id"
                        (click)="isEditing = true"
                        class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 group"
                      >
                        <i
                          class="fas fa-edit mr-2 group-hover:scale-110 transition-transform duration-200"
                        ></i>
                        Edit Profile
                      </button>
                    </div>
                  </div>
                  <p
                    *ngIf="(profileUser$ | async)?.bio"
                    class="text-lg text-gray-600 mb-6"
                  >
                    {{ (profileUser$ | async)?.bio }}
                  </p>

                  <!-- Social Links -->
                  <div
                    *ngIf="(profileUser$ | async)?.socialMedia?.length"
                    class="flex flex-wrap items-center gap-4"
                  >
                    <a
                      *ngFor="let social of (profileUser$ | async)?.socialMedia"
                      [href]="social.url"
                      target="_blank"
                      class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 group"
                    >
                      <i
                        [class]="
                          'fab fa-' +
                          social.platform +
                          ' mr-2 text-lg group-hover:scale-110 transition-transform duration-200'
                        "
                      ></i>
                      {{ social.platform | titlecase }}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <!-- Edit Profile Modal -->
            <div
              *ngIf="isEditing"
              class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
              (click)="isEditing = false"
            >
              <div
                class="w-full max-w-2xl bg-white rounded-2xl shadow-xl mx-4 transform transition-all duration-300"
                (click)="$event.stopPropagation()"
              >
                <!-- Modal Header -->
                <div class="p-6 border-b border-gray-100">
                  <div class="flex items-center justify-between">
                    <h2 class="text-xl font-bold text-gray-900">
                      Edit Profile
                    </h2>
                    <button
                      (click)="isEditing = false"
                      class="text-gray-400 hover:text-gray-500 transition-colors duration-200"
                    >
                      <i class="fas fa-times text-xl"></i>
                    </button>
                  </div>
                </div>

                <!-- Modal Content -->
                <div class="p-6">
                  <form (ngSubmit)="saveProfile()" class="space-y-6">
                    <!-- Avatar Section -->
                    <div class="flex items-center space-x-6">
                      <div class="relative group">
                        <div
                          class="h-24 w-24 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1"
                        >
                          <div
                            class="h-full w-full rounded-2xl bg-white overflow-hidden"
                          >
                            <img
                              *ngIf="(profileUser$ | async)?.avatarUrl"
                              [src]="(profileUser$ | async)?.avatarUrl"
                              [alt]="(profileUser$ | async)?.username"
                              class="h-full w-full object-cover"
                            />
                            <div
                              *ngIf="!(profileUser$ | async)?.avatarUrl"
                              class="h-full w-full flex items-center justify-center bg-gray-50"
                            >
                              <i class="fas fa-user text-2xl text-gray-300"></i>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          (click)="avatarInput.click()"
                          class="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-200"
                        >
                          <i class="fas fa-camera text-white text-xl"></i>
                        </button>
                      </div>
                      <div>
                        <h3 class="text-sm font-medium text-gray-700">
                          Profile Photo
                        </h3>
                        <p class="text-sm text-gray-500 mt-1">
                          Click the image to update your profile photo
                        </p>
                      </div>
                    </div>

                    <!-- Username Section -->
                    <div>
                      <label
                        for="username"
                        class="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Username
                      </label>
                      <input
                        id="username"
                        type="text"
                        [(ngModel)]="editForm.username"
                        name="username"
                        required
                        class="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    <!-- Bio Section -->
                    <div>
                      <label
                        for="bio"
                        class="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Bio
                      </label>
                      <textarea
                        id="bio"
                        [(ngModel)]="editForm.bio"
                        name="bio"
                        rows="4"
                        class="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none"
                        placeholder="Tell your story..."
                      ></textarea>
                    </div>

                    <!-- Social Media Section -->
                    <div>
                      <div class="flex items-center justify-between mb-4">
                        <label class="text-sm font-medium text-gray-700"
                          >Social Media Links</label
                        >
                        <button
                          type="button"
                          *ngIf="availablePlatforms.length > 0"
                          (click)="showAddSocialModal = true"
                          class="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-all duration-200 group"
                        >
                          <i
                            class="fas fa-plus mr-2 group-hover:scale-110 transition-transform duration-200"
                          ></i>
                          Add Link
                        </button>
                      </div>

                      <!-- Existing Social Links -->
                      <div class="space-y-3">
                        <div
                          *ngFor="let social of editForm.socialMedia || []"
                          class="flex items-center gap-4 p-4 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-all duration-200"
                        >
                          <i
                            [class]="
                              'fab fa-' +
                              social.platform +
                              ' text-xl text-gray-400 group-hover:text-gray-600 transition-colors duration-200'
                            "
                          ></i>
                          <input
                            type="text"
                            [(ngModel)]="social.url"
                            [name]="'social-' + social.platform"
                            class="flex-1 bg-transparent border-0 focus:ring-0 p-0 text-gray-900"
                            [placeholder]="social.platform + ' profile URL'"
                          />
                          <button
                            type="button"
                            (click)="removeSocialMedia(social.platform)"
                            class="text-gray-400 hover:text-red-500 transition-colors duration-200"
                            title="Remove link"
                          >
                            <i class="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Form Actions -->
                    <div class="flex justify-end gap-4">
                      <button
                        type="button"
                        (click)="isEditing = false"
                        class="px-6 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        class="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all duration-200"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <!-- Content Tabs -->
            <div class="mt-6">
              <div class="flex border-b border-gray-200">
                <button
                  *ngFor="let tab of tabs"
                  (click)="activeTab = tab.id"
                  class="px-6 py-3 text-sm font-medium relative transition-colors duration-200"
                  [class.text-indigo-600]="activeTab === tab.id"
                  [class.text-gray-500]="activeTab !== tab.id"
                  [class.hover:text-indigo-600]="activeTab !== tab.id"
                >
                  <i [class]="tab.icon" class="mr-2"></i>
                  {{ tab.label }}
                  <div
                    class="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 transform origin-left transition-transform duration-200"
                    [class.scale-x-100]="activeTab === tab.id"
                    [class.scale-x-0]="activeTab !== tab.id"
                  ></div>
                </button>
              </div>

              <!-- Tab Content -->
              <div class="py-8">
                <!-- Posts Tab -->
                <div *ngIf="activeTab === 'posts'" class="space-y-6">
                  <article
                    *ngFor="let post of userPosts$ | async"
                    class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md"
                  >
                    <div class="p-6">
                      <div class="flex items-center gap-4 mb-4">
                        <div class="flex-shrink-0">
                          <div
                            class="h-12 w-12 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-0.5"
                          >
                            <div
                              class="h-full w-full rounded-xl bg-white overflow-hidden"
                            >
                              <img
                                *ngIf="(profileUser$ | async)?.avatarUrl"
                                [src]="(profileUser$ | async)?.avatarUrl"
                                [alt]="post.username"
                                class="h-full w-full object-cover"
                              />
                              <div
                                *ngIf="!(profileUser$ | async)?.avatarUrl"
                                class="h-full w-full flex items-center justify-center bg-gray-50"
                              >
                                <i class="fas fa-user text-gray-300"></i>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 class="font-medium text-gray-900">
                            {{ post.username }}
                          </h3>
                          <time class="text-sm text-gray-500">{{
                            formatDate(post.timestamp)
                          }}</time>
                        </div>
                      </div>

                      <p class="text-gray-900 mb-4">{{ post.text }}</p>

                      <!-- Post Media -->
                      <div
                        *ngIf="
                          post.images?.length ||
                          (post.video?.url && post.video?.thumbnail)
                        "
                        class="rounded-xl overflow-hidden mb-4"
                      >
                        <ng-container
                          *ngIf="post.images && post.images.length > 0"
                        >
                          <img
                            [src]="post.images[0] || ''"
                            alt="Post image"
                            class="w-full h-64 object-cover"
                          />
                        </ng-container>
                        <ng-container
                          *ngIf="post.video?.url && post.video?.thumbnail"
                        >
                          <video
                            [attr.poster]="post.video?.thumbnail"
                            controls
                            class="w-full"
                          >
                            <source
                              [attr.src]="post.video?.url"
                              type="video/mp4"
                            />
                          </video>
                        </ng-container>
                      </div>

                      <!-- Post Stats -->
                      <div
                        class="flex items-center gap-6 text-sm text-gray-500"
                      >
                        <button
                          class="flex items-center gap-2 hover:text-red-500 transition-colors duration-200"
                          [class.text-red-500]="
                            post.likedBy.includes(
                              (profileUser$ | async)?.id || ''
                            )
                          "
                        >
                          <i class="fas fa-heart"></i>
                          <span>{{ post.likes }}</span>
                        </button>
                        <button
                          class="flex items-center gap-2 hover:text-indigo-500 transition-colors duration-200"
                        >
                          <i class="fas fa-comment"></i>
                          <span>{{ post.comments.length }}</span>
                        </button>
                        <button
                          class="flex items-center gap-2 hover:text-indigo-500 transition-colors duration-200"
                        >
                          <i class="fas fa-share"></i>
                          <span>{{ post.shares }}</span>
                        </button>
                      </div>
                    </div>
                  </article>

                  <!-- Empty State -->
                  <div
                    *ngIf="(userPosts$ | async)?.length === 0"
                    class="text-center py-12 px-4 bg-white rounded-2xl border border-gray-100"
                  >
                    <div
                      class="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-indigo-50"
                    >
                      <i class="fas fa-feather text-2xl text-indigo-500"></i>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">
                      No posts yet
                    </h3>
                    <p class="text-gray-500">
                      Share your first recipe with the community!
                    </p>
                  </div>
                </div>

                <!-- Likes Tab -->
                <div *ngIf="activeTab === 'liked'" class="space-y-6">
                  <article
                    *ngFor="let post of likedPosts$ | async"
                    class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md"
                  >
                    <!-- Same post content structure as above -->
                  </article>

                  <!-- Empty State -->
                  <div
                    *ngIf="(likedPosts$ | async)?.length === 0"
                    class="text-center py-12 px-4 bg-white rounded-2xl border border-gray-100"
                  >
                    <div
                      class="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-pink-50"
                    >
                      <i class="fas fa-heart text-2xl text-pink-500"></i>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">
                      No liked posts
                    </h3>
                    <p class="text-gray-500">
                      Start exploring and liking posts from the community!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Social Media Modal -->
      <div
        *ngIf="showAddSocialModal"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center"
        (click)="showAddSocialModal = false"
      >
        <div
          class="w-full max-w-md bg-white rounded-2xl shadow-xl mx-4 transform transition-all duration-300"
          (click)="$event.stopPropagation()"
        >
          <div class="p-6 border-b border-gray-100">
            <h2 class="text-xl font-bold text-gray-900">
              Add Social Media Profile
            </h2>
          </div>
          <div class="p-6 space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Platform</label
              >
              <select
                [(ngModel)]="newSocialMedia.platform"
                class="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
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
                class="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                [placeholder]="
                  'Enter your ' +
                  (newSocialMedia.platform || 'social media') +
                  ' profile URL'
                "
              />
            </div>
          </div>
          <div
            class="flex justify-end gap-4 p-6 border-t border-gray-100 bg-gray-50"
          >
            <button
              (click)="showAddSocialModal = false"
              class="px-6 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              (click)="addSocialMedia()"
              [disabled]="!newSocialMedia.platform || !newSocialMedia.url"
              class="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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

      /* Smooth scroll behavior */
      .smooth-scroll {
        scroll-behavior: smooth;
      }

      /* Custom scrollbar */
      ::-webkit-scrollbar {
        width: 8px;
      }

      ::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
      }

      ::-webkit-scrollbar-thumb {
        background: #ddd;
        border-radius: 4px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: #ccc;
      }

      /* Fade in animation */
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .fade-in {
        animation: fadeIn 0.3s ease-in-out;
      }
    `,
  ],
})
export class UserProfileComponent implements OnInit {
  @ViewChild('avatarInput') avatarInput!: ElementRef<HTMLInputElement>;
  @Input() userId: string | undefined;

  currentUser$: Observable<UserProfile>;
  profileUser$: Observable<UserProfile> = new Observable<UserProfile>();
  userPosts$: Observable<Post[]> = new Observable<Post[]>();
  likedPosts$: Observable<Post[]> = new Observable<Post[]>();
  isFollowing$: Observable<boolean> = new Observable<boolean>();
  followersCount$: Observable<number> = new Observable<number>();
  followingCount$: Observable<number> = new Observable<number>();
  isOwnProfile: boolean = false;

  tabs = [
    { id: 'posts', label: 'Posts', icon: 'fas fa-utensils' },
    { id: 'liked', label: 'Liked', icon: 'fas fa-heart' },
  ];
  activeTab = this.tabs[0].id;

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
  }

  ngOnInit() {
    // Initialize the profile we're viewing
    if (this.userId) {
      // If we're viewing someone else's profile
      this.profileUser$ = this.userService.getUserProfile(this.userId);
      this.isFollowing$ = this.userService.isFollowing(this.userId);
      this.followersCount$ = this.userService.getFollowersCount(this.userId);
      this.followingCount$ = this.userService.getFollowingCount(this.userId);

      // Check if this is our own profile
      this.currentUser$.pipe(take(1)).subscribe((currentUser) => {
        this.isOwnProfile = currentUser.id === this.userId;
      });

      // Get posts for the profile we're viewing
      this.userPosts$ = this.quickPostService.getUserPostsByUserId(this.userId);
      this.likedPosts$ = this.quickPostService.getLikedPostsByUserId(
        this.userId
      );
    } else {
      // If no userId provided, show current user's profile
      this.profileUser$ = this.currentUser$;
      this.isOwnProfile = true;
      this.userPosts$ = this.quickPostService.getUserPosts();
      this.likedPosts$ = this.quickPostService.getLikedPosts();
    }
  }

  getSocialMediaUrl(
    platform: SocialMedia['platform']
  ): Observable<string | undefined> {
    return this.profileUser$.pipe(
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

  async toggleFollow() {
    if (!this.userId) return;

    const isFollowing = await firstValueFrom(this.isFollowing$);
    if (isFollowing) {
      await this.userService.unfollowUser(this.userId);
    } else {
      await this.userService.followUser(this.userId);
    }
  }
}
