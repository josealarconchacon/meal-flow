import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Recipe } from '../../models/recipe.model';
import { MealPlanService } from '../../services/meal-plan.service';

@Component({
  selector: 'app-recipe-detail-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="isOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-0 sm:p-4 overflow-y-auto overscroll-contain"
      (click)="closeModal()"
    >
      <div
        class="bg-white w-full min-h-screen sm:min-h-0 sm:rounded-lg sm:w-[95%] sm:max-w-4xl sm:my-8 relative overflow-hidden"
        (click)="$event.stopPropagation()"
      >
        <!-- Mobile Close Button - Fixed at top -->
        <button
          (click)="closeModal()"
          class="fixed sm:hidden right-4 top-4 z-50 bg-black/50 text-white rounded-full p-3 backdrop-blur-sm"
          aria-label="Close modal"
        >
          <i class="fas fa-times text-xl"></i>
        </button>

        <!-- Header with Image -->
        <div class="relative">
          <img
            [src]="recipe.imageUrl"
            [alt]="recipe.title"
            class="w-full h-48 sm:h-64 md:h-72 object-cover"
            loading="eager"
          />
          <div
            class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
          ></div>

          <!-- Desktop Close Button -->
          <button
            (click)="closeModal()"
            class="hidden sm:block absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/75 transition-all backdrop-blur-sm"
            aria-label="Close modal"
          >
            <i class="fas fa-times"></i>
          </button>

          <!-- Title overlay on image -->
          <div class="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
            <h2 class="text-2xl sm:text-3xl font-bold mb-2 text-shadow">
              {{ recipe.title }}
            </h2>
            <p
              class="text-sm sm:text-base text-gray-100 text-shadow-sm line-clamp-2"
            >
              {{ recipe.description }}
            </p>
          </div>
        </div>

        <!-- Content -->
        <div class="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
          <!-- Recipe Stats -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div class="bg-gray-50 rounded-xl p-3 sm:p-4 text-center">
              <i
                class="far fa-clock text-indigo-600 text-lg sm:text-xl mb-1 sm:mb-2"
              ></i>
              <p class="text-xs sm:text-sm text-gray-600">Prep Time</p>
              <p class="font-semibold text-sm sm:text-base">
                {{ recipe.prepTime }} min
              </p>
            </div>
            <div class="bg-gray-50 rounded-xl p-3 sm:p-4 text-center">
              <i
                class="fas fa-utensils text-indigo-600 text-lg sm:text-xl mb-1 sm:mb-2"
              ></i>
              <p class="text-xs sm:text-sm text-gray-600">Cook Time</p>
              <p class="font-semibold text-sm sm:text-base">
                {{ recipe.cookTime }} min
              </p>
            </div>
            <div class="bg-gray-50 rounded-xl p-3 sm:p-4 text-center">
              <i
                class="fas fa-users text-indigo-600 text-lg sm:text-xl mb-1 sm:mb-2"
              ></i>
              <p class="text-xs sm:text-sm text-gray-600">Servings</p>
              <p class="font-semibold text-sm sm:text-base">
                {{ recipe.servings }}
              </p>
            </div>
            <div class="bg-gray-50 rounded-xl p-3 sm:p-4 text-center">
              <i
                class="fas fa-chart-line text-indigo-600 text-lg sm:text-xl mb-1 sm:mb-2"
              ></i>
              <p class="text-xs sm:text-sm text-gray-600">Difficulty</p>
              <p class="font-semibold text-sm sm:text-base">
                {{ recipe.difficulty }}
              </p>
            </div>
          </div>

          <!-- Tags -->
          <div class="space-y-3">
            <h3 class="font-semibold text-base sm:text-lg">Tags</h3>
            <div class="flex flex-wrap gap-2">
              <span
                *ngFor="let tag of recipe.tags"
                class="px-3 py-1.5 bg-indigo-100 text-indigo-800 rounded-full text-xs sm:text-sm"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <!-- Two Column Layout for Ingredients and Instructions -->
          <div class="grid md:grid-cols-2 gap-6 sm:gap-8">
            <!-- Ingredients -->
            <div class="space-y-3 sm:space-y-4">
              <h3 class="font-semibold text-base sm:text-lg flex items-center">
                <i class="fas fa-shopping-basket text-indigo-600 mr-2"></i>
                Ingredients
              </h3>
              <ul class="space-y-2 sm:space-y-3">
                <li
                  *ngFor="let ingredient of recipe.ingredients"
                  class="flex items-start space-x-3 p-2 sm:p-3 hover:bg-gray-50 rounded-lg transition-colors touch-target"
                >
                  <i
                    class="fas fa-check-circle text-green-500 mt-1 text-sm sm:text-base"
                  ></i>
                  <span>
                    <span class="font-medium text-sm sm:text-base"
                      >{{ ingredient.amount }} {{ ingredient.unit }}</span
                    >
                    <span class="text-gray-700 text-sm sm:text-base">
                      {{ ingredient.name }}</span
                    >
                  </span>
                </li>
              </ul>
            </div>

            <!-- Instructions -->
            <div class="space-y-3 sm:space-y-4">
              <h3 class="font-semibold text-base sm:text-lg flex items-center">
                <i class="fas fa-list-ol text-indigo-600 mr-2"></i>
                Instructions
              </h3>
              <ol class="space-y-3 sm:space-y-4">
                <li
                  *ngFor="let instruction of recipe.instructions; let i = index"
                  class="flex space-x-3 sm:space-x-4 p-2 sm:p-3 hover:bg-gray-50 rounded-lg transition-colors touch-target"
                >
                  <span
                    class="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-medium text-sm"
                  >
                    {{ i + 1 }}
                  </span>
                  <p class="text-gray-700 text-sm sm:text-base flex-1">
                    {{ instruction }}
                  </p>
                </li>
              </ol>
            </div>
          </div>

          <!-- Add to Meal Plan Section -->
          <div
            class="pt-6 sm:pt-8 border-t border-gray-200 space-y-4 sm:space-y-6"
          >
            <h3 class="font-semibold text-base sm:text-lg">Add to Meal Plan</h3>

            <!-- Date Selection -->
            <div class="space-y-2 sm:space-y-3">
              <h4 class="text-xs sm:text-sm font-medium text-gray-700">
                Select Date
              </h4>
              <div
                class="flex flex-nowrap sm:flex-wrap gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar"
              >
                <button
                  *ngFor="let day of getNextSevenDays()"
                  (click)="selectDate(day.date)"
                  class="flex-shrink-0 px-4 py-2 rounded-lg text-sm transition-colors touch-target"
                  [class]="
                    selectedDate === day.date
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  "
                >
                  <span class="block font-medium whitespace-nowrap">{{
                    day.label
                  }}</span>
                </button>
              </div>
            </div>

            <!-- Meal Type Selection -->
            <div *ngIf="selectedDate" class="space-y-2 sm:space-y-3">
              <h4 class="text-xs sm:text-sm font-medium text-gray-700">
                Select Meal Type
              </h4>
              <div class="flex flex-wrap gap-2">
                <button
                  *ngFor="let meal of mealTypes"
                  (click)="selectMealType(meal)"
                  class="px-4 py-2 rounded-lg text-sm transition-colors touch-target"
                  [class]="
                    selectedMealType === meal
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  "
                >
                  {{ meal | titlecase }}
                </button>
              </div>
            </div>

            <!-- Add Button -->
            <button
              *ngIf="selectedDate && selectedMealType"
              (click)="addToMealPlan()"
              class="w-full py-3 sm:py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2 touch-target"
            >
              <i class="fas fa-plus"></i>
              <span>Add to {{ selectedMealType | titlecase }}</span>
            </button>
          </div>

          <!-- Bottom Actions -->
          <div class="flex justify-between items-center pt-4 sm:pt-6">
            <button
              (click)="toggleFavorite()"
              class="flex items-center space-x-2 text-red-500 hover:text-red-600 transition-colors touch-target"
            >
              <i
                [class]="recipe.isFavorite ? 'fas fa-heart' : 'far fa-heart'"
              ></i>
              <span class="text-sm sm:text-base">
                {{
                  recipe.isFavorite
                    ? 'Remove from Favorites'
                    : 'Add to Favorites'
                }}
              </span>
            </button>
            <button
              (click)="closeModal()"
              class="text-gray-600 hover:text-gray-800 transition-colors text-sm sm:text-base touch-target"
            >
              Close
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
      .text-shadow {
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
      .text-shadow-sm {
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }
      .touch-target {
        min-height: 44px;
        min-width: 44px;
      }
      .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      @media (max-width: 640px) {
        .grid-cols-2 {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class RecipeDetailModalComponent {
  @Input() isOpen = false;
  @Input() recipe!: Recipe;
  @Output() close = new EventEmitter<void>();
  @Output() favoriteToggled = new EventEmitter<string>();

  selectedDate: string = '';
  selectedMealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks' | '' = '';
  mealTypes: ('breakfast' | 'lunch' | 'dinner' | 'snacks')[] = [
    'breakfast',
    'lunch',
    'dinner',
    'snacks',
  ];

  constructor(private mealPlanService: MealPlanService) {}

  closeModal(): void {
    this.selectedDate = '';
    this.selectedMealType = '';
    this.close.emit();
  }

  toggleFavorite(): void {
    this.favoriteToggled.emit(this.recipe.id);
  }

  getNextSevenDays(): { date: string; label: string }[] {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return {
        date: date.toISOString(),
        label:
          i === 0
            ? 'Today'
            : i === 1
            ? 'Tomorrow'
            : date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              }),
      };
    });
  }

  selectDate(date: string): void {
    this.selectedDate = date;
  }

  selectMealType(type: 'breakfast' | 'lunch' | 'dinner' | 'snacks'): void {
    this.selectedMealType = type;
  }

  addToMealPlan(): void {
    if (this.selectedDate && this.selectedMealType) {
      this.mealPlanService.addRecipeToMealPlan(
        this.recipe.id,
        this.selectedDate,
        this.selectedMealType
      );
      this.closeModal();
    }
  }
}
