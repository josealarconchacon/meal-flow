import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MealPlanService } from '../../services/meal-plan.service';
import { RecipeService } from '../../services/recipe.service';
import { Recipe } from '../../models/recipe.model';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
} from '@angular/forms';

interface DayPlan {
  date: string;
  label: string;
  meals: {
    breakfast?: Recipe;
    lunch?: Recipe;
    dinner?: Recipe;
    snacks?: Recipe;
  };
}

@Component({
  selector: 'app-meal-plan',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="container mx-auto px-4 py-4 sm:py-8">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div
          class="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6"
        >
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900">Meal Plan</h1>
          <div class="flex items-center gap-2">
            <button
              (click)="previousWeek()"
              class="p-2 text-gray-600 hover:text-gray-900 touch-target"
              aria-label="Previous week"
            >
              <i class="fas fa-chevron-left"></i>
            </button>
            <span
              class="text-base sm:text-lg font-medium text-gray-700 min-w-[150px] text-center"
            >
              {{ getWeekRange() }}
            </span>
            <button
              (click)="nextWeek()"
              class="p-2 text-gray-600 hover:text-gray-900 touch-target"
              aria-label="Next week"
            >
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
          <button
            (click)="clearWeek()"
            class="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 touch-target"
          >
            Clear Week
          </button>
        </div>

        <!-- Weekly Calendar -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
          <!-- Mobile Day Selector -->
          <div class="block sm:hidden w-full overflow-x-auto">
            <div class="flex gap-2 pb-2">
              <button
                *ngFor="let day of weekPlan"
                class="flex-shrink-0 px-4 py-2 rounded-lg text-sm transition-colors"
                [class]="
                  day.date === selectedDate
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                "
                (click)="selectedDate = day.date"
              >
                <span class="font-medium">{{ day.label }}</span>
                <span class="text-xs block">{{ formatDate(day.date) }}</span>
              </button>
            </div>
          </div>

          <!-- Day Cards -->
          <ng-container *ngFor="let day of weekPlan">
            <div
              class="bg-white rounded-lg shadow-sm overflow-hidden"
              [class.hidden]="selectedDate && selectedDate !== day.date"
              [class.block]="!selectedDate || selectedDate === day.date"
            >
              <!-- Day Header - Visible on desktop or when selected on mobile -->
              <div class="text-center p-3 bg-gray-50 border-b border-gray-200">
                <div class="font-medium text-gray-900">{{ day.label }}</div>
                <div class="text-sm text-gray-500">
                  {{ formatDate(day.date) }}
                </div>
              </div>

              <!-- Meal Slots -->
              <div class="p-3 space-y-3">
                <!-- Breakfast -->
                <div class="meal-slot">
                  <h3 class="text-sm font-medium text-gray-500 mb-2">
                    Breakfast
                  </h3>
                  <div
                    *ngIf="day.meals.breakfast; else emptyBreakfast"
                    class="relative group"
                  >
                    <div
                      class="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div class="pr-8">
                        <!-- Added padding for remove button -->
                        <h4 class="font-medium text-gray-900 mb-1 line-clamp-1">
                          {{ day.meals.breakfast.title }}
                        </h4>
                        <p class="text-sm text-gray-600">
                          {{
                            day.meals.breakfast.prepTime +
                              day.meals.breakfast.cookTime
                          }}
                          min
                        </p>
                      </div>
                      <button
                        (click)="removeMeal(day.date, 'breakfast')"
                        class="absolute top-2 right-2 opacity-100 sm:opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-opacity touch-target"
                        aria-label="Remove breakfast"
                      >
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                  <ng-template #emptyBreakfast>
                    <div
                      (click)="openAddMeal(day.date, 'breakfast')"
                      class="p-3 border-2 border-dashed border-gray-200 rounded-lg text-center text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors cursor-pointer touch-target"
                    >
                      <i class="fas fa-plus mb-1"></i>
                      <div class="text-sm">Add Breakfast</div>
                    </div>
                  </ng-template>
                </div>

                <!-- Lunch -->
                <div class="meal-slot">
                  <h3 class="text-sm font-medium text-gray-500 mb-2">Lunch</h3>
                  <div
                    *ngIf="day.meals.lunch; else emptyLunch"
                    class="relative group"
                  >
                    <div
                      class="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div class="pr-8">
                        <h4 class="font-medium text-gray-900 mb-1 line-clamp-1">
                          {{ day.meals.lunch.title }}
                        </h4>
                        <p class="text-sm text-gray-600">
                          {{
                            day.meals.lunch.prepTime + day.meals.lunch.cookTime
                          }}
                          min
                        </p>
                      </div>
                      <button
                        (click)="removeMeal(day.date, 'lunch')"
                        class="absolute top-2 right-2 opacity-100 sm:opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-opacity touch-target"
                        aria-label="Remove lunch"
                      >
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                  <ng-template #emptyLunch>
                    <div
                      (click)="openAddMeal(day.date, 'lunch')"
                      class="p-3 border-2 border-dashed border-gray-200 rounded-lg text-center text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors cursor-pointer touch-target"
                    >
                      <i class="fas fa-plus mb-1"></i>
                      <div class="text-sm">Add Lunch</div>
                    </div>
                  </ng-template>
                </div>

                <!-- Dinner -->
                <div class="meal-slot">
                  <h3 class="text-sm font-medium text-gray-500 mb-2">Dinner</h3>
                  <div
                    *ngIf="day.meals.dinner; else emptyDinner"
                    class="relative group"
                  >
                    <div
                      class="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div class="pr-8">
                        <h4 class="font-medium text-gray-900 mb-1 line-clamp-1">
                          {{ day.meals.dinner.title }}
                        </h4>
                        <p class="text-sm text-gray-600">
                          {{
                            day.meals.dinner.prepTime +
                              day.meals.dinner.cookTime
                          }}
                          min
                        </p>
                      </div>
                      <button
                        (click)="removeMeal(day.date, 'dinner')"
                        class="absolute top-2 right-2 opacity-100 sm:opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-opacity touch-target"
                        aria-label="Remove dinner"
                      >
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                  <ng-template #emptyDinner>
                    <div
                      (click)="openAddMeal(day.date, 'dinner')"
                      class="p-3 border-2 border-dashed border-gray-200 rounded-lg text-center text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors cursor-pointer touch-target"
                    >
                      <i class="fas fa-plus mb-1"></i>
                      <div class="text-sm">Add Dinner</div>
                    </div>
                  </ng-template>
                </div>

                <!-- Snacks -->
                <div class="meal-slot">
                  <h3 class="text-sm font-medium text-gray-500 mb-2">Snacks</h3>
                  <div
                    *ngIf="day.meals.snacks; else emptySnacks"
                    class="relative group"
                  >
                    <div
                      class="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div class="pr-8">
                        <h4 class="font-medium text-gray-900 mb-1 line-clamp-1">
                          {{ day.meals.snacks.title }}
                        </h4>
                        <p class="text-sm text-gray-600">
                          {{
                            day.meals.snacks.prepTime +
                              day.meals.snacks.cookTime
                          }}
                          min
                        </p>
                      </div>
                      <button
                        (click)="removeMeal(day.date, 'snacks')"
                        class="absolute top-2 right-2 opacity-100 sm:opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-opacity touch-target"
                        aria-label="Remove snacks"
                      >
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                  <ng-template #emptySnacks>
                    <div
                      (click)="openAddMeal(day.date, 'snacks')"
                      class="p-3 border-2 border-dashed border-gray-200 rounded-lg text-center text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors cursor-pointer touch-target"
                    >
                      <i class="fas fa-plus mb-1"></i>
                      <div class="text-sm">Add Snacks</div>
                    </div>
                  </ng-template>
                </div>
              </div>
            </div>
          </ng-container>
        </div>
      </div>

      <!-- Recipe Selection/Creation Modal -->
      <div
        *ngIf="showRecipeModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-0 sm:p-4"
      >
        <div
          class="bg-white w-full sm:rounded-lg sm:w-[95%] sm:max-w-2xl max-h-screen sm:max-h-[80vh] overflow-y-auto overscroll-contain"
        >
          <div
            class="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center"
          >
            <h2 class="text-lg sm:text-xl font-bold">
              {{ isCreatingRecipe ? 'Create New Recipe' : 'Select Recipe' }}
            </h2>
            <button
              (click)="closeModal()"
              class="p-2 text-gray-500 hover:text-gray-700 touch-target"
              aria-label="Close modal"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="p-4 sm:p-6">
            <!-- Mode Toggle -->
            <div class="flex justify-center mb-6 bg-gray-100 rounded-lg p-1">
              <button
                (click)="isCreatingRecipe = false"
                [class]="!isCreatingRecipe ? 'bg-white shadow-sm' : ''"
                class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Select Existing
              </button>
              <button
                (click)="isCreatingRecipe = true"
                [class]="isCreatingRecipe ? 'bg-white shadow-sm' : ''"
                class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Create New
              </button>
            </div>

            <!-- Create New Recipe Form -->
            <div *ngIf="isCreatingRecipe" class="space-y-4">
              <form
                [formGroup]="recipeForm"
                (ngSubmit)="createRecipe()"
                class="space-y-4"
              >
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Left Column -->
                  <div class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700"
                        >Recipe Title</label
                      >
                      <input
                        type="text"
                        formControlName="title"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="Enter recipe title"
                      />
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700"
                        >Image URL</label
                      >
                      <input
                        type="url"
                        formControlName="imageUrl"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="Enter image URL"
                      />
                      <p class="mt-1 text-sm text-gray-500">
                        Provide a URL for your recipe image
                      </p>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700"
                        >Category</label
                      >
                      <select
                        formControlName="category"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="">Select category</option>
                        <option value="Breakfast">Breakfast</option>
                        <option value="Lunch">Lunch</option>
                        <option value="Dinner">Dinner</option>
                        <option value="Snacks">Snacks</option>
                      </select>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700"
                        >Description</label
                      >
                      <textarea
                        formControlName="description"
                        rows="3"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="Enter recipe description"
                      ></textarea>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700"
                          >Prep Time (min)</label
                        >
                        <input
                          type="number"
                          formControlName="prepTime"
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700"
                          >Cook Time (min)</label
                        >
                        <input
                          type="number"
                          formControlName="cookTime"
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700"
                          >Servings</label
                        >
                        <input
                          type="number"
                          formControlName="servings"
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700"
                          >Difficulty</label
                        >
                        <select
                          formControlName="difficulty"
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700"
                        >Tags</label
                      >
                      <input
                        type="text"
                        [ngModel]="tagInput"
                        (ngModelChange)="updateTags($event)"
                        [ngModelOptions]="{ standalone: true }"
                        placeholder="Add tags (comma-separated)"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      <div class="mt-2 flex flex-wrap gap-2">
                        <span
                          *ngFor="let tag of recipeForm.get('tags')?.value"
                          class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700"
                        >
                          {{ tag }}
                          <button
                            type="button"
                            (click)="removeTag(tag)"
                            class="ml-1 text-indigo-500 hover:text-indigo-600"
                          >
                            <i class="fas fa-times"></i>
                          </button>
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Right Column -->
                  <div class="space-y-4">
                    <div formArrayName="ingredients" class="space-y-2">
                      <label class="block text-sm font-medium text-gray-700"
                        >Ingredients</label
                      >
                      <div
                        *ngFor="
                          let ingredient of ingredients.controls;
                          let i = index
                        "
                        [formGroupName]="i"
                        class="flex gap-2"
                      >
                        <input
                          formControlName="name"
                          placeholder="Ingredient name"
                          class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <input
                          type="number"
                          formControlName="amount"
                          placeholder="Amount"
                          class="w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <input
                          formControlName="unit"
                          placeholder="Unit"
                          class="w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          (click)="removeIngredient(i)"
                          class="text-red-500 hover:text-red-700"
                        >
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                      <button
                        type="button"
                        (click)="addIngredient()"
                        class="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                      >
                        Add Ingredient
                      </button>
                    </div>

                    <div formArrayName="instructions" class="space-y-2">
                      <label class="block text-sm font-medium text-gray-700"
                        >Instructions</label
                      >
                      <div
                        *ngFor="
                          let instruction of instructions.controls;
                          let i = index
                        "
                        class="flex gap-2"
                      >
                        <input
                          [formControlName]="i"
                          placeholder="Enter instruction step"
                          class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          (click)="removeInstruction(i)"
                          class="text-red-500 hover:text-red-700"
                        >
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                      <button
                        type="button"
                        (click)="addInstruction()"
                        class="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                      >
                        Add Instruction
                      </button>
                    </div>
                  </div>
                </div>

                <div class="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    (click)="closeModal()"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    [disabled]="!recipeForm.valid"
                    class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                  >
                    Create Recipe
                    <span *ngIf="!recipeForm.valid" class="text-xs ml-1">
                      (Please fill all required fields)
                    </span>
                  </button>
                </div>
              </form>
            </div>

            <!-- Add validation messages -->
            <div *ngIf="!recipeForm.valid" class="mt-4 text-sm text-red-600">
              <div *ngIf="ingredients.length === 0">
                Please add at least one ingredient
              </div>
              <div *ngIf="instructions.length === 0">
                Please add at least one instruction
              </div>
              <div *ngIf="recipeForm.get('tags')?.value?.length === 0">
                Please add at least one tag
              </div>
              <div *ngIf="recipeForm.get('title')?.errors?.['required']">
                Title is required
              </div>
              <div *ngIf="recipeForm.get('description')?.errors?.['required']">
                Description is required
              </div>
              <div *ngIf="recipeForm.get('imageUrl')?.errors?.['required']">
                Image URL is required
              </div>
              <div *ngIf="recipeForm.get('category')?.errors?.['required']">
                Category is required
              </div>
            </div>

            <!-- Existing Recipe Selection -->
            <div *ngIf="!isCreatingRecipe">
              <div class="mb-4">
                <input
                  type="text"
                  [(ngModel)]="searchTerm"
                  (input)="filterRecipes()"
                  placeholder="Search recipes..."
                  class="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div class="grid grid-cols-1 gap-4">
                <div
                  *ngFor="let recipe of filteredRecipes"
                  (click)="selectRecipe(recipe)"
                  class="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <h3 class="font-medium">{{ recipe.title }}</h3>
                  <p class="text-sm text-gray-600">
                    {{ recipe.prepTime + recipe.cookTime }} min
                  </p>
                </div>
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
      .touch-target {
        min-height: 44px;
        min-width: 44px;
      }
      @media (max-width: 640px) {
        .meal-slot {
          min-height: 100px;
        }
      }
    `,
  ],
})
export class MealPlanComponent implements OnInit {
  weekPlan: DayPlan[] = [];
  currentWeekStart: Date = this.getStartOfWeek(new Date());
  showRecipeModal = false;
  selectedDate: string = '';
  selectedMealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks' | null = null;
  searchTerm: string = '';
  allRecipes: Recipe[] = [];
  filteredRecipes: Recipe[] = [];
  isCreatingRecipe = false;
  recipeForm: FormGroup;
  tagInput: string = '';

  constructor(
    private mealPlanService: MealPlanService,
    private recipeService: RecipeService,
    private fb: FormBuilder
  ) {
    this.recipeForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      imageUrl: ['', Validators.required],
      category: ['', Validators.required],
      prepTime: [0, [Validators.required, Validators.min(0)]],
      cookTime: [0, [Validators.required, Validators.min(0)]],
      servings: [1, [Validators.required, Validators.min(1)]],
      difficulty: ['Easy', Validators.required],
      ingredients: this.fb.array([], Validators.minLength(1)),
      instructions: this.fb.array([], Validators.minLength(1)),
      tags: [[], [Validators.required, Validators.minLength(1)]],
    });
  }

  ngOnInit(): void {
    this.loadWeekPlan();
    this.loadRecipes();
  }

  loadRecipes(): void {
    this.allRecipes = this.recipeService.getRecipes();
    this.filteredRecipes = [...this.allRecipes];
  }

  filterRecipes(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredRecipes = this.allRecipes.filter((recipe) =>
      recipe.title.toLowerCase().includes(term)
    );
  }

  openAddMeal(
    date: string,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks'
  ): void {
    this.selectedDate = date;
    this.selectedMealType = mealType;
    this.showRecipeModal = true;
    this.searchTerm = '';
    this.isCreatingRecipe = false;
    this.filterRecipes();
  }

  closeModal(): void {
    this.showRecipeModal = false;
    this.selectedDate = '';
    this.selectedMealType = null;
    this.isCreatingRecipe = false;
    this.recipeForm.reset({
      difficulty: 'Easy',
      servings: 1,
      prepTime: 0,
      cookTime: 0,
      tags: [],
    });
    this.ingredients.clear();
    this.instructions.clear();
  }

  selectRecipe(recipe: Recipe): void {
    if (this.selectedDate && this.selectedMealType) {
      this.mealPlanService.addRecipeToMealPlan(
        recipe.id,
        this.selectedDate,
        this.selectedMealType
      );
      this.loadWeekPlan();
      this.closeModal();
    }
  }

  loadWeekPlan(): void {
    this.weekPlan = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(this.currentWeekStart);
      date.setDate(date.getDate() + i);
      return {
        date: date.toISOString(),
        label: this.getDayLabel(date),
        meals: {},
      };
    });

    this.mealPlanService.getMealPlan().subscribe((mealPlan) => {
      mealPlan.forEach((entry) => {
        const dayPlan = this.weekPlan.find((day) => day.date === entry.date);
        if (dayPlan) {
          const recipe = this.recipeService.getRecipeById(entry.recipeId);
          if (recipe) {
            dayPlan.meals[entry.mealType] = recipe;
          }
        }
      });
    });
  }

  previousWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.loadWeekPlan();
  }

  nextWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.loadWeekPlan();
  }

  clearWeek(): void {
    const startDate = this.currentWeekStart.toISOString();
    const endDate = new Date(this.currentWeekStart);
    endDate.setDate(endDate.getDate() + 6);

    this.weekPlan.forEach((day) => {
      Object.keys(day.meals).forEach((mealType) => {
        this.mealPlanService.removeFromMealPlan(
          day.date,
          mealType as 'breakfast' | 'lunch' | 'dinner' | 'snacks'
        );
      });
    });

    this.loadWeekPlan();
  }

  removeMeal(
    date: string,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks'
  ): void {
    this.mealPlanService.removeFromMealPlan(date, mealType);
    const dayPlan = this.weekPlan.find((day) => day.date === date);
    if (dayPlan) {
      delete dayPlan.meals[mealType];
    }
  }

  getWeekRange(): string {
    const endDate = new Date(this.currentWeekStart);
    endDate.setDate(endDate.getDate() + 6);
    return `${this.formatDate(
      this.currentWeekStart.toISOString()
    )} - ${this.formatDate(endDate.toISOString())}`;
  }

  private getStartOfWeek(date: Date): Date {
    const result = new Date(date);
    result.setDate(result.getDate() - result.getDay());
    return result;
  }

  private getDayLabel(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  formatDate(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  get ingredients() {
    return this.recipeForm.get('ingredients') as FormArray;
  }

  get instructions() {
    return this.recipeForm.get('instructions') as FormArray;
  }

  addIngredient(): void {
    const ingredientForm = this.fb.group({
      name: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0)]],
      unit: ['', Validators.required],
    });
    this.ingredients.push(ingredientForm);
  }

  removeIngredient(index: number): void {
    this.ingredients.removeAt(index);
  }

  addInstruction(): void {
    this.instructions.push(this.fb.control('', Validators.required));
  }

  removeInstruction(index: number): void {
    this.instructions.removeAt(index);
  }

  updateTags(value: string): void {
    if (value.includes(',')) {
      const tags = value
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag);
      this.recipeForm.patchValue({
        tags: [...(this.recipeForm.get('tags')?.value || []), ...tags],
      });
      this.tagInput = '';
    }
  }

  removeTag(tagToRemove: string): void {
    const currentTags = this.recipeForm.get('tags')?.value || [];
    this.recipeForm.patchValue({
      tags: currentTags.filter((tag: string) => tag !== tagToRemove),
    });
  }

  createRecipe(): void {
    console.log('Form Value:', this.recipeForm.value);
    console.log('Form Valid:', this.recipeForm.valid);
    console.log('Form Errors:', this.recipeForm.errors);
    console.log('Ingredients Valid:', this.ingredients.valid);
    console.log('Instructions Valid:', this.instructions.valid);
    console.log('Tags Valid:', this.recipeForm.get('tags')?.valid);

    if (this.recipeForm.valid) {
      const formValue = this.recipeForm.value;
      const newRecipe: Recipe = {
        id: Date.now().toString(),
        ...formValue,
        isFavorite: false,
      };

      this.recipeService.addRecipe(newRecipe);
      this.selectRecipe(newRecipe);
      this.recipeForm.reset({
        difficulty: 'Easy',
        servings: 1,
        prepTime: 0,
        cookTime: 0,
        tags: [],
      });
      this.ingredients.clear();
      this.instructions.clear();
    }
  }
}
