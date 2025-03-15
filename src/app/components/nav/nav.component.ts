import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService, UserProfile } from '../../services/user.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <!-- Left side -->
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <a
                routerLink="/"
                class="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
              >
                MealFlow
              </a>
            </div>
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <a
                routerLink="/recipes"
                routerLinkActive="border-indigo-500 text-gray-900"
                [routerLinkActiveOptions]="{ exact: true }"
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Recipes
              </a>
              <a
                routerLink="/meal-plan"
                routerLinkActive="border-indigo-500 text-gray-900"
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Meal Plan
              </a>
              <a
                routerLink="/community"
                routerLinkActive="border-indigo-500 text-gray-900"
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Community
              </a>
            </div>
          </div>

          <!-- Right side -->
          <div class="flex items-center">
            <!-- User Menu -->
            <div class="ml-3 relative">
              <div>
                <a
                  routerLink="/profile"
                  class="flex items-center gap-3 max-w-xs bg-white rounded-full hover:bg-gray-50 p-1 transition-colors group"
                >
                  <div
                    class="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-0.5"
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
                        <i class="fas fa-user text-indigo-600"></i>
                      </div>
                    </div>
                  </div>
                  <span class="text-sm text-gray-700 group-hover:text-gray-900">
                    {{ (currentUser$ | async)?.username }}
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `,
})
export class NavComponent {
  currentUser$: Observable<UserProfile>;

  constructor(private userService: UserService) {
    this.currentUser$ = this.userService.getCurrentUser();
  }
}
